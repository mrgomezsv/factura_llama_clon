
const mysql = require('mysql2/promise');
require('dotenv').config();
const { createDatabase, createTables } = require('./create-database');
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
    console.log('🔍 Checking database status...');
    let connection;

    try {
        // Intentar conectar a la base de datos específica
        connection = await mysql.createConnection(dbConfig);
        console.log(`✅ Base de datos "${dbName}" existe and connection successful.`);

        // Verificar integridad de tablas (por si acaso se creó la DB pero falló la creación de tablas)
        try {
            // Siempre ejecutar createTables para asegurar que las migraciones corran (es idempotente)
            console.log('🔄 Verificando esquema de base de datos y migraciones...');
            await createTables(connection);
        } catch (tableErr) {
            console.error('⚠️  Error verificando tablas, intentando recrear estructura:', tableErr.message);
            // Si falla la verificación, intentamos correr createTables por si acaso
            await createTables(connection);
        }

        // Si conecta, cerramos esta conexión para proceder con verificaciones/migraciones
        await connection.end();

        console.log('🔄 Verifying catalogs...');
        await setupCatalogs();

    } catch (err) {
        if (connection) { await connection.end().catch(() => { }); }

        // Código 1049 significa "Unknown database" en MySQL
        if (err.code === 'ER_BAD_DB_ERROR' || err.code === '3D000' || (err.sqlMessage && err.sqlMessage.includes('Unknown database'))) {
            console.log(`⚠️  Base de datos "${dbName}" no detectada. Iniciando creación...`);
            try {
                // Ejecutar script de creación (Crea DB + Tablas + Datos Semilla)
                await createDatabase();

                // Ejecutar carga de catálogos
                console.log('running setup catalogs...');
                await setupCatalogs();

                console.log('🎉 Inicialización de base de datos completada.');
            } catch (createErr) {
                console.error('❌ Error crítico creando la base de datos:', createErr);
                throw createErr;
            }
        } else {
            console.error('❌ Error de conexión a BD:', err.message);
            throw err;
        }
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
