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
    // Usar IDs que sabemos que existen o buscar dinámicamente
    // Para ser robustos, buscaremos el primer usuario que tenga empresaId

    try {
        console.log('🚀 Iniciando Prueba de Transmisión REAL de Nota de Remisión (REM/04)...');

        // 0. Buscar una empresa válida
        console.log('🔍 Buscando empresa y configuración...');
        const empresaRes = await pool.query('SELECT * FROM empresa_config LIMIT 1');
        if (empresaRes.rows.length === 0) throw new Error('No hay empresas configuradas en la BD');

        const empresaConfigBase = empresaRes.rows[0];
        const empresaId = empresaConfigBase.empresa_id;

        // 1. Obtener config FULL de empresa (incluyendo passwords)
        const configRes = await pool.query(`
            SELECT ec.*, 
                   ec.password_api_prueba,
                   crt.password_pri_prueba as cert_password_pri_prueba,
                   crt.password_pub_prueba as cert_password_pub_prueba
            FROM empresa_config ec
            LEFT JOIN empresa_certificados crt ON ec.empresa_id = crt.empresa_id
            WHERE ec.empresa_id = $1
        `, [empresaId]);

        const empresaConfig = configRes.rows[0];
        if (!empresaConfig) throw new Error('Empresa config no encontrada o incompleta');

        console.log(`🏢 Empresa encontrada: ${empresaConfig.nombre_comercial} (NIT: ${empresaConfig.nit})`);

        // 2. Usar datos de cliente del ejemplo VALIDO (Jorge Ramirez) para asegurar Happy Path
        const clienteData = {
            nombre: 'Jorge Ramirez',
            nit: '06141210901196',
            nrc: '3338304',
            correo: 'jfrm2004@hotmail.com',
            codActividad: '69200',
            descActividad: 'Actividades de contabilidad, teneduría de libros y auditoría; asesoramiento en materia de impuestos',
            telefono: '77779999',
            direccion: { departamento: '06', municipio: '23', complemento: 'San Salvador' },
            nombreComercial: 'Jorge Ramirez',
            tipoDocumento: '36' // NIT
        };

        // Mapear campos de empresaConfig que vienen de DB (snake_case) a camelCase si el generator lo requiere
        // El BaseGenerator usa empresaConfig properties. Verifiquemos si espera camelCase.
        // BaseGenerator usa: codigoMH, nombreLegal, nit, nrc, actividadEconomica, direccion (obj), telefono, correo
        // La DB suele devolver snake_case. Vamos a hacer un map rápido.
        const empresaConfigMapped = {
            ...empresaConfig,
            codigoMH: empresaConfig.codigo_mh,
            nombreLegal: empresaConfig.nombre_legal,
            nombreComercial: empresaConfig.nombre_comercial,
            actividadEconomica: empresaConfig.actividad_economica,
            // direccion ya debe venir como objeto JSON si el driver de pg lo parsea
        };

        // 3. Preparar datos para el builder
        const data = {
            tipoDte: 'REM', // Nota de Remisión
            empresaConfig: empresaConfigMapped,
            cliente: clienteData,
            items: [
                {
                    descripcion: 'Transporte de Mercancía Test',
                    cantidad: 10,
                    precio: 5.00,
                    unidad: 'Unidad',
                    tipoVenta: 'Gravada',
                    // Nota de Remisión suele usar items tipo "Bien" (1) o "Servicio" (2). 
                    // El generador asume valores por defecto si faltan.
                }
            ],
            ambiente: 'PRUEBAS',
            numeroDocumento: Math.floor(Math.random() * 100000) + 1
        };

        console.log('📦 Generando JSON...');
        const buildResult = dteBuilder.buildDteJson(data);
        const dteJson = buildResult.dteJson;
        console.log('✅ JSON Generado. UUID:', buildResult.codigoGeneracion);

        // Save to file for comparison
        const fs = require('fs');
        fs.writeFileSync('generated_dte.json', JSON.stringify(dteJson, null, 2));
        console.log('💾 JSON guardado en generated_dte.json');

        console.log('✍️ Firmando DTE...');
        // Necesitamos pasar empresaConfig con las passwords. 
        // dteSigner espera: cert_password_pri_prueba
        const dteSigned = await dteSigner.signDte(dteJson, empresaConfig);

        if (!dteSigned) {
            throw new Error('Fallo al firmar el DTE. Revise logs del firmador.');
        }
        console.log('✅ DTE Firmado.');

        console.log('📤 Transmitiendo a MH...');
        const transmissionResult = await dteApiService.enviarDte(dteSigned, null, {
            ambiente: 'PRUEBAS',
            // dteApiService login usa user/pwd.
            // Si no pasamos token, intenta login con config.user/config.pwd o env vars.
            // Pasamos explícitamente las credenciales de API de la DB
            user: empresaConfig.nit,
            pwd: empresaConfig.password_api_prueba,
            nit: empresaConfig.nit,
            dteJson: dteJson
        });

        console.log('---------------------------------------------------');
        console.log('📊 RESULTADO DE TRANSMISIÓN:');
        console.log('Estado:', transmissionResult.estado);
        console.log('Sello:', transmissionResult.selloRecibido);
        console.log('Mensaje:', transmissionResult.descripcionMensaje);
        console.log('Observaciones:', transmissionResult.observaciones);
        console.log('---------------------------------------------------');

    } catch (err) {
        console.error('❌ Error CRÍTICO en la prueba:', err);
    } finally {
        await pool.end();
    }
}

runTest();
