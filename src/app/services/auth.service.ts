import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, of, throwError, from } from 'rxjs';
import { map, catchError, switchMap, first } from 'rxjs/operators';
import { DatabaseService } from './database.service';

/**
 * Interfaz para el usuario autenticado
 */
export interface User {
  id: string;
  email: string;
  displayName?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Servicio de autenticación usando SQLite local
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userSubject = new BehaviorSubject<User | null>(null);
  public user$ = this.userSubject.asObservable();
  private readonly SESSION_KEY = 'factura_llama_session';

  constructor(
    private database: DatabaseService,
    private router: Router
  ) {
    // Restaurar sesión desde localStorage si existe
    this.restoreSession();
  }

  /**
   * Restaura la sesión desde localStorage
   */
  private restoreSession(): void {
    const sessionData = localStorage.getItem(this.SESSION_KEY);
    if (sessionData) {
      try {
        const user = JSON.parse(sessionData);
        this.userSubject.next(user);
      } catch (error) {
        console.error('Error al restaurar sesión:', error);
        localStorage.removeItem(this.SESSION_KEY);
      }
    }
  }

  /**
   * Hashea una contraseña usando SHA-256
   * Nota: Para producción, usar bcrypt o similar
   */
  private async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Obtiene todos los usuarios registrados (útil para debugging)
   */
  getAllUsers(): Observable<{ id: string; email: string; display_name: string | null; created_at: string }[]> {
    return this.database.isReady$.pipe(
      first(ready => ready),
      switchMap(() => {
        return this.database.query<{ id: string; email: string; display_name: string | null; created_at: string }>(
          'SELECT id, email, display_name, created_at FROM users WHERE active = 1 ORDER BY created_at DESC'
        );
      }),
      catchError((error) => {
        console.error('Error al obtener usuarios:', error);
        return of([]);
      })
    );
  }

  /**
   * Inicia sesión con email y contraseña
   */
  login(email: string, password: string): Observable<User> {
    return this.database.isReady$.pipe(
      first(ready => ready),
      switchMap(() => from(this.hashPassword(password))),
      switchMap(() => {
        return this.database.query<{ id: string; email: string; password_hash: string; display_name: string | null }>(
          'SELECT id, email, password_hash, display_name FROM users WHERE email = ? AND active = 1',
          [email.toLowerCase().trim()]
        );
      }),
      switchMap(users => {
        if (users.length === 0) {
          return throwError(() => new Error('Correo o contraseña incorrectos'));
        }

        const user = users[0];
        return from(this.hashPassword(password)).pipe(
          switchMap(hash => {
            if (user.password_hash !== hash) {
              return throwError(() => new Error('Correo o contraseña incorrectos'));
            }

            const authenticatedUser: User = {
              id: user.id,
              email: user.email,
              displayName: user.display_name || undefined
            };

            // Guardar sesión
            localStorage.setItem(this.SESSION_KEY, JSON.stringify(authenticatedUser));
            this.userSubject.next(authenticatedUser);
            return of(authenticatedUser);
          })
        );
      }),
      catchError((error) => {
        return throwError(() => this.handleAuthError(error));
      })
    );
  }

  /**
   * Registra un nuevo usuario con email y contraseña
   */
  register(
    email: string, 
    password: string, 
    displayName?: string
  ): Observable<User> {
    // Validar email
    if (!this.isValidEmail(email)) {
      return throwError(() => new Error('Ingresa un correo electrónico válido'));
    }

    // Validar contraseña
    if (password.length < 6) {
      return throwError(() => new Error('La contraseña debe tener al menos 6 caracteres'));
    }

    return this.database.isReady$.pipe(
      first(ready => ready),
      switchMap(() => {
        // Verificar si el email ya existe
        return this.database.query<{ id: string }>(
          'SELECT id FROM users WHERE email = ?',
          [email.toLowerCase().trim()]
        );
      }),
      switchMap(existingUsers => {
        if (existingUsers.length > 0) {
          return throwError(() => new Error('Este correo electrónico ya está registrado'));
        }

        // Crear nuevo usuario
        const userId = this.generateUserId();
        return from(this.hashPassword(password)).pipe(
          switchMap(hash => {
            return this.database.execute(
              'INSERT INTO users (id, email, password_hash, display_name) VALUES (?, ?, ?, ?)',
              [userId, email.toLowerCase().trim(), hash, displayName || null]
            ).pipe(
              map(() => {
                const newUser: User = {
                  id: userId,
                  email: email.toLowerCase().trim(),
                  displayName: displayName
                };

                // Guardar sesión
                localStorage.setItem(this.SESSION_KEY, JSON.stringify(newUser));
                this.userSubject.next(newUser);
                return newUser;
              })
            );
          })
        );
      }),
      catchError((error) => {
        return throwError(() => this.handleAuthError(error));
      })
    );
  }

  /**
   * Cierra sesión del usuario
   */
  logout(): Observable<void> {
    localStorage.removeItem(this.SESSION_KEY);
    this.userSubject.next(null);
    this.router.navigate(['/login']);
    return of(undefined);
  }

  /**
   * Obtiene el usuario actual
   */
  getCurrentUser(): User | null {
    return this.userSubject.value;
  }

  /**
   * Obtiene el ID del usuario actual
   */
  getCurrentUserId(): string | null {
    return this.userSubject.value?.id || null;
  }

  /**
   * Observable que indica si el usuario está autenticado
   */
  isAuthenticated(): Observable<boolean> {
    return this.user$.pipe(
      map(user => user !== null)
    );
  }

  /**
   * Obtiene los datos del perfil del usuario
   */
  getUserProfile(userId: string): Observable<User | null> {
    return this.database.isReady$.pipe(
      first(ready => ready),
      switchMap(() => {
        return this.database.query<User & { display_name?: string }>(
          'SELECT id, email, display_name as displayName, created_at as createdAt, updated_at as updatedAt FROM users WHERE id = ?',
          [userId]
        );
      }),
      map(users => {
        if (users.length === 0) return null;
        const user = users[0];
        return {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        };
      }),
      catchError(() => of(null))
    );
  }

  /**
   * Envía un email para restablecer la contraseña
   * Nota: En desarrollo local, esto solo simula el proceso
   */
  sendPasswordReset(email: string): Observable<void> {
    if (!this.isValidEmail(email)) {
      return throwError(() => new Error('Ingresa un correo electrónico válido'));
    }

    return this.database.isReady$.pipe(
      first(ready => ready),
      switchMap(() => {
        return this.database.query<{ id: string }>(
          'SELECT id FROM users WHERE email = ? AND active = 1',
          [email.toLowerCase().trim()]
        );
      }),
      switchMap(users => {
        if (users.length === 0) {
          // Por seguridad, no revelamos si el email existe o no
          return of(undefined);
        }

        // En desarrollo, solo logueamos. En producción, enviarías un email real
        console.log(`[DEV] Email de recuperación enviado a: ${email}`);
        // Aquí podrías implementar un sistema de tokens de recuperación
        
        return of(undefined);
      }),
      catchError((error) => {
        return throwError(() => this.handleAuthError(error));
      })
    );
  }

  /**
   * Actualiza el perfil del usuario
   */
  updateProfile(userId: string, data: { displayName?: string }): Observable<void> {
    return this.database.isReady$.pipe(
      first(ready => ready),
      switchMap(() => {
        const updates: string[] = [];
        const params: any[] = [];

        if (data.displayName !== undefined) {
          updates.push('display_name = ?');
          params.push(data.displayName);
        }

        if (updates.length === 0) {
          return of(undefined);
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        params.push(userId);

        return this.database.execute(
          `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
          params
        ).pipe(
          map(() => {
            // Actualizar usuario en sesión
            const currentUser = this.userSubject.value;
            if (currentUser && currentUser.id === userId) {
              const updatedUser: User = {
                ...currentUser,
                displayName: data.displayName !== undefined ? data.displayName : currentUser.displayName
              };
              localStorage.setItem(this.SESSION_KEY, JSON.stringify(updatedUser));
              this.userSubject.next(updatedUser);
            }
            return undefined;
          })
        );
      })
    );
  }

  /**
   * Cambia la contraseña del usuario
   */
  changePassword(userId: string, currentPassword: string, newPassword: string): Observable<void> {
    if (newPassword.length < 6) {
      return throwError(() => new Error('La contraseña debe tener al menos 6 caracteres'));
    }

    return this.database.isReady$.pipe(
      first(ready => ready),
      switchMap(() => {
        return this.database.query<{ password_hash: string }>(
          'SELECT password_hash FROM users WHERE id = ?',
          [userId]
        );
      }),
      switchMap(users => {
        if (users.length === 0) {
          return throwError(() => new Error('Usuario no encontrado'));
        }

        const user = users[0];
        return from(this.hashPassword(currentPassword)).pipe(
          switchMap(currentHash => {
            if (user.password_hash !== currentHash) {
              return throwError(() => new Error('Contraseña actual incorrecta'));
            }

            return from(this.hashPassword(newPassword)).pipe(
              switchMap(newHash => {
                return this.database.execute(
                  'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                  [newHash, userId]
                );
              })
            );
          })
        );
      }),
      map(() => undefined)
    );
  }

  /**
   * Valida formato de email
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Genera un ID único para el usuario
   */
  private generateUserId(): string {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Maneja errores de autenticación y retorna mensajes en español
   */
  private handleAuthError(error: any): Error {
    let errorMessage = 'Ocurrió un error al iniciar sesión';

    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error?.message) {
      errorMessage = error.message;
    }

    return new Error(errorMessage);
  }
}
