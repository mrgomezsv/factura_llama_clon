const { Client } = require('pg');
require('dotenv').config();

const dbName = process.env.DB_NAME || 'wavepos_dte_v2';

/**
 * Script para eliminar las tablas antiguas sin el prefijo documento_
 * ADVERTENCIA: Este script elimina permanentemente las tablas antiguas
 * Asegúrate de haber migrado todos los datos antes de ejecutar este script
 */

async function removeOldTables() {
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

    // Lista de tablas antiguas a eliminar
    const oldTables = [
      'facturas_consumidor_final',
      'creditos_fiscales',
      'notas_credito',
      'notas_debito',
      'facturas_sujeto_excluido',
      'facturas_exportacion',
      'notas_remision',
      'comprobantes_retencion'
    ];

    console.log('⚠️  ADVERTENCIA: Este script eliminará las siguientes tablas:');
    oldTables.forEach(table => console.log(`   - ${table}`));
    console.log('\n📋 Verificando existencia de tablas...\n');

    let tablesRemoved = 0;
    let tablesNotFound = 0;

    for (const tableName of oldTables) {
      try {
        // Verificar si la tabla existe
        const checkTable = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          );
        `, [tableName]);

        if (checkTable.rows[0].exists) {
          // Verificar si la tabla tiene datos
          const countResult = await client.query(`SELECT COUNT(*) as count FROM ${tableName}`);
          const rowCount = parseInt(countResult.rows[0].count);

          if (rowCount > 0) {
            console.log(`⚠️  La tabla ${tableName} tiene ${rowCount} registros.`);
            console.log(`   Asegúrate de haber migrado los datos antes de eliminar.`);
          }

          // Eliminar índices primero
          console.log(`🗑️  Eliminando índices de ${tableName}...`);
          try {
            // Obtener todos los índices de la tabla
            const indexesResult = await client.query(`
              SELECT indexname 
              FROM pg_indexes 
              WHERE tablename = $1 AND schemaname = 'public'
            `, [tableName]);

            for (const index of indexesResult.rows) {
              if (index.indexname.startsWith('idx_')) {
                try {
                  await client.query(`DROP INDEX IF EXISTS ${index.indexname}`);
                  console.log(`   ✅ Índice ${index.indexname} eliminado`);
                } catch (error) {
                  console.log(`   ⚠️  No se pudo eliminar índice ${index.indexname}: ${error.message}`);
                }
              }
            }
          } catch (error) {
            console.log(`   ⚠️  Error al eliminar índices: ${error.message}`);
          }

          // Eliminar la tabla
          console.log(`🗑️  Eliminando tabla ${tableName}...`);
          await client.query(`DROP TABLE IF EXISTS ${tableName} CASCADE`);
          console.log(`✅ Tabla ${tableName} eliminada exitosamente\n`);
          tablesRemoved++;
        } else {
          console.log(`ℹ️  La tabla ${tableName} no existe, omitiendo\n`);
          tablesNotFound++;
        }
      } catch (error) {
        console.error(`❌ Error al procesar tabla ${tableName}:`, error.message);
      }
    }

    console.log('\n📊 Resumen:');
    console.log(`   - Tablas eliminadas: ${tablesRemoved}`);
    console.log(`   - Tablas no encontradas: ${tablesNotFound}`);
    console.log('\n✅ Proceso completado');

  } catch (error) {
    console.error('❌ Error en la eliminación:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  // Confirmación de seguridad
  console.log('⚠️  ⚠️  ⚠️  ADVERTENCIA IMPORTANTE ⚠️  ⚠️  ⚠️');
  console.log('Este script eliminará PERMANENTEMENTE las tablas antiguas.');
  console.log('Asegúrate de haber migrado todos los datos a las nuevas tablas.');
  console.log('Las tablas a eliminar son:');
  console.log('  - facturas_consumidor_final');
  console.log('  - creditos_fiscales');
  console.log('  - notas_credito');
  console.log('  - notas_debito');
  console.log('  - facturas_sujeto_excluido');
  console.log('  - facturas_exportacion');
  console.log('  - notas_remision');
  console.log('  - comprobantes_retencion');
  console.log('\nPara continuar, ejecuta este script con el argumento --confirm');
  console.log('Ejemplo: node server/remove-old-tables.js --confirm\n');

  if (process.argv.includes('--confirm')) {
    removeOldTables()
      .then(() => {
        console.log('✅ Proceso de eliminación finalizado');
        process.exit(0);
      })
      .catch((error) => {
        console.error('❌ Error fatal en la eliminación:', error);
        process.exit(1);
      });
  } else {
    console.log('❌ Ejecución cancelada. Usa --confirm para proceder.');
    process.exit(0);
  }
}

module.exports = { removeOldTables };
