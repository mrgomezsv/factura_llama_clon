const axios = require('axios');
const fs = require('fs');
const DteBuilder = require('./services/dte-builder');
const dteApiService = require('./services/dte-api.service');

// Mock Data for Testing
const mockData = {
    empresaConfig: {
        codigoMH: '00010001',
        nombreLegal: 'EMPRESA PRUEBA S.A. DE C.V.',
        nit: '06140101211060',
        nrc: '123456-7',
        actividadEconomica: 'Venta de muebles',
        direccion: {
            departamento: '06',
            municipio: '14',
            complemento: 'Alameda Juan Pablo II'
        },
        telefono: '2222-2222',
        correo: 'info@empresa.com'
    },
    cliente: {
        nombre: 'CLIENTE PRUEBA',
        nit: '06142803901121',
        nrc: '332452-1',
        correo: 'cliente@test.com',
        direccion: {
            departamento: '06',
            municipio: '14',
            complemento: 'Colonia Medica'
        },
        telefono: '7777-7777',
        codActividad: '12345'
    },
    items: [
        {
            cantidad: 10,
            precio: 15.00,
            descuento: 0,
            tipoVenta: 'Gravada',
            descripcion: 'Transporte de Mobiliario',
            unidad: 'Unidad',
            codigo: 'SERV001'
        }
    ],
    totales: {}, // Will be calculated by generator
    tipoDte: 'REM', // KEY: Testing REM/04
    ambiente: 'PRUEBAS',
    numeroDocumento: 999
};

async function testNotaRemisionFlow() {
    try {
        console.log('🚀 Iniciando Prueba de Flujo Completo Nota de Remisión (REM/04)...');

        // 1. Generate JSON
        console.log('⚙️ Generando JSON de Nota de Remisión...');
        const dteResult = DteBuilder.buildDteJson(mockData);
        console.log('✅ JSON Generado. Código Generación:', dteResult.codigoGeneracion);

        // Save Debug JSON
        fs.writeFileSync('debug_rem_generated.json', JSON.stringify(dteResult.dteJson, null, 2));

        // 2. Sign (Simulated or Real)
        console.log('✍️ Firmando DTE...');
        // In a real scenario we'd use DteSigner.signDte(dteResult.dteJson)
        // For this test script, assuming we are testing logic and partial integration
        // We can try to use the actual signer if available, but let's see imports.
        // We will try to rely on dteApiService to do the heavy lifting if we were calling the API, 
        // but here we are unit testing the "Generation" + "Transmission" parts manually.

        // Let's try to actually sign it using the local signer if possible
        let signedDte = null;
        try {
            const DteSigner = require('./services/dte-signer');
            signedDte = await DteSigner.signDte(dteResult.dteJson);
            console.log('✅ DTE Firmado correctamente.');
        } catch (e) {
            console.warn('⚠️ No se pudo firmar localmente (¿Docker no disponible?). Saltando transmisión real.');
            console.warn(e.message);
            return;
        }

        // 3. Transmit
        console.log('📡 Transmitiendo a Hacienda...');
        try {
            const response = await dteApiService.enviarDte(signedDte, null, {
                ambiente: 'PRUEBAS',
                tipoDte: '04',
                dteJson: dteResult.dteJson
            });
            console.log('✅ Resultado Transmisión:', response);
        } catch (e) {
            console.error('❌ Error en transmisión:', e.message);
        }

    } catch (error) {
        console.error('❌ Error General:', error);
    }
}

testNotaRemisionFlow();
