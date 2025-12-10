import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError, firstValueFrom } from 'rxjs';
import { first, catchError, map, switchMap } from 'rxjs/operators';

/**
 * Servicio para manejar la base de datos PostgreSQL
 * Se conecta a través de un backend API Express
 */
@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private dbReady$ = new BehaviorSubject<boolean>(false);
  private readonly API_URL = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {
    this.initializeDatabase();
  }

  /**
   * Inicializa la conexión con la base de datos
   */
  private async initializeDatabase(): Promise<void> {
    try {
      // Verificar que el backend esté disponible
      const healthCheck = await firstValueFrom(this.http.get(`${this.API_URL}/health`));
      console.log('✅ Conectado a PostgreSQL a través del backend');
      this.dbReady$.next(true);
    } catch (error) {
      console.error('❌ Error al conectar con el backend:', error);
      console.error('⚠️  Asegúrate de que el servidor backend esté corriendo en http://localhost:3000');
      // Intentar nuevamente después de un delay
      setTimeout(() => this.initializeDatabase(), 2000);
    }
  }

  /**
   * Observable que indica si la base de datos está lista
   */
  get isReady$(): Observable<boolean> {
    return this.dbReady$.asObservable();
  }

  /**
   * Propiedad que indica si la base de datos está lista
   */
  get isReady(): boolean {
    return this.dbReady$.value;
  }

  /**
   * Ejecuta una consulta SELECT y retorna los resultados
   */
  query<T = any>(sql: string, params: any[] = []): Observable<T[]> {
    return this.isReady$.pipe(
      first(ready => ready),
      switchMap(() => {
        // Convertir parámetros ? a $1, $2, etc. y SQLite a PostgreSQL
        const { pgSql, pgParams } = this.convertSqliteToPostgres(sql, params);
        return this.http.post<T[]>(`${this.API_URL}/query`, {
          sql: pgSql,
          params: pgParams
        });
      }),
      catchError(error => {
        console.error('Error en query:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Ejecuta una consulta INSERT, UPDATE o DELETE
   */
  execute(sql: string, params: any[] = []): Observable<number> {
    return this.isReady$.pipe(
      first(ready => ready),
      switchMap(() => {
        // Convertir parámetros ? a $1, $2, etc. y SQLite a PostgreSQL
        const { pgSql, pgParams } = this.convertSqliteToPostgres(sql, params);
        return this.http.post<{ rowCount: number }>(`${this.API_URL}/execute`, {
          sql: pgSql,
          params: pgParams
        });
      }),
      map(result => result.rowCount || 0),
      catchError(error => {
        console.error('Error en execute:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Convierte sintaxis de SQLite a PostgreSQL y parámetros
   */
  private convertSqliteToPostgres(sql: string, params: any[]): { pgSql: string; pgParams: any[] } {
    let pgSql = sql;
    const pgParams: any[] = [];

    // Primero convertir funciones específicas de SQLite
    // Reemplazar strftime de SQLite por funciones de PostgreSQL
    pgSql = pgSql.replace(/strftime\("%m",\s*([^)]+)\)/gi, (match, col) => {
      return `EXTRACT(MONTH FROM ${col.trim()})`;
    });
    pgSql = pgSql.replace(/strftime\("%Y",\s*([^)]+)\)/gi, (match, col) => {
      return `EXTRACT(YEAR FROM ${col.trim()})`;
    });
    pgSql = pgSql.replace(/strftime\("%d",\s*([^)]+)\)/gi, (match, col) => {
      return `EXTRACT(DAY FROM ${col.trim()})`;
    });
    
    // Reemplazar DATETIME por TIMESTAMP
    pgSql = pgSql.replace(/DATETIME/gi, 'TIMESTAMP');
    
    // Reemplazar INTEGER PRIMARY KEY AUTOINCREMENT por SERIAL PRIMARY KEY
    pgSql = pgSql.replace(/INTEGER PRIMARY KEY AUTOINCREMENT/gi, 'SERIAL PRIMARY KEY');
    
    // Reemplazar INSERT OR IGNORE (se manejará en el backend)
    pgSql = pgSql.replace(/INSERT OR IGNORE/gi, 'INSERT');

    // Convertir placeholders ? a $1, $2, etc.
    let paramIndex = 1;
    pgSql = pgSql.replace(/\?/g, () => {
      const param = params[paramIndex - 1];
      pgParams.push(param);
      return `$${paramIndex++}`;
    });

    return { pgSql, pgParams };
  }

  /**
   * Limpia toda la base de datos (útil para desarrollo)
   */
  clearDatabase(): Observable<void> {
    return throwError(() => new Error('clearDatabase no está disponible con PostgreSQL. Usa el script de migración.'));
  }
}
