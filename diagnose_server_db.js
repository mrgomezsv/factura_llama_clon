const { Pool } = require('pg');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: 'factura_llama_clon_db',
    user: process.env.DB_USER || 'mrgomez',
    password: process.env.DB_PASSWORD || 'Karin2100',
};
console.log('DB Config:', { ...dbConfig, password: '***' });

const pool = new Pool(dbConfig);

async function test() {
    try {
        console.log('Testing connection...');
        const client = await pool.connect();
        console.log('✅ Connection successful');
        const res = await client.query('SELECT NOW()');
        console.log('Query result:', res.rows[0]);
        client.release();
    } catch (err) {
        console.error('❌ Connection failed:', err);
    } finally {
        pool.end();
    }
}

test();
