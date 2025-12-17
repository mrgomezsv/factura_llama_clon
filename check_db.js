const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'wavepos_dte_v2',
    user: process.env.DB_USER || 'mrgomez',
    password: process.env.DB_PASSWORD || 'Karin2100',
});

async function check() {
    await client.connect();
    console.log('--- TABLE: empresas ---');
    const empresas = await client.query('SELECT * FROM empresas');
    console.table(empresas.rows);

    console.log('\n--- TABLE: empresa_config ---');
    const configs = await client.query('SELECT * FROM empresa_config');
    console.table(configs.rows.map(c => ({
        empresa_id: c.empresa_id,
        nombre_legal: c.nombre_legal,
        nombre_comercial: c.nombre_comercial
    })));

    await client.end();
}

check();
