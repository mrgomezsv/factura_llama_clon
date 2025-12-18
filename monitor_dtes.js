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
    try {
        await client.connect();
        console.log('--- LATEST INVOICES (documento_factura) ---');
        // Check for table existence first or just try query
        const res = await client.query('SELECT id, numero_documento, tipo_dte, estado, fecha_emision, created_at FROM documento_factura ORDER BY id DESC LIMIT 5');
        if (res.rows.length === 0) {
            console.log('No invoices found.');
        } else {
            console.table(res.rows);
        }

        console.log('\n--- LATEST ERROR LOGS (if any table stores them) ---');
        // If there's an error table, query it. Otherwise, rely on invoice state.

    } catch (err) {
        console.error('Error querying database:', err.message);
    } finally {
        await client.end();
    }
}

check();
