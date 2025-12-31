
const mysql = require('mysql2/promise');
require('dotenv').config();
const { setupCatalogs } = require('./setup-catalogs');

const dbName = process.env.DATABASE_NAME || 'thetecwa1_fe_dba_prod';
const dbConfig = {
    host: process.env.DATABASE_HOST || '45.10.160.29',
    port: process.env.DATABASE_PORT || 5432,
    database: dbName,
    user: process.env.DATABASE_USER || 'thetecwa1_fe_dba_prod',
    password: process.env.DATABASE_PASSWORD || 'ml%BHX$C//Z$f6uL',
};

async function initializeDatabase() {
    console.log('🔍 Verificando conexión a base de datos...');
    let connection;

    try {
        // Intentar conectar a la base de datos
        connection = await mysql.createConnection(dbConfig);
        console.log(`✅ Conectado a la base de datos "${dbName}"`);

        await connection.end();

        // Verificar y cargar catálogos
        console.log('🔄 Verificando catálogos...');
        await setupCatalogs();

        console.log('✅ Inicialización completada');

    } catch (err) {
        if (connection) {
            await connection.end().catch(() => { });
        }

        console.error('❌ Error de conexión a BD:', err.message);
        console.error('Por favor verifica que:');
        console.error('  1. La base de datos existe');
        console.error('  2. Las credenciales son correctas');
        console.error('  3. La IP del servidor está en la whitelist');
        throw err;
    }
}

// Permitir ejecución manual
if (require.main === module) {
    initializeDatabase()
        .then(() => process.exit(0))
        .catch(e => {
            console.error(e);
            process.exit(1);
        });
}

module.exports = { initializeDatabase };
