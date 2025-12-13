const { Client } = require('pg');
require('dotenv').config();

const dbName = process.env.DB_NAME || 'factura_llama_clon_db';

/**
 * Script de migración para crear tablas separadas por tipo de documento
 * y migrar datos existentes de la tabla dtes
 */

async function migrate() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: dbName,
    user: process.env.DB_USER || 'mrgomez',
    password: process.env.DB_PASSWORD || 'Karin2100',
  });

  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos');

    // Crear las nuevas tablas
    await createSeparateTables(client);
    
    // Migrar datos existentes
    await migrateExistingData(client);
    
    console.log('✅ Migración completada exitosamente');
  } catch (error) {
    console.error('❌ Error en la migración:', error);
    throw error;
  } finally {
    await client.end();
  }
}

/**
 * Crea las tablas separadas para cada tipo de documento
 */
async function createSeparateTables(client) {
  console.log('📋 Creando tablas separadas por tipo de documento...');

  // Estructura base común para todas las tablas
  const baseTableStructure = `
    id SERIAL PRIMARY KEY,
    control_number TEXT UNIQUE NOT NULL,
    tipo_dte TEXT NOT NULL,
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
  `;

  // Mapeo de tipos de documento a nombres de tabla
  const tablas = [
    { tipo: 'FAC', nombre: 'documento_factura', descripcion: 'Facturas Consumidor Final' },
    { tipo: 'CCF', nombre: 'documento_credito_fiscal', descripcion: 'Créditos Fiscales' },
    { tipo: 'NCR', nombre: 'documento_nota_credito', descripcion: 'Notas de Crédito' },
    { tipo: 'NDB', nombre: 'documento_nota_debito', descripcion: 'Notas de Débito' },
    { tipo: 'FSE', nombre: 'documento_factura_sujeto_excluido', descripcion: 'Facturas Sujeto Excluido' },
    { tipo: 'FEX', nombre: 'documento_factura_exportacion', descripcion: 'Facturas de Exportación' },
    { tipo: 'REM', nombre: 'documento_nota_remision', descripcion: 'Notas de Remisión' },
    { tipo: 'CRT', nombre: 'documento_comprobante_retencion', descripcion: 'Comprobantes de Retención' }
  ];

  for (const tabla of tablas) {
    try {
      // Verificar si la tabla ya existe
      const checkTable = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `, [tabla.nombre]);

      if (checkTable.rows[0].exists) {
        console.log(`ℹ️  La tabla ${tabla.nombre} ya existe, omitiendo creación`);
        continue;
      }

      // Crear la tabla
      await client.query(`
        CREATE TABLE IF NOT EXISTS ${tabla.nombre} (
          ${baseTableStructure}
        );
      `);

      // Crear índices para cada tabla
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_${tabla.nombre}_fecha ON ${tabla.nombre}(fecha_creacion);
        CREATE INDEX IF NOT EXISTS idx_${tabla.nombre}_control_number ON ${tabla.nombre}(control_number);
        CREATE INDEX IF NOT EXISTS idx_${tabla.nombre}_numero_documento ON ${tabla.nombre}(numero_documento);
        CREATE INDEX IF NOT EXISTS idx_${tabla.nombre}_empresa_id ON ${tabla.nombre}(empresa_id);
        CREATE INDEX IF NOT EXISTS idx_${tabla.nombre}_cliente_id ON ${tabla.nombre}(cliente_id);
        CREATE INDEX IF NOT EXISTS idx_${tabla.nombre}_estado ON ${tabla.nombre}(estado);
      `);

      console.log(`✅ Tabla ${tabla.nombre} (${tabla.descripcion}) creada exitosamente`);
    } catch (error) {
      console.error(`❌ Error al crear tabla ${tabla.nombre}:`, error.message);
      throw error;
    }
  }

  console.log('✅ Todas las tablas creadas exitosamente');
}

/**
 * Migra los datos existentes de la tabla dtes a las nuevas tablas
 */
async function migrateExistingData(client) {
  console.log('📦 Migrando datos existentes...');

  // Mapeo de tipos a nombres de tabla
  const tipoToTable = {
    'FAC': 'documento_factura',
    'CCF': 'documento_credito_fiscal',
    'NCR': 'documento_nota_credito',
    'NDB': 'documento_nota_debito',
    'FSE': 'documento_factura_sujeto_excluido',
    'FEX': 'documento_factura_exportacion',
    'REM': 'documento_nota_remision',
    'CRT': 'documento_comprobante_retencion'
  };

  // Obtener todos los datos de la tabla dtes
  const result = await client.query(`
    SELECT * FROM dtes ORDER BY id
  `);

  if (result.rows.length === 0) {
    console.log('ℹ️  No hay datos para migrar');
    return;
  }

  console.log(`📊 Encontrados ${result.rows.length} documentos para migrar`);

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const row of result.rows) {
    const tipo = row.tipo;
    const tablaDestino = tipoToTable[tipo];

    if (!tablaDestino) {
      console.warn(`⚠️  Tipo de documento desconocido: ${tipo}, omitiendo registro ID: ${row.id}`);
      skipped++;
      continue;
    }

    try {
      // Verificar si ya existe en la tabla destino (por control_number)
      const checkExists = await client.query(`
        SELECT id FROM ${tablaDestino} WHERE control_number = $1
      `, [row.control_number]);

      if (checkExists.rows.length > 0) {
        console.log(`ℹ️  Documento ${row.control_number} ya existe en ${tablaDestino}, omitiendo`);
        skipped++;
        continue;
      }

      // Insertar en la tabla correspondiente
      await client.query(`
        INSERT INTO ${tablaDestino} (
          control_number, tipo_dte, codigo_generacion, numero_control, numero_documento,
          receptor, total, ambiente, fecha_creacion, fecha_emision, fecha_envio, fecha_autorizacion,
          empresa_id, cliente_id, estado, dte_json, dte_firmado, sello_recibido,
          codigo_mensaje, descripcion_mensaje, observaciones, pdf_url, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24)
      `, [
        row.control_number,
        row.tipo_dte || row.tipo,
        row.codigo_generacion,
        row.numero_control,
        row.numero_documento,
        row.receptor,
        row.total,
        row.ambiente,
        row.fecha_creacion,
        row.fecha_emision,
        row.fecha_envio,
        row.fecha_autorizacion,
        row.empresa_id,
        row.cliente_id,
        row.estado,
        row.dte_json,
        row.dte_firmado,
        row.sello_recibido,
        row.codigo_mensaje,
        row.descripcion_mensaje,
        row.observaciones,
        row.pdf_url,
        row.created_at,
        row.updated_at
      ]);

      migrated++;
      if (migrated % 10 === 0) {
        console.log(`📊 Migrados ${migrated} documentos...`);
      }
    } catch (error) {
      console.error(`❌ Error al migrar documento ID ${row.id} (${row.control_number}):`, error.message);
      errors++;
    }
  }

  console.log(`\n✅ Migración completada:`);
  console.log(`   - Migrados: ${migrated}`);
  console.log(`   - Omitidos: ${skipped}`);
  console.log(`   - Errores: ${errors}`);
}

// Ejecutar migración si se llama directamente
if (require.main === module) {
  migrate()
    .then(() => {
      console.log('✅ Proceso de migración finalizado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error fatal en la migración:', error);
      process.exit(1);
    });
}

module.exports = { migrate, createSeparateTables, migrateExistingData };
