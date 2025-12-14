const axios = require('axios');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'wavepos_dte_v2',
    user: process.env.DB_USER || 'mrgomez',
    password: process.env.DB_PASSWORD || 'Karin2100',
});

const API_URL = 'http://localhost:3000/api';

async function runVerification() {
    console.log('--- 🛡️ Verificando Correccion de Seguridad ---');

    try {
        // 1. Preparar Datos (Usuario y Empresa)
        console.log('1. Preparando datos de prueba...');
        const empresaId = 'empresa_segura_1';
        await pool.query(`
      INSERT INTO empresas (id, nombre, nit) 
      VALUES ($1, 'Empresa Segura S.A.', '0614-000000-000-0')
      ON CONFLICT (id) DO NOTHING
    `, [empresaId]);

        // Asegurar config
        await pool.query(`
      INSERT INTO empresa_config (id, empresa_id, nombre_comercial, nit, codigo_mh)
      VALUES ($1, $2, 'Segura Store', '06140000000000', 'C001')
      ON CONFLICT (id) DO NOTHING
    `, ['config_segura_1', empresaId]);

        // Crear Usuario Hash
        const passwordHash = await bcrypt.hash('password123', 10);
        const userId = 'user_seguro_1';
        const email = 'admin@segura.com';

        await pool.query(`
      INSERT INTO users (id, email, password_hash, display_name, empresa_id)
      VALUES ($1, $2, $3, 'Admin Seguro', $4)
      ON CONFLICT (id) DO UPDATE SET 
        empresa_id = EXCLUDED.empresa_id,
        password_hash = EXCLUDED.password_hash
    `, [userId, email, passwordHash, empresaId]);

        console.log('✅ Datos de prueba listos.');

        // 2. Intentar Generar DTE SIN Token (Debe fallar)
        console.log('\n2. Prueba: Generar DTE SIN Token (Esperando 401/403)...');
        try {
            await axios.post(`${API_URL}/dtes/generar`, {
                tipoDte: 'FAC',
                empresaId: 'cualquiera', // Intento de hackeo
                items: [{ producto: 'Test', precio: 1, cantidad: 1 }]
            });
            console.error('❌ FALLO: La API permitió acceso sin token!');
        } catch (error) {
            if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                console.log(`✅ BLOQUEADO CORRECTAMENTE: Status ${error.response.status}`);
            } else {
                console.error('❌ Error inesperado:', error.message);
            }
        }

        // 3. Login
        console.log('\n3. Prueba: Iniciar Sesión...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: email,
            password: 'password123'
        });
        const token = loginRes.data.token;
        console.log('✅ Login exitoso. Token recibido.');

        // 4. Generar DTE CON Token (Debe funcionar y usar empresa del token)
        console.log('\n4. Prueba: Generar DTE CON Token...');
        // Intentamos "hackear" enviando OTRO empresaId en el body
        const empresaHack = 'empresa_victima_X';

        // Crear empresa victima para ver si se inserta ahi (no deberia)
        await pool.query(`INSERT INTO empresas (id, nombre) VALUES ($1, 'Victima') ON CONFLICT DO NOTHING`, [empresaHack]);

        const dteRes = await axios.post(`${API_URL}/dtes/generar`, {
            tipoDte: 'FAC',
            empresaId: empresaHack, // ESTO DEBE SER IGNORADO
            clienteId: null, // Consumidor final
            items: [{ producto: 'Item Seguro', precio: 10, cantidad: 1, unidad: 'UNI', tipoItem: 1 }],
            totales: { totalPagar: 10 }
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (dteRes.status === 200) {
            console.log('✅ DTE Generado exitosamente.');

            // Verificar en BD dónde quedó el DTE
            const checkRes = await pool.query(`
        SELECT empresa_id FROM documento_factura 
        ORDER BY id DESC LIMIT 1
      `);

            const empresaUsada = checkRes.rows[0].empresa_id;
            console.log(`\n🔍 Verificación Forense:`);
            console.log(`   Empresa enviada (Hack): ${empresaHack}`);
            console.log(`   Empresa en Token (Real): ${empresaId}`);
            console.log(`   Empresa registrada en BD: ${empresaUsada}`);

            if (empresaUsada === empresaId) {
                console.log('🎉 PRUEBA EXITOSA: El sistema ignoró el parámetro malicioso y usó la empresa del usuario.');
            } else {
                console.error('❌ FALLO CRÍTICO: El sistema usó la empresa enviada en el body!');
            }

        }

    } catch (error) {
        console.error('❌ Error en verificación:', error.message);
        if (error.response) {
            console.error('Data:', error.response.data);
        }
    } finally {
        await pool.end();
    }
}

runVerification();
