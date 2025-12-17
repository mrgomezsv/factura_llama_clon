const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'wavepos_dte_v2',
    user: process.env.DB_USER || 'mrgomez',
    password: process.env.DB_PASSWORD || 'Karin2100',
});

async function fix() {
    await client.connect();
    console.log('🔄 Sincronizando nombres de empresa...');

    const res = await client.query(`
    UPDATE empresas e
    SET nombre = ec.nombre_comercial
    FROM empresa_config ec
    WHERE e.id = ec.empresa_id
    AND ec.nombre_comercial IS NOT NULL
    AND ec.nombre_comercial != ''
    AND e.nombre != ec.nombre_comercial
    RETURNING e.id, e.nombre as nuevo_nombre;
  `);

    console.log(`✅ Se actualizaron ${res.rowCount} empresas.`);
    console.table(res.rows);

    await client.end();
}

fix();
