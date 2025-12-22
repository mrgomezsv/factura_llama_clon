const { Pool } = require('pg');
const dteBuilder = require('./services/dte-builder');
const dteSigner = require('./services/dte-signer');
const dteApiService = require('./services/dte-api.service');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'wavepos_dte_v2',
    user: process.env.DB_USER || 'mrgomez',
    password: process.env.DB_PASSWORD || 'Karin2100',
});

async function runTest() {
    const empresaId = 'emp_1766001567651_9evu5b1dm';
    const clienteId = 'c1766011928196_m4e4zg0qt';

    try {
        console.log('🚀 Iniciando prueba de FEX...');

        // 1. Obtener config de empresa
        const configRes = await pool.query(`
            SELECT ec.*, 
                   crt.password_pri_prueba as cert_password_pri_prueba,
                   crt.password_pub_prueba as cert_password_pub_prueba
            FROM empresa_config ec
            LEFT JOIN empresa_certificados crt ON ec.empresa_id = crt.empresa_id
            WHERE ec.empresa_id = $1
        `, [empresaId]);

        const empresaConfig = configRes.rows[0];
        if (!empresaConfig) throw new Error('Empresa config no encontrada');

        // 2. Obtener cliente
        const clienteRes = await pool.query('SELECT * FROM clientes WHERE id = $1', [clienteId]);
        const cliente = clienteRes.rows[0];

        // 3. Preparar datos para el builder
        const data = {
            tipoDte: 'FEX',
            empresaConfig,
            cliente,
            items: [
                {
                    descripcion: 'Servicio de Consultoría Exportación',
                    cantidad: 1,
                    precio: 500.00,
                    unidad: 'UNI',
                    tipoVenta: 'Exenta',
                    tipoItem: 2
                }
            ],
            ambiente: 'PRUEBAS',
            numeroDocumento: Math.floor(Math.random() * 1000) + 1 // Número aleatorio para evitar duplicados en test
        };

        console.log('📦 Generando JSON...');
        const { dteJson } = dteBuilder.buildDteJson(data);

        console.log('✍️ Firmando DTE...');
        const dteSigned = await dteSigner.signDte(dteJson, empresaConfig);

        console.log('📤 Transmitiendo a MH...');
        const transmissionResult = await dteApiService.enviarDte(dteSigned, null, {
            ambiente: 'PRUEBAS',
            user: empresaConfig.nit,
            pwd: empresaConfig.password_api_prueba,
            dteJson: dteJson
        });

        console.log('✅ Resultado de Transmisión:', JSON.stringify(transmissionResult, null, 2));

    } catch (err) {
        console.error('❌ Error en la prueba:', err);
    } finally {
        await pool.end();
    }
}

runTest();
