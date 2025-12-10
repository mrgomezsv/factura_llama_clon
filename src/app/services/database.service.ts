import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { first } from 'rxjs/operators';

// Declarar tipos para sql.js sin importar directamente
declare function initSqlJs(config?: any): Promise<any>;

/**
 * Servicio para manejar la base de datos SQLite local
 * Usa sql.js (SQLite compilado a WebAssembly) para funcionar en el navegador
 */
@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private db: any = null;
  private sqlJs: any = null;
  private dbReady$ = new BehaviorSubject<boolean>(false);
  private readonly DB_STORAGE_KEY = 'factura_llama_db';

  constructor() {
    this.initializeDatabase();
  }

  /**
   * Inicializa la base de datos SQLite cargando sql.js desde CDN
   */
  private async initializeDatabase(): Promise<void> {
    try {
      // Cargar sql.js desde CDN usando script tag dinámico
      if (!(window as any).SQL) {
        await this.loadSqlJsFromCDN();
      }
      
      this.sqlJs = (window as any).SQL;
      const SQL = this.sqlJs;

      // Intentar cargar base de datos desde localStorage
      const savedDb = localStorage.getItem(this.DB_STORAGE_KEY);
      
      if (savedDb) {
        // Cargar base de datos existente
        const uint8Array = new Uint8Array(JSON.parse(savedDb));
        this.db = new SQL.Database(uint8Array);
      } else {
        // Crear nueva base de datos
        this.db = new SQL.Database();
        await this.createSchema();
        await this.seedInitialData();
        this.saveDatabase();
      }

      this.dbReady$.next(true);
    } catch (error) {
      console.error('Error al inicializar la base de datos:', error);
      // Crear base de datos vacía en caso de error
      try {
        if (this.sqlJs) {
          const SQL = this.sqlJs;
          this.db = new SQL.Database();
          await this.createSchema();
          this.saveDatabase();
          this.dbReady$.next(true);
        }
      } catch (e) {
        console.error('Error crítico al crear base de datos:', e);
      }
    }
  }

  /**
   * Carga sql.js desde CDN usando script tag
   */
  private loadSqlJsFromCDN(): Promise<void> {
    return new Promise((resolve, reject) => {
      if ((window as any).SQL) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://sql.js.org/dist/sql-wasm.js';
      script.async = true;
      script.onload = () => {
        // Inicializar sql.js
        (window as any).initSqlJs({
          locateFile: (file: string) => {
            if (file.endsWith('.wasm')) {
              return 'https://sql.js.org/dist/sql-wasm.wasm';
            }
            return `https://sql.js.org/dist/${file}`;
          }
        }).then((SQL: any) => {
          (window as any).SQL = SQL;
          resolve();
        }).catch(reject);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  /**
   * Observable que indica si la base de datos está lista
   */
  get isReady$(): Observable<boolean> {
    return this.dbReady$.asObservable();
  }

  /**
   * Verifica si la base de datos está lista
   */
  get isReady(): boolean {
    return this.db !== null && this.dbReady$.value;
  }

  /**
   * Crea el esquema de la base de datos
   */
  private async createSchema(): Promise<void> {
    if (!this.db) return;

    const schema = `
      -- Tabla de usuarios
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        display_name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        active INTEGER DEFAULT 1
      );

      -- Tabla de empresas
      CREATE TABLE IF NOT EXISTS empresas (
        id TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        nit TEXT,
        direccion TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Tabla de clientes
      CREATE TABLE IF NOT EXISTS clientes (
        id TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        correo TEXT,
        nit TEXT,
        nrc TEXT,
        direccion TEXT,
        telefono TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        active INTEGER DEFAULT 1
      );

      -- Tabla de productos
      CREATE TABLE IF NOT EXISTS productos (
        id TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        codigo TEXT,
        descripcion TEXT,
        precio_unitario REAL DEFAULT 0,
        unidad_medida TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        active INTEGER DEFAULT 1
      );

      -- Tabla de sucursales
      CREATE TABLE IF NOT EXISTS sucursales (
        id TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        direccion TEXT,
        telefono TEXT,
        empresa_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        active INTEGER DEFAULT 1,
        FOREIGN KEY (empresa_id) REFERENCES empresas(id)
      );

      -- Tabla de formas de pago
      CREATE TABLE IF NOT EXISTS formas_pago (
        id TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        codigo TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Tabla de tipos de DTE
      CREATE TABLE IF NOT EXISTS tipos_dte (
        codigo TEXT PRIMARY KEY,
        nombre TEXT NOT NULL,
        habilitado INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Tabla de DTEs
      CREATE TABLE IF NOT EXISTS dtes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        control_number TEXT UNIQUE NOT NULL,
        tipo TEXT NOT NULL,
        receptor TEXT NOT NULL,
        total REAL NOT NULL DEFAULT 0,
        ambiente TEXT NOT NULL DEFAULT 'PRUEBAS',
        fecha_creacion DATETIME NOT NULL,
        empresa_id TEXT,
        cliente_id TEXT,
        estado TEXT DEFAULT 'BORRADOR',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (empresa_id) REFERENCES empresas(id),
        FOREIGN KEY (cliente_id) REFERENCES clientes(id)
      );

      -- Índices para mejorar rendimiento
      CREATE INDEX IF NOT EXISTS idx_dtes_fecha ON dtes(fecha_creacion);
      CREATE INDEX IF NOT EXISTS idx_dtes_tipo ON dtes(tipo);
      CREATE INDEX IF NOT EXISTS idx_dtes_control_number ON dtes(control_number);
      CREATE INDEX IF NOT EXISTS idx_clientes_nombre ON clientes(nombre);
      CREATE INDEX IF NOT EXISTS idx_productos_codigo ON productos(codigo);
    `;

    this.db.run(schema);
  }

  /**
   * Inserta datos iniciales desde los archivos mock
   */
  private async seedInitialData(): Promise<void> {
    if (!this.db) return;

    // Empresas
    const empresas = [
      ['1', 'BARLLENO APP', '0614-123456-001-2', 'San Salvador, El Salvador'],
      ['2', 'COMERCIAL SAN MIGUEL S.A. DE C.V.', '0614-234567-001-3', 'San Miguel, El Salvador'],
      ['3', 'DISTRIBUIDORA OCCIDENTAL LTDA', '0614-345678-001-4', 'Santa Ana, El Salvador']
    ];

    empresas.forEach(emp => {
      this.db.run(
        'INSERT OR IGNORE INTO empresas (id, nombre, nit, direccion) VALUES (?, ?, ?, ?)',
        emp
      );
    });

    // Tipos de DTE
    const tiposDte = [
      ['FAC', 'Factura', 1],
      ['CCF', 'Comprobante Crédito Fiscal', 1],
      ['NCR', 'Nota de Crédito', 1],
      ['NDB', 'Nota de Débito', 1],
      ['FSE', 'Factura de Sujeto Excluido', 1],
      ['FEX', 'Factura de Exportación', 1],
      ['REM', 'Nota de Remisión', 1],
      ['CRT', 'Comprobante de Retención', 1]
    ];

    tiposDte.forEach(tipo => {
      this.db.run(
        'INSERT OR IGNORE INTO tipos_dte (codigo, nombre, habilitado) VALUES (?, ?, ?)',
        tipo
      );
    });


    // Formas de pago
    const formasPago = [
      ['fp1', 'Efectivo'],
      ['fp2', 'Cheque'],
      ['fp3', 'Transferencia'],
      ['fp4', 'Tarjeta de Crédito'],
      ['fp5', 'Tarjeta de Débito']
    ];

    formasPago.forEach(fp => {
      this.db.run(
        'INSERT OR IGNORE INTO formas_pago (id, nombre) VALUES (?, ?)',
        fp
      );
    });

    // Usuario de prueba por defecto (email: admin@test.com, password: admin123)
    // Hash SHA-256 de "admin123" = 240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9
    const defaultUser = [
      'user_default',
      'admin@test.com',
      '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
      'Usuario Administrador'
    ];

    this.db.run(
      'INSERT OR IGNORE INTO users (id, email, password_hash, display_name) VALUES (?, ?, ?, ?)',
      defaultUser
    );

    // DTEs de ejemplo (algunos de los datos mock)
    const dtes = [
      ['DTE-03-M001P001-000000000000346', 'CCF', 'JUAN CARLOS FERRUFINO HERNANDEZ', 181.93, 'PRODUCCIÓN', '2025-10-13T12:36:43'],
      ['DTE-03-M001P001-000000000000345', 'CCF', 'UNO EL SALVADOR, SOCIEDAD ANONIMA', 160.16, 'PRODUCCIÓN', '2025-10-13T12:06:55'],
      ['DTE-03-M001P001-000000000000344', 'CCF', 'UNO EL SALVADOR, SOCIEDAD ANONIMA', 206.08, 'PRODUCCIÓN', '2025-10-13T11:45:22'],
      ['DTE-03-M001P001-000000000000343', 'CCF', 'CARLOS ALBERTO MARTINEZ RODRIGUEZ', 203.84, 'PRODUCCIÓN', '2025-10-13T12:06:55'],
      ['DTE-03-M001P001-000000000000342', 'CCF', 'MARIA ELENA LOPEZ GARCIA', 644.00, 'PRODUCCIÓN', '2025-10-11T14:20:39'],
      ['DTE-03-M001P001-000000000000341', 'CCF', 'JOSE ANTONIO RAMIREZ MENDOZA', 143.36, 'PRODUCCIÓN', '2025-10-11T14:15:30']
    ];

    dtes.forEach(dte => {
      this.db.run(
        'INSERT OR IGNORE INTO dtes (control_number, tipo, receptor, total, ambiente, fecha_creacion) VALUES (?, ?, ?, ?, ?, ?)',
        dte
      );
    });
  }

  /**
   * Guarda la base de datos en localStorage
   */
  private saveDatabase(): void {
    if (!this.db) return;
    
    try {
      const data = this.db.export();
      const buffer = Array.from(data);
      localStorage.setItem(this.DB_STORAGE_KEY, JSON.stringify(buffer));
    } catch (error) {
      console.error('Error al guardar la base de datos:', error);
    }
  }

  /**
   * Ejecuta una consulta SELECT y retorna los resultados
   */
  query<T = any>(sql: string, params: any[] = []): Observable<T[]> {
    return new Observable(observer => {
      if (!this.isReady) {
        this.isReady$.pipe(first(ready => ready)).subscribe(ready => {
          if (ready) {
            this.executeQuery<T>(sql, params, observer);
          }
        });
      } else {
        this.executeQuery<T>(sql, params, observer);
      }
    });
  }

  private executeQuery<T>(sql: string, params: any[], observer: any): void {
    try {
      if (!this.db) {
        observer.error(new Error('Base de datos no inicializada'));
        return;
      }

      const stmt = this.db.prepare(sql);
      stmt.bind(params);
      
      const results: T[] = [];
      while (stmt.step()) {
        const row = stmt.getAsObject() as T;
        results.push(row);
      }
      
      stmt.free();
      this.saveDatabase();
      observer.next(results);
      observer.complete();
    } catch (error) {
      observer.error(error);
    }
  }

  /**
   * Ejecuta una consulta INSERT, UPDATE o DELETE
   */
  execute(sql: string, params: any[] = []): Observable<number> {
    return new Observable(observer => {
      if (!this.isReady) {
        this.isReady$.pipe(first(ready => ready)).subscribe(ready => {
          if (ready) {
            this.executeStatement(sql, params, observer);
          }
        });
      } else {
        this.executeStatement(sql, params, observer);
      }
    });
  }

  private executeStatement(sql: string, params: any[], observer: any): void {
    try {
      if (!this.db) {
        observer.error(new Error('Base de datos no inicializada'));
        return;
      }

      this.db.run(sql, params);
      const changes = this.db.getRowsModified();
      this.saveDatabase();
      observer.next(changes);
      observer.complete();
    } catch (error) {
      observer.error(error);
    }
  }

  /**
   * Ejecuta múltiples statements en una transacción
   */
  transaction(statements: Array<{ sql: string; params?: any[] }>): Observable<void> {
    return new Observable(observer => {
      if (!this.isReady) {
        this.isReady$.pipe(first(ready => ready)).subscribe(ready => {
          if (ready) {
            this.executeTransaction(statements, observer);
          }
        });
      } else {
        this.executeTransaction(statements, observer);
      }
    });
  }

  private executeTransaction(statements: Array<{ sql: string; params?: any[] }>, observer: any): void {
    try {
      if (!this.db) {
        observer.error(new Error('Base de datos no inicializada'));
        return;
      }

      this.db.run('BEGIN TRANSACTION');
      
      for (const stmt of statements) {
        this.db.run(stmt.sql, stmt.params || []);
      }
      
      this.db.run('COMMIT');
      this.saveDatabase();
      observer.next();
      observer.complete();
    } catch (error) {
      if (this.db) {
        this.db.run('ROLLBACK');
      }
      observer.error(error);
    }
  }

  /**
   * Exporta la base de datos como ArrayBuffer
   */
  exportDatabase(): Uint8Array | null {
    if (!this.db) return null;
    return this.db.export();
  }

  /**
   * Importa una base de datos desde un ArrayBuffer
   */
  importDatabase(data: Uint8Array): void {
    if (this.db) {
      this.db.close();
    }
    if (this.sqlJs) {
      this.db = new this.sqlJs.Database(data);
      this.saveDatabase();
    }
  }

  /**
   * Limpia toda la base de datos (útil para desarrollo)
   */
  clearDatabase(): Observable<void> {
    return new Observable(observer => {
      if (!this.isReady) {
        observer.error(new Error('Base de datos no inicializada'));
        return;
      }

      try {
        localStorage.removeItem(this.DB_STORAGE_KEY);
        this.initializeDatabase().then(() => {
          observer.next();
          observer.complete();
        });
      } catch (error) {
        observer.error(error);
      }
    });
  }
}
