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
    try {
        console.log('🚀 Iniciando Prueba de Transmisión de Comprobante de Retención (DTE-07)...\n');

        // 1. Obtener configuración de empresa
        console.log('🔍 Buscando empresa y configuración...');
        const empresaRes = await pool.query(`
            SELECT ec.*, 
                   crt.password_pri_prueba as cert_password_pri_prueba,
                   crt.password_pub_prueba as cert_password_pub_prueba,
                   crt.password_pri_produccion as cert_password_pri_produccion,
                   crt.password_pub_produccion as cert_password_pub_produccion
            FROM empresa_config ec
            LEFT JOIN empresa_certificados crt ON ec.empresa_id = crt.empresa_id
            LIMIT 1
        `);

        if (empresaRes.rows.length === 0) {
            throw new Error('No hay empresas configuradas en la BD');
        }

        const empresaConfig = empresaRes.rows[0];
        console.log('✅ Empresa encontrada:', empresaConfig.nombre_legal || empresaConfig.nombre_comercial);

        // 2. Obtener cliente JOAQUIN ANDRES VIDES AGREDA
        console.log('🔍 Buscando cliente JOAQUIN ANDRES VIDES AGREDA...');
        const clienteRes = await pool.query(`SELECT * FROM clientes WHERE nombre ILIKE '%JOAQUIN%VIDES%' OR nombre ILIKE '%VIDES%AGREDA%' LIMIT 1`);
        let cliente = null;
        
        if (clienteRes.rows.length > 0) {
            cliente = clienteRes.rows[0];
            console.log('✅ Cliente encontrado:', cliente.nombre);
            console.log('   NIT:', cliente.nit);
            console.log('   NRC:', cliente.nrc);
        } else {
            throw new Error('Cliente JOAQUIN ANDRES VIDES AGREDA no encontrado en la base de datos');
        }

        // 3. Preparar datos para el Comprobante de Retención
        const empresaConfigBuilder = {
            nombreLegal: empresaConfig.nombre_legal,
            nombreComercial: empresaConfig.nombre_comercial,
            nit: empresaConfig.nit,
            nrc: empresaConfig.nrc,
            direccion: empresaConfig.direccion,
            telefono: empresaConfig.telefono,
            correo: empresaConfig.correo,
            actividadEconomicaPrimaria: empresaConfig.actividad_economica_primaria,
            codigoMH: empresaConfig.codigo_mh || '00010001',
            logoUrl: empresaConfig.logo_url
        };

        // Items del comprobante de retención (documentos relacionados)
        const items = [
            {
                tipoDteRelacionado: '03', // CCF
                tipoGeneracion: 1, // Normal
                numDocumento: 'DTE-03-00010001-000000000000001',
                fechaEmision: new Date().toISOString().split('T')[0],
                montoSujetoGrav: 1000.00,
                codigoRetencion: '22', // Retención IVA
                ivaRetenido: 130.00, // 13% de 1000
                descripcion: 'Retención IVA sobre Comprobante de Crédito Fiscal'
            }
        ];

        const fechaEmision = new Date(); // Usar fecha actual
        
        const data = {
            tipoDte: '07',
            empresaConfig: empresaConfigBuilder,
            cliente: {
                nombre: cliente.nombre,
                nit: cliente.nit || cliente.numero_documento || cliente.numDocumento,
                nrc: cliente.nrc,
                telefono: cliente.telefono || '00000000',
                correo: cliente.correo || cliente.email || 'cliente@example.com',
                codActividad: cliente.codActividad || cliente.cod_actividad || '10005',
                descActividad: cliente.descActividad || cliente.desc_actividad || 'Otras actividades',
                departamento: cliente.departamento || '12', // El cliente tiene departamento 12
                municipio: cliente.municipio || '22', // El cliente tiene municipio 22
                direccion: cliente.direccion || 'San Salvador',
                nombreComercial: cliente.nombre_comercial || cliente.nombre
            },
            items: items,
            ambiente: 'PRUEBAS',
            numeroDocumento: Math.floor(Math.random() * 1000) + 1,
            tipoModelo: 1,
            tipoOperacion: 1,
            fechaEmision: fechaEmision, // Fecha actual
            observaciones: 'Prueba de transmisión de Comprobante de Retención'
        };

        console.log('\n📦 Generando JSON del DTE-07...');
        const { dteJson, codigoGeneracion, numeroControl } = dteBuilder.buildDteJson(data);
        console.log('✅ JSON Generado');
        console.log('   Código Generación:', codigoGeneracion);
        console.log('   Número Control:', numeroControl);
        console.log('   Versión:', dteJson.identificacion.version);

        // Guardar JSON para debug
        const fs = require('fs');
        fs.writeFileSync('debug_cr_generated.json', JSON.stringify(dteJson, null, 2));
        console.log('   JSON guardado en: debug_cr_generated.json');

        // 4. Firmar el DTE
        console.log('\n✍️ Firmando DTE...');
        const empresaConfigWithCerts = {
            ...empresaConfig,
            cert_password_pri_prueba: empresaConfig.cert_password_pri_prueba,
            cert_password_pub_prueba: empresaConfig.cert_password_pub_prueba
        };

        let dteSigned;
        try {
            dteSigned = await dteSigner.signDte(dteJson, empresaConfigWithCerts);
            if (!dteSigned) {
                throw new Error('Firma retornó null o undefined');
            }
            console.log('✅ DTE Firmado correctamente');
        } catch (signError) {
            console.error('❌ Error al firmar:', signError.message);
            throw signError;
        }

        // 5. Transmitir a MH
        console.log('\n📤 Transmitiendo a Ministerio de Hacienda...');
        const mhConfig = {
            ambiente: 'PRUEBAS',
            user: empresaConfig.nit,
            pwd: empresaConfig.password_api_prueba,
            nit: empresaConfig.nit,
            dteJson: dteJson
        };

        console.log('   Ambiente: PRUEBAS');
        console.log('   NIT:', empresaConfig.nit);

        const transmissionResult = await dteApiService.enviarDte(dteSigned, null, mhConfig);

        console.log('\n📋 Resultado de Transmisión:');
        console.log('   Estado:', transmissionResult.estado);
        console.log('   Success:', transmissionResult.success);
        
        if (transmissionResult.selloRecibido) {
            console.log('   ✅ Sello Recibido:', transmissionResult.selloRecibido);
        } else {
            console.log('   ⚠️ Sello Recibido: Pendiente');
        }

        if (transmissionResult.codigoMensaje) {
            console.log('   Código Mensaje:', transmissionResult.codigoMensaje);
        }

        if (transmissionResult.descripcionMensaje) {
            console.log('   Descripción:', transmissionResult.descripcionMensaje);
        }

        if (transmissionResult.observaciones && transmissionResult.observaciones.length > 0) {
            console.log('   Observaciones:', JSON.stringify(transmissionResult.observaciones, null, 2));
        }

        console.log('\n' + '='.repeat(60));
        if (transmissionResult.success && transmissionResult.selloRecibido) {
            console.log('✅ PRUEBA EXITOSA: El Comprobante de Retención se transmitió correctamente');
        } else {
            console.log('⚠️ PRUEBA CON RESULTADOS: Revisar detalles arriba');
        }
        console.log('='.repeat(60) + '\n');

        return transmissionResult;

    } catch (error) {
        console.error('\n❌ Error en la prueba:', error.message);
        if (error.stack) {
            console.error('Stack:', error.stack);
        }
        throw error;
    } finally {
        await pool.end();
    }
}

runTest();

