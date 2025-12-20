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

        // Get latest CCF to reference (NDB usually modifies CCF)
        const ccfRes = await pool.query('SELECT codigo_generacion, fecha_emision FROM documento_credito_fiscal WHERE estado = \'PROCESADO\' ORDER BY id DESC LIMIT 1');
        let docRel = null;
        if (ccfRes.rows.length > 0) {
            console.log("Found referenced CCF:", ccfRes.rows[0].codigo_generacion);
            docRel = [{
                tipoDocumento: "03", // CCF
                tipoGeneracion: 2, // Electronico
                numeroDocumento: ccfRes.rows[0].codigo_generacion,
                fechaEmision: new Date(ccfRes.rows[0].fecha_emision || new Date()).toISOString().split('T')[0]
            }];
        } else {
            console.warn("No processed CCF found. Using dummy reference.");
            docRel = [{
                tipoDocumento: "03",
                tipoGeneracion: 2,
                numeroDocumento: "A3E8464C-D498-42F0-AA24-5C21B27D0738",
                fechaEmision: "2025-12-18"
            }];
        }

        const tokenPayload = {
            id: user.id,
            email: user.email,
            empresaId: empresa.id,
            displayName: 'Test User'
        };
        const token = jwt.sign(tokenPayload, SECRET, { expiresIn: '1h' });

        const dtePayload = {
            tipoDte: '06', // Nota de Debito
            empresaId: empresa.id,
            cliente: {
                nombre: 'CLIENTE TEST TAXPAYER',
                nit: '02101006781134',
                nrc: '2778750',
                correo: 'test@example.com',
                direccion: 'San Salvador',
                departamento: '06',
                municipio: '14'
            },
            documentoRelacionado: docRel,
            items: [
                {
                    cantidad: 1,
                    precio: 5.00,
                    descuento: 0,
                    tipoVenta: 'Gravada',
                    descripcion: 'Intereses por mora',
                    unidad: 'Unidad'
                }
            ],
            totales: {},
            ambiente: 'PRUEBAS'
        };

        console.log("Sending ND Request...");
        try {
            const response = await axios.post('http://localhost:3000/api/dtes/generar', dtePayload, {
                headers: { 'Authorization': `Bearer ${token}` },
                responseType: 'arraybuffer'
            });

            console.log("✅ Success! Response Status:", response.status);
            console.log("Received PDF size:", response.data.length);

            // Wait a bit for DB update
            await new Promise(r => setTimeout(r, 2000));
            console.log("Checking DB for transmission result...");
            const dbCheck = await pool.query('SELECT estado, sello_recibido, observaciones FROM documento_nota_debito ORDER BY id DESC LIMIT 1');
            if (dbCheck.rows.length > 0) {
                const doc = dbCheck.rows[0];
                console.log("DB Status:", doc.estado);
                if (doc.sello_recibido) {
                    console.log("✅ Sello Recibido found!");
                } else {
                    console.log("❌ No Sello Recibido. Observaciones:", doc.observaciones);
                }
            }

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
