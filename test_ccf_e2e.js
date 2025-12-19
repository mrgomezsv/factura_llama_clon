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
        const empRes = await pool.query('SELECT id, nombre, nit FROM empresas LIMIT 1');
        if (empRes.rows.length === 0) throw new Error("No enterprise found");
        const empresa = empRes.rows[0];

        const userRes = await pool.query('SELECT id, email FROM users LIMIT 1');
        if (userRes.rows.length === 0) throw new Error("No user found");
        const user = userRes.rows[0];

        const tokenPayload = {
            id: user.id,
            email: user.email,
            empresaId: empresa.id,
            displayName: 'Test User'
        };
        const token = jwt.sign(tokenPayload, SECRET, { expiresIn: '1h' });

        const dtePayload = {
            tipoDte: '03', // Credito Fiscal
            empresaId: empresa.id,
            cliente: {
                nombre: 'JOAQUIN ANDRES VIDES AGREDA',
                nit: '02101006781134',
                nrc: '2778750',
                correo: 'DTE.GRUPOVG@GMAIL.COM',
                direccion: 'RESIDENCIAL CALIFORNIA, AVENIDA SAN FRANCISCO 1-25',
                departamento: '12',
                municipio: '22',
                codActividad: '10005',
                descActividad: 'Otros',
                nombreComercial: 'JOAQUIN ANDRES VIDES AGREDA'
            },
            items: [
                {
                    cantidad: 1,
                    precio: 100.00, // NET Price
                    descuento: 0,
                    tipoVenta: 'Gravada',
                    descripcion: 'Servicio de Prueba CCF',
                    unidad: 'Unidad'
                }
            ],
            totales: {},
            ambiente: 'PRUEBAS'
        };

        console.log("Sending CCF Request...");
        try {
            const response = await axios.post('http://localhost:3000/api/dtes/generar', dtePayload, {
                headers: { 'Authorization': `Bearer ${token}` },
                responseType: 'arraybuffer'
            });

            console.log("✅ Success! Response Status:", response.status);
            console.log("Received PDF size:", response.data.length);
            // We need the response headers or logs to get the UUID, specifically if returned in headers
            // But usually the client gets the PDF.
            // I will rely on DB query to look up the latest afterwards.

        } catch (apiError) {
            console.error("❌ API Error:", apiError.message);
            if (apiError.response) {
                console.error("Status:", apiError.response.status);
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
