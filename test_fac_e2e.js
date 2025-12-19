
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const dbConfig = {
    host: 'localhost',
    port: 5432,
    database: 'wavepos_dte_v2',
    user: 'mrgomez',
    password: 'Karin2100'
};

const SECRET = 'secret_para_desarrollo_123';

async function runTest() {
    const pool = new Pool(dbConfig);

    try {
        console.log("Connecting to DB...");
        // Get Enterprise
        const empRes = await pool.query('SELECT id, nombre, nit FROM empresas LIMIT 1');
        if (empRes.rows.length === 0) throw new Error("No enterprise found");
        const empresa = empRes.rows[0];
        console.log("Using Enterprise:", empresa.nombre);

        // Get User
        const userRes = await pool.query('SELECT id, email FROM users LIMIT 1');
        if (userRes.rows.length === 0) throw new Error("No user found");
        const user = userRes.rows[0];
        console.log("Using User:", user.email);

        // Generate Token
        // Payload structure based on AuthService logic
        const tokenPayload = {
            id: user.id,
            email: user.email,
            empresaId: empresa.id,
            displayName: 'Test User'
        };
        const token = jwt.sign(tokenPayload, SECRET, { expiresIn: '1h' });
        console.log("Generated Token.");

        // Prepare Payload
        const dtePayload = {
            tipoDte: 'FAC',
            empresaId: empresa.id,
            cliente: {
                nombre: 'Test Consumer',
                tipoDocumento: '36', // NIT
                numeroDocumento: '0614-290890-102-3', // Generic Valid NIT format if possible or existing customer
                correo: 'test@example.com',
                direccion: 'San Salvador',
                departamento: '06',
                municipio: '14'
            },
            items: [
                {
                    cantidad: 1,
                    precio: 10.00, // Price is GROSS (Including VAT)
                    // New Logic: 10.00 Gross -> 8.85 Net + 1.15 IVA (approx)
                    // Backend checks tipoDte=FAC and extracts IVA.
                    // Total to Pay must be 10.00.
                    descuento: 0,
                    tipoVenta: 'Gravada',
                    descripcion: 'Item E2E Test Gross Price',
                    unidad: 'Unidad'
                }
            ],
            totales: {
                // These are usually recalculated by backend if ignored or used for validation
                // But backend generator recalculates everything from items.
                // server/index.js ignores input `totales` and uses generator output?
                // Let's check server/index.js line 598...
                // It passes `items` to `buildDteJson`.
                // It does NOT use `req.body.totales` passed from frontend for generation logic,
                // it relies on `dte-builder` to calculate.
                // So I can omit totals or send dummies.
            },
            ambiente: 'PRUEBAS'
        };

        console.log("Sending Request to API...");
        try {
            const response = await axios.post('http://localhost:3000/api/dtes/generar', dtePayload, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                responseType: 'arraybuffer' // It returns a PDF blob
            });

            console.log("✅ Success! Response Status:", response.status);
            console.log("Received PDF size:", response.data.length);

        } catch (apiError) {
            console.error("❌ API Error:", apiError.message);
            if (apiError.response) {
                console.error("Status:", apiError.response.status);
                // Try to parse error if json
                try {
                    const errJson = JSON.parse(apiError.response.data.toString());
                    console.error("Details:", JSON.stringify(errJson, null, 2));
                } catch (e) {
                    console.error("Body:", apiError.response.data.toString());
                }
            }
        }

    } catch (err) {
        console.error("Script Error:", err);
    } finally {
        await pool.end();
    }
}

runTest();
