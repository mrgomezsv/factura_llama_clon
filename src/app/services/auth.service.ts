import { Injectable } from '@angular/core';
import { 
  Auth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut, 
  User,
  UserCredential 
} from '@angular/fire/auth';
import { Router } from '@angular/router';
import { Observable, from, of, BehaviorSubject } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { Firestore, doc, docData, setDoc, serverTimestamp } from '@angular/fire/firestore';

/**
 * Servicio de autenticación usando Firebase Auth
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userSubject = new BehaviorSubject<User | null>(null);
  public user$ = this.userSubject.asObservable();

  constructor(
    private auth: Auth,
    private router: Router,
    private firestore: Firestore
  ) {
    // Suscribirse a cambios de estado de autenticación
    this.auth.onAuthStateChanged((user) => {
      this.userSubject.next(user);
    });
  }

  /**
   * Inicia sesión con email y contraseña
   */
  login(email: string, password: string): Observable<User> {
    return from(signInWithEmailAndPassword(this.auth, email, password)).pipe(
      map((userCredential: UserCredential) => {
        return userCredential.user;
      }),
      catchError((error) => {
        throw this.handleAuthError(error);
      })
    );
  }

  /**
   * Registra un nuevo usuario con email y contraseña
   * Opcionalmente crea un perfil inicial en Firestore
   */
  register(
    email: string, 
    password: string, 
    displayName?: string
  ): Observable<User> {
    return from(createUserWithEmailAndPassword(this.auth, email, password)).pipe(
      switchMap((userCredential: UserCredential) => {
        const user = userCredential.user;
        
        // Crear perfil básico en Firestore si se proporciona displayName
        if (displayName && user.uid) {
          return this.createUserProfile(user.uid, {
            email: user.email || email,
            displayName: displayName,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          }).pipe(
            map(() => user),
            catchError((error) => {
              console.error('Error al crear perfil de usuario:', error);
              // Retornar usuario aunque falle crear perfil (se puede crear después)
              return of(user);
            })
          );
        }
        
        return of(user);
      }),
      catchError((error) => {
        throw this.handleAuthError(error);
      })
    );
  }

  /**
   * Crea o actualiza el perfil del usuario en Firestore
   */
  createUserProfile(userId: string, userData: any): Observable<void> {
    const userDocRef = doc(this.firestore, `users/${userId}`);
    return from(setDoc(userDocRef, {
      ...userData,
      updatedAt: serverTimestamp()
    }, { merge: true }));
  }

  /**
   * Cierra sesión del usuario
   */
  logout(): Observable<void> {
    return from(signOut(this.auth)).pipe(
      map(() => {
        this.router.navigate(['/login']);
        return undefined;
      }),
      catchError((error) => {
        console.error('Error al cerrar sesión:', error);
        throw error;
      })
    );
  }

  /**
   * Obtiene el usuario actual
   */
  getCurrentUser(): User | null {
    return this.auth.currentUser;
  }

  /**
   * Obtiene el ID del usuario actual
   */
  getCurrentUserId(): string | null {
    return this.auth.currentUser?.uid || null;
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
   * Obtiene los datos del perfil del usuario desde Firestore
   */
  getUserProfile(userId: string): Observable<any> {
    const userDocRef = doc(this.firestore, `users/${userId}`);
    return docData(userDocRef).pipe(
      catchError((error) => {
        console.error('Error al obtener perfil de usuario:', error);
        return of(null);
      })
    );
  }

  /**
   * Envía un email para restablecer la contraseña
   */
  sendPasswordReset(email: string): Observable<void> {
    return from(sendPasswordResetEmail(this.auth, email)).pipe(
      catchError((error) => {
        throw this.handleAuthError(error);
      })
    );
  }

  /**
   * Maneja errores de autenticación y retorna mensajes en español
   */
  private handleAuthError(error: any): Error {
    let errorMessage = 'Ocurrió un error al iniciar sesión';

    switch (error.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        errorMessage = 'Correo o contraseña incorrectos';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Ingresa un correo electrónico válido';
        break;
      case 'auth/user-disabled':
        errorMessage = 'Esta cuenta ha sido deshabilitada';
        break;
      case 'auth/too-many-requests':
        errorMessage = 'Demasiados intentos fallidos. Por favor intenta más tarde';
        break;
      case 'auth/network-request-failed':
        errorMessage = 'Error de conexión. Verifica tu internet';
        break;
      case 'auth/weak-password':
        errorMessage = 'La contraseña es muy débil. Debe tener al menos 6 caracteres';
        break;
      case 'auth/email-already-in-use':
        errorMessage = 'Este correo electrónico ya está registrado';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Ingresa un correo electrónico válido';
        break;
      case 'auth/operation-not-allowed':
        errorMessage = 'Esta operación no está permitida. Contacta al administrador';
        break;
      default:
        errorMessage = error.message || 'Ocurrió un error inesperado';
    }

    const customError = new Error(errorMessage);
    (customError as any).code = error.code;
    return customError;
  }
}

