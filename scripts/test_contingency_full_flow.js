const axios = require('axios');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

// Configuration
const API_URL = 'http://localhost:3000/api';
const JWT_SECRET = 'secret_para_desarrollo_123'; // Must match server/index.js
const DB_CONFIG = {
    host: 'localhost',
    port: 5432,
    database: 'wavepos_dte_v2',
    user: 'mrgomez',
    password: 'Karin2100'
};

const pool = new Pool(DB_CONFIG);

async function runTest() {
    let client;
    let token;
    let headers;
    let contingencyId;

    try {
        console.log('🔵 Starting Contingency Flow Test...');

        // 1. Get Valid User and Company
        console.log('1. Fetching valid user/company from DB...');
        client = await pool.connect();
        // We mock a user for now or find one. Let's find one.
        // Assuming we have at least one user linked to an empresa
        // For this test, let's just cheat and create a valid payload token directly if we know a valid empresa_id
        // But better to get real IDs.
        const empresaRes = await client.query('SELECT id, nit FROM empresas LIMIT 1');
        if (empresaRes.rows.length === 0) throw new Error('No empresas found in DB');
        const empresa = empresaRes.rows[0];
        console.log('   Using Empresa:', empresa.id, empresa.nit);

        // Create Token
        const payload = {
            id: 'test_user_id',
            email: 'test@wavepos.com',
            empresaId: empresa.id,
            role: 'admin'
        };
        token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
        headers = { Authorization: `Bearer ${token}` };
        console.log('   Token generated.');

        // 2. Start Contingency
        console.log('2. Starting Contingency Event...');
        try {
            const startRes = await axios.post(`${API_URL}/contingencias/iniciar`, {
                codigoMotivo: '1', // No internet
                descripcionMotivo: 'Test Automated Script'
            }, { headers });
            contingencyId = startRes.data.id;
            console.log('   ✅ Contingency Started! ID:', contingencyId);
        } catch (e) {
            const errorMsg = e.response?.data?.error || '';
            if (errorMsg.toLowerCase().includes('ya existe una contingencia activa')) {
                console.log('   ⚠️ Contingency already active. Fetching active one...');
                const activeRes = await axios.get(`${API_URL}/contingencias/activa`, { headers });
                contingencyId = activeRes.data.id;
                console.log('   ✅ Found Active Contingency ID:', contingencyId);
            } else {
                throw e;
            }
        }

        // 3. Generate DTE in Contingency Mode (Should not send to MH)
        console.log('3. Generating DTE in Contingency Mode...');
        const dtePayload = {
            tipoDte: 'FAC',
            clienteId: null, // Consumidor final generico
            items: [
                {
                    cantidad: 1,
                    precioUnitario: 10.00,
                    descripcion: 'Item Test Contingencia',
                    codigo: 'TEST01',
                    uniMedida: '59'
                }
            ],
            totales: { totalPagar: 10.00 }, // Simplificado
            ambiente: 'PRUEBAS'
        };

        const dteRes = await axios.post(`${API_URL}/dtes/generar`, dtePayload, { headers });
        const dteId = dteRes.headers['x-dte-id'];
        const codGenFromHeader = dteRes.headers['x-codigo-generacion'];
        console.log('   ✅ DTE Generated! ID:', dteId, 'CodGen:', codGenFromHeader);

        // Verify DTE Status in DB (FAC uses documento_factura)
        const dteCheck = await client.query('SELECT estado, sello_recibido, dte_json FROM documento_factura WHERE id = $1', [dteId]);
        const dteRow = dteCheck.rows[0];
        // Note: tipo_modelo isn't a column in table dtes usually unless added. We check 'estado' and 'sello_recibido'
        if (dteRow.estado === 'CONTINGENCIA' || dteRow.estado === 'GENERADO') {
            const body = JSON.parse(dteRow.dte_json);
            if (body.identificacion.tipoModelo === 2) {
                console.log('   ✅ DTE is correctly in DEFERRED (tipoModelo: 2) mode.');
            } else {
                console.warn('   ⚠️ DTE is NOT in deferred mode in JSON. tipoModelo:', body.identificacion.tipoModelo);
            }
            console.log('   ✅ DTE State:', dteRow.estado, '(unsent as expected)');
        } else {
            console.error('   ❌ DTE state is not CONTINGENCIA/GENERADO! State:', dteRow.estado);
        }

        // 4. End Contingency
        console.log('4. Ending Contingency...');
        await axios.post(`${API_URL}/contingencias/finalizar`, {
            id: contingencyId
        }, { headers });
        console.log('   ✅ Contingency Ended.');

        // 5. Report Contingency (Triggers Event Report + Re-transmission)
        console.log('5. Reporting Contingency to MH...');
        const reportRes = await axios.post(`${API_URL}/contingencias/${contingencyId}/reportar`, {}, { headers });
        console.log('   ✅ Report Response:', JSON.stringify(reportRes.data, null, 2));

        if (reportRes.data.success) {
            console.log('   ✅ Event Reported Successfully!');
            console.log('   Stats:', reportRes.data.retransmision);

            // 6. Verify DTE Re-transmission
            console.log('6. Verifying DTE Re-transmission...');
            const dteRecheck = await client.query('SELECT estado, sello_recibido FROM documento_factura WHERE id = $1', [dteId]);
            const dteFinal = dteRecheck.rows[0];
            console.log('   Final DTE State:', dteFinal.estado);
            console.log('   Final DTE Sello:', dteFinal.sello_recibido);

            if (dteFinal.estado === 'PROCESADO' && dteFinal.sello_recibido) {
                console.log('   🎉 SUCCESS: DTE was automatically re-transmitted and authorized!');
            } else {
                console.warn('   ⚠️ WARNING: DTE is NOT processed yet. Check logs for re-transmission errors.');
            }
        } else {
            console.error('   ❌ Failed to report event.');
        }

    } catch (error) {
        console.error('🔴 Test Failed:', error.message);
        if (error.response) {
            console.error('Response Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else if (error.request) {
            console.error('No response received from server');
        } else {
            console.error('Error details:', error);
        }
    } finally {
        if (client) client.release();
        await pool.end();
    }
}

runTest();


