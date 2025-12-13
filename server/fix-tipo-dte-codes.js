/**
 * Script para corregir códigos antiguos de tipo_dte en la base de datos
 * Convierte '02' (antiguo código de FAC) a '01' (nuevo código según fe-fc-v1.json)
 */

const { Pool } = require('pg');
require('dotenv').config();

const dbName = process.env.DB_NAME || 'wavepos_dte_v2_db';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: dbName,
  user: process.env.DB_USER || 'mrgomez',
  password: process.env.DB_PASSWORD || 'Karin2100',
});

// Mapeo de códigos antiguos a nuevos
const CODIGO_CORRECCIONES = {
  '02': '01'  // FAC: '02' -> '01' según fe-fc-v1.json
};

// Tablas de documentos
const TABLAS_DOCUMENTOS = [
  'documento_factura',
  'documento_credito_fiscal',
  'documento_nota_credito',
  'documento_nota_debito',
  'documento_factura_sujeto_excluido',
  'documento_factura_exportacion',
  'documento_nota_remision',
  'documento_comprobante_retencion',
  'dtes'  // Tabla antigua para compatibilidad
];

async function corregirTipoDteEnTabla(tabla) {
  console.log(`\n📋 Corrigiendo códigos en tabla: ${tabla}`);
  
  let totalCorregidos = 0;
  let totalJSONCorregidos = 0;

  // Verificar qué columnas tiene la tabla
  const columnsCheck = await pool.query(
    `SELECT column_name 
     FROM information_schema.columns 
     WHERE table_name = $1 AND column_name IN ('tipo_dte', 'dte_json')`,
    [tabla]
  );
  
  const columnas = columnsCheck.rows.map(row => row.column_name);
  const tieneTipoDte = columnas.includes('tipo_dte');
  const tieneDteJson = columnas.includes('dte_json');

  for (const [codigoAntiguo, codigoNuevo] of Object.entries(CODIGO_CORRECCIONES)) {
    // 1. Corregir tipo_dte en la columna (solo si existe)
    if (tieneTipoDte) {
      const resultColumna = await pool.query(
        `UPDATE ${tabla} 
         SET tipo_dte = $1, updated_at = CURRENT_TIMESTAMP
         WHERE tipo_dte = $2`,
        [codigoNuevo, codigoAntiguo]
      );
      
      if (resultColumna.rowCount > 0) {
        console.log(`  ✅ Corregidos ${resultColumna.rowCount} registros en columna tipo_dte: ${codigoAntiguo} -> ${codigoNuevo}`);
        totalCorregidos += resultColumna.rowCount;
      }
    } else {
      console.log(`  ℹ️  Tabla ${tabla} no tiene columna tipo_dte, omitiendo corrección de columna`);
    }

    // 2. Corregir tipoDte en el JSON almacenado (solo si la columna existe)
    if (!tieneDteJson) {
      console.log(`  ℹ️  Tabla ${tabla} no tiene columna dte_json, omitiendo corrección de JSON`);
      continue;
    }
    
    const documentosConJSON = await pool.query(
      `SELECT id, dte_json FROM ${tabla} 
       WHERE dte_json IS NOT NULL AND dte_json::text LIKE '%"tipoDte":"${codigoAntiguo}"%'`
    );

    for (const row of documentosConJSON.rows) {
      try {
        const dteJson = typeof row.dte_json === 'string' 
          ? JSON.parse(row.dte_json) 
          : row.dte_json;

        if (dteJson.identificacion && dteJson.identificacion.tipoDte === codigoAntiguo) {
          dteJson.identificacion.tipoDte = codigoNuevo;
          
          await pool.query(
            `UPDATE ${tabla} 
             SET dte_json = $1, updated_at = CURRENT_TIMESTAMP
             WHERE id = $2`,
            [JSON.stringify(dteJson), row.id]
          );
          
          totalJSONCorregidos++;
        }
      } catch (error) {
        console.error(`  ⚠️  Error al procesar JSON del documento ID ${row.id}:`, error.message);
      }
    }

    if (documentosConJSON.rows.length > 0) {
      console.log(`  ✅ Corregidos ${totalJSONCorregidos} JSONs: ${codigoAntiguo} -> ${codigoNuevo}`);
    }
  }

  return { totalCorregidos, totalJSONCorregidos };
}

async function main() {
  console.log('🔧 Iniciando corrección de códigos tipo_dte...\n');
  console.log('📝 Correcciones a aplicar:');
  console.log('   - "02" (FAC antiguo) -> "01" (FAC según fe-fc-v1.json)\n');

  const client = await pool.connect();
  
  try {
    let totalGeneralColumna = 0;
    let totalGeneralJSON = 0;

    for (const tabla of TABLAS_DOCUMENTOS) {
      // Verificar si la tabla existe
      const tableExists = await client.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )`,
        [tabla]
      );

      if (!tableExists.rows[0].exists) {
        console.log(`⏭️  Tabla ${tabla} no existe, omitiendo...`);
        continue;
      }

      const { totalCorregidos, totalJSONCorregidos } = await corregirTipoDteEnTabla(tabla);
      totalGeneralColumna += totalCorregidos;
      totalGeneralJSON += totalJSONCorregidos;
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DE CORRECCIONES:');
    console.log('='.repeat(60));
    console.log(`✅ Total registros corregidos en columna tipo_dte: ${totalGeneralColumna}`);
    console.log(`✅ Total JSONs corregidos: ${totalGeneralJSON}`);
    console.log('='.repeat(60));
    console.log('\n✅ Corrección completada exitosamente');

  } catch (error) {
    console.error('❌ Error durante la corrección:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Error fatal:', error);
    process.exit(1);
  });
}

module.exports = { corregirTipoDteEnTabla, main };
