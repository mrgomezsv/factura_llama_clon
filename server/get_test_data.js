const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'wavepos_dte_v2',
    user: process.env.DB_USER || 'mrgomez',
    password: process.env.DB_PASSWORD || 'Karin2100',
});

async function getData() {
    try {
        const empresa = await pool.query('SELECT id, nit, nombre_comercial FROM empresa_config LIMIT 1');
        const cliente = await pool.query('SELECT id, nombre, nit, numero_documento FROM clientes LIMIT 1');
        const user = await pool.query('SELECT id, email, password_hash, empresa_id FROM users LIMIT 1');

        console.log('--- EMPRESA ---');
        console.log(JSON.stringify(empresa.rows, null, 2));
        console.log('--- CLIENTE ---');
        console.log(JSON.stringify(cliente.rows, null, 2));
        console.log('--- USER ---');
        console.log(JSON.stringify(user.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

getData();
