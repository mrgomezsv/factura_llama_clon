const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'wavepos_dte_v2',
    user: process.env.DB_USER || 'mrgomez',
    password: process.env.DB_PASSWORD || 'Karin2100',
});

async function inspect() {
    try {
        console.log('--- empresa_config columns ---');
        const resConfig = await pool.query('SELECT * FROM empresa_config LIMIT 1');
        if (resConfig.rows.length > 0) {
            console.log(Object.keys(resConfig.rows[0]));
        } else {
            console.log('No rows in empresa_config');
        }

        console.log('\n--- empresa_certificados columns ---');
        const resCerts = await pool.query('SELECT * FROM empresa_certificados LIMIT 1');
        if (resCerts.rows.length > 0) {
            console.log(Object.keys(resCerts.rows[0]));
        } else {
            console.log('No rows in empresa_certificados');
        }
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

inspect();
