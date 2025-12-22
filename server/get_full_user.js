const { Client } = require('pg');
require('dotenv').config();
const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'wavepos_dte_v2',
    user: process.env.DB_USER || 'mrgomez',
    password: process.env.DB_PASSWORD || 'Karin2100',
});
async function getUsers() {
    await client.connect();
    const res = await client.query('SELECT * FROM users LIMIT 1');
    console.log(res.rows);
    await client.end();
}
getUsers();
