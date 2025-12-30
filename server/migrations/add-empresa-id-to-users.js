const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || '45.10.160.29',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'thetecwa1_fe_dba_prod',
    user: process.env.DB_USER || 'thetecwa1_fe_dba_prod',
    password: process.env.DB_PASSWORD || 'ml%BHX$C//Z$f6uL',
});

async function runMigration() {
    try {
        console.log('🚀 Iniciando migración de esquema: users.empresa_id');

        // Verificar si la columna ya existe
        const res = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='users' AND column_name='empresa_id';
    `);

        if (res.rows.length === 0) {
            console.log('📝 Agregando columna empresa_id a la tabla users...');
            await pool.query(`
        ALTER TABLE users 
        ADD COLUMN empresa_id TEXT REFERENCES empresas(id);
      `);
            console.log('✅ Columna agregada exitosamente.');
        } else {
            console.log('ℹ️  La columna empresa_id ya existe en users. Omitiendo.');
        }

    } catch (error) {
        console.error('❌ Error durante la migración:', error);
    } finally {
        await pool.end();
    }
}

runMigration();
