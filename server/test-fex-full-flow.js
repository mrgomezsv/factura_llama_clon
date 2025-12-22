// Node 18+ has native fetch
const doFetch = global.fetch;

async function test() {
    try {
        const API_URL = 'http://localhost:3000/api';

        // 1. Login
        console.log('🔐 Authenticating at ' + API_URL + '...');
        const loginRes = await doFetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'mrgomez.dev@gmail.com', password: 'Karin2100' })
        });

        if (!loginRes.ok) {
            const err = await loginRes.text();
            throw new Error(`Login failed (${loginRes.status}): ${err}`);
        }

        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log('✅ Token obtained');

        // 2. Generate FEX
        console.log('📦 Generating FEX via API...');
        const fexPayload = {
            tipoDte: 'FEX',
            cliente: {
                nombre: 'Cliente API Test',
                nit: '0614-010190-123-4', // Optional for Foreign
                numDocumento: 'PASSPORT123',
                nombrePais: 'ESTADOS UNIDOS',
                descActividad: 'Call Center',
                direccion: 'Miami, FL',
                telefono: '12345678',
                correo: 'test_api@fex.com'
            },
            items: [
                { cantidad: 1, precio: 50.00, descripcion: 'Servicio API Test', descuento: 0 }
            ],
            totales: {
                totalPagar: 50.00,
                montoTotalOperacion: 50.00
            },
            incoterms: 'FOB',
            regimenAduanero: 'EX-1.1000.000', // Explicit code
            ambiente: 'PRUEBAS'
        };

        const genRes = await doFetch(`${API_URL}/dtes/generar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(fexPayload)
        });

        if (genRes.headers.get('content-type') === 'application/pdf') {
            console.log('✅ Success: Received PDF document (FEX Generated & Signed)');
        } else {
            const genData = await genRes.json();
            console.log('📄 API Response Status:', genRes.status);
            console.log('📄 Result:', JSON.stringify(genData, null, 2));

            if (genData.estado === 'PROCESADO') {
                console.log('\n🎉 SUCCESS: FEX Processed by MH via API!');
            } else {
                console.log('\n⚠️ WARNING: FEX not processed (check logs/response)');
            }
        }

    } catch (error) {
        console.error('❌ Test Error:', error);
    }
}

test();
