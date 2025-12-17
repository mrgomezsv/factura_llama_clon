
const { Client } = require('pg');
require('dotenv').config();
const { createDatabase, createTables } = require('./create-database');
const { setupCatalogs } = require('./setup-catalogs');

const dbName = process.env.DB_NAME || 'wavepos_dte_v2';
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: dbName,
    user: process.env.DB_USER || 'mrgomez',
    password: process.env.DB_PASSWORD || 'Karin2100',
};

async function initializeDatabase() {
    console.log('🔍 Checking database status...');
    let client = new Client(dbConfig);
    let connected = false;

    try {
        // Intentar conectar a la base de datos específica
        await client.connect();
        connected = true;
        console.log(`✅ Base de datos "${dbName}" existe and connection successful.`);

        // Verificar integridad de tablas (por si acaso se creó la DB pero falló la creación de tablas)
        try {
            const res = await client.query("SELECT to_regclass('public.empresas') as exists");
            if (!res.rows[0].exists) {
                console.log('⚠️  Base de datos existe pero faltan tablas. Ejecutando creación de tablas...');
                await createTables(client);
            }
        } catch (tableErr) {
            console.error('⚠️  Error verificando tablas, intentando recrear estructura:', tableErr.message);
            // Si falla la verificación, intentamos correr createTables por si acaso
            await createTables(client);
        }

        // Si conecta, cerramos esta conexión para proceder con verificaciones/migraciones
        await client.end();

        console.log('🔄 Verifying catalogs...');
        await setupCatalogs();

    } catch (err) {
        if (connected) { await client.end().catch(() => { }); }

        // Código 3D000 significa "base de datos no existe"
        if (err.code === '3D000') {
            console.log(`⚠️  Base de datos "${dbName}" no detectada.Iniciando creación...`);
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
