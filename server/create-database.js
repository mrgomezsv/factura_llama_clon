const { Client } = require('pg');
require('dotenv').config();

const adminClient = new Client({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: 'postgres', // Conectarse a la BD por defecto para crear la nueva
  user: process.env.DB_USER || 'mrgomez',
  password: process.env.DB_PASSWORD || 'Karin2100',
});

const dbName = process.env.DB_NAME || 'factura_llama_clon_db';

async function createDatabase() {
  try {
    await adminClient.connect();
    console.log('✅ Conectado a PostgreSQL como administrador');

    // Verificar si la base de datos ya existe
    const checkDb = await adminClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (checkDb.rows.length > 0) {
      console.log(`⚠️  La base de datos "${dbName}" ya existe`);
    } else {
      // Crear la base de datos
      await adminClient.query(`CREATE DATABASE ${dbName}`);
      console.log(`✅ Base de datos "${dbName}" creada exitosamente`);
    }

    await adminClient.end();

    // Conectarse a la nueva base de datos para crear las tablas
    const dbClient = new Client({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: dbName,
      user: process.env.DB_USER || 'mrgomez',
      password: process.env.DB_PASSWORD || 'Karin2100',
    });

    await dbClient.connect();
    console.log(`✅ Conectado a la base de datos "${dbName}"`);

    // Crear las tablas
    await createTables(dbClient);

    await dbClient.end();
    console.log('✅ Migración completada exitosamente');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

async function createTables(client) {
  const schema = `
    -- Tabla de usuarios
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      active INTEGER DEFAULT 1
    );

    -- Tabla de empresas
    CREATE TABLE IF NOT EXISTS empresas (
      id TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      nit TEXT,
      direccion TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      active INTEGER DEFAULT 1
    );

    -- Tabla de sucursales
    CREATE TABLE IF NOT EXISTS sucursales (
      id TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      direccion TEXT,
      telefono TEXT,
      empresa_id TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      active INTEGER DEFAULT 1,
      FOREIGN KEY (empresa_id) REFERENCES empresas(id)
    );

    -- Tabla de formas de pago
    CREATE TABLE IF NOT EXISTS formas_pago (
      id TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      codigo TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabla de tipos de DTE
    CREATE TABLE IF NOT EXISTS tipos_dte (
      codigo TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      habilitado INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabla de DTEs
    CREATE TABLE IF NOT EXISTS dtes (
      id SERIAL PRIMARY KEY,
      control_number TEXT UNIQUE NOT NULL,
      tipo TEXT NOT NULL,
      tipo_dte TEXT,
      codigo_generacion TEXT UNIQUE,
      numero_control TEXT,
      numero_documento INTEGER,
      receptor TEXT NOT NULL,
      total REAL NOT NULL DEFAULT 0,
      ambiente TEXT NOT NULL DEFAULT 'PRUEBAS',
      fecha_creacion TIMESTAMP NOT NULL,
      fecha_emision TIMESTAMP,
      fecha_envio TIMESTAMP,
      fecha_autorizacion TIMESTAMP,
      empresa_id TEXT,
      cliente_id TEXT,
      estado TEXT DEFAULT 'BORRADOR',
      dte_json TEXT,
      dte_firmado TEXT,
      sello_recibido TEXT,
      codigo_mensaje TEXT,
      descripcion_mensaje TEXT,
      observaciones TEXT,
      pdf_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (empresa_id) REFERENCES empresas(id),
      FOREIGN KEY (cliente_id) REFERENCES clientes(id)
    );

    -- Tabla de configuración de usuario
    CREATE TABLE IF NOT EXISTS user_config (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      telefono TEXT,
      zona_horaria TEXT DEFAULT 'El Salvador (GMT-6)',
      rol TEXT DEFAULT 'PROPIETARIO',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- Tabla de configuración de empresa
    CREATE TABLE IF NOT EXISTS empresa_config (
      id TEXT PRIMARY KEY,
      empresa_id TEXT NOT NULL,
      nombre_legal TEXT,
      nombre_comercial TEXT,
      nit TEXT,
      nrc TEXT,
      dui TEXT,
      actividad_economica_primaria TEXT,
      actividad_economica_secundaria TEXT,
      actividad_economica_terciaria TEXT,
      direccion TEXT,
      codigo_mh TEXT,
      puntos_venta INTEGER DEFAULT 1,
      sitio_web TEXT,
      telefono TEXT,
      correo TEXT,
      logo_url TEXT,
      certificado_prueba TEXT,
      password_api_prueba TEXT,
      certificado_produccion TEXT,
      password_api_produccion TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (empresa_id) REFERENCES empresas(id)
    );

    -- Índices para mejorar rendimiento
    CREATE INDEX IF NOT EXISTS idx_dtes_fecha ON dtes(fecha_creacion);
    CREATE INDEX IF NOT EXISTS idx_dtes_tipo ON dtes(tipo);
    CREATE INDEX IF NOT EXISTS idx_dtes_control_number ON dtes(control_number);
    CREATE INDEX IF NOT EXISTS idx_clientes_nombre ON clientes(nombre);
    CREATE INDEX IF NOT EXISTS idx_productos_codigo ON productos(codigo);
    CREATE INDEX IF NOT EXISTS idx_user_config_user_id ON user_config(user_id);
    CREATE INDEX IF NOT EXISTS idx_empresa_config_empresa_id ON empresa_config(empresa_id);
  `;

  await client.query(schema);
  console.log('✅ Tablas creadas exitosamente');
  
  // Migraciones: Agregar campos si no existen
  const migrations = [
    {
      table: 'empresa_config',
      column: 'logo_url',
      type: 'TEXT'
    },
    {
      table: 'dtes',
      column: 'tipo_dte',
      type: 'TEXT'
    },
    {
      table: 'dtes',
      column: 'codigo_generacion',
      type: 'TEXT'
    },
    {
      table: 'dtes',
      column: 'numero_control',
      type: 'TEXT'
    },
    {
      table: 'dtes',
      column: 'numero_documento',
      type: 'INTEGER'
    },
    {
      table: 'dtes',
      column: 'fecha_emision',
      type: 'TIMESTAMP'
    },
    {
      table: 'dtes',
      column: 'fecha_envio',
      type: 'TIMESTAMP'
    },
    {
      table: 'dtes',
      column: 'fecha_autorizacion',
      type: 'TIMESTAMP'
    },
    {
      table: 'dtes',
      column: 'dte_json',
      type: 'TEXT'
    },
    {
      table: 'dtes',
      column: 'dte_firmado',
      type: 'TEXT'
    },
    {
      table: 'dtes',
      column: 'sello_recibido',
      type: 'TEXT'
    },
    {
      table: 'dtes',
      column: 'codigo_mensaje',
      type: 'TEXT'
    },
    {
      table: 'dtes',
      column: 'descripcion_mensaje',
      type: 'TEXT'
    },
    {
      table: 'dtes',
      column: 'observaciones',
      type: 'TEXT'
    },
    {
      table: 'dtes',
      column: 'pdf_url',
      type: 'TEXT'
    }
  ];

  for (const migration of migrations) {
    try {
      // Verificar si la columna ya existe
      const checkColumn = await client.query(`
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = $1 AND column_name = $2
      `, [migration.table, migration.column]);

      if (checkColumn.rows.length === 0) {
        // La columna no existe, agregarla usando formato seguro
        const alterQuery = `ALTER TABLE "${migration.table}" ADD COLUMN "${migration.column}" ${migration.type}`;
        await client.query(alterQuery);
        console.log(`✅ Campo ${migration.column} agregado a ${migration.table}`);
      } else {
        console.log(`ℹ️  Campo ${migration.column} ya existe en ${migration.table}`);
      }
    } catch (error) {
      if (!error.message.includes('already exists') && !error.message.includes('duplicate') && !error.message.includes('column') && !error.message.includes('already')) {
        console.log(`⚠️  Error en migración de ${migration.column}:`, error.message);
      }
    }
  }
  
  // Agregar índice único para codigo_generacion si no existe
  try {
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_dtes_codigo_generacion ON dtes(codigo_generacion) WHERE codigo_generacion IS NOT NULL;
    `);
  } catch (error) {
    // Ignorar si ya existe
  }
  
  console.log('✅ Migraciones completadas');

  // Insertar datos iniciales necesarios
  await seedInitialData(client);
}

async function seedInitialData(client) {
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

  for (const tipo of tiposDte) {
    await client.query(
      'INSERT INTO tipos_dte (codigo, nombre, habilitado) VALUES ($1, $2, $3) ON CONFLICT (codigo) DO NOTHING',
      tipo
    );
  }

  // Formas de pago
  const formasPago = [
    ['fp1', 'Efectivo'],
    ['fp2', 'Cheque'],
    ['fp3', 'Transferencia'],
    ['fp4', 'Tarjeta de Crédito'],
    ['fp5', 'Tarjeta de Débito']
  ];

  for (const fp of formasPago) {
    await client.query(
      'INSERT INTO formas_pago (id, nombre) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING',
      fp
    );
  }

  console.log('✅ Datos iniciales insertados');
}

createDatabase();
