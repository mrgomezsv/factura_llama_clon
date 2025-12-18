const { Pool } = require('pg');
const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Configuración DB
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const JWT_SECRET = process.env.JWT_SECRET || 'secret_para_desarrollo_123';

async function testTransmission() {
    const client = await pool.connect();
    try {
        console.log('🧪 Iniciando Prueba de Transmisión DTE...');

        // 1. Obtener datos válidos
        const empresaRes = await client.query('SELECT empresa_id, nit, nombre_comercial FROM empresa_config LIMIT 1');
        if (empresaRes.rows.length === 0) throw new Error('No hay empresas configuradas');
        const empresa = empresaRes.rows[0];

        // 2. Buscar Cliente (JOAQUIN ANDRES VIDES AGREDA)
        const nombreCliente = 'JOAQUIN ANDRES VIDES AGREDA';
        const tipoDte = '03'; // CCF

        const clienteRes = await client.query("SELECT * FROM clientes WHERE nombre ILIKE $1 LIMIT 1", [`%${nombreCliente}%`]);
        const cliente = clienteRes.rows.length > 0 ? clienteRes.rows[0] : null;

        console.log(`🏢 Empresa: ${empresa.nombre_comercial} (${empresa.nit})`);

        if (!cliente) {
            console.warn(`⚠️ Cliente '${nombreCliente}' no encontrado. Abortando prueba CCF.`);
            return;
        }

        console.log(`👤 Cliente: ${cliente.nombre} (${cliente.nit})`);

        // 3. Generar Token
        const userPayload = {
            id: 'test_user_id',
            email: 'test@localhost',
            empresaId: empresa.empresa_id,
            rol: 'ADMIN'
        };
        const token = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '1h' });

        // 4. Payload de Credito Fiscal
        const payload = {
            tipoDte: tipoDte,
            ambiente: '00', // CHANGE: '00' for Pruebas
            cliente: {
                // Pass full object to ensure Builder has everything needed for Receptor
                nombre: cliente.nombre,
                nit: cliente.nit,
                nrc: cliente.nrc,
                correo: cliente.correo,
                telefono: cliente.telefono,
                direccion: cliente.direccion,
                departamento: cliente.departamento,
                municipio: cliente.municipio,
                codActividad: cliente.cod_actividad || '62090', // Fallback
                descActividad: cliente.desc_actividad || 'Otras actividades'
            },
            items: [
                {
                    tipoItem: 1, // Bien
                    tipoVenta: 'Gravada', // Normal Sale for CCF
                    tipoServicio: null,
                    codigo: 'TEST-CCF-02',
                    descripcion: 'Segunda Prueba CCF - Sistema Modular',
                    cantidad: 2,
                    uniMedida: 59,
                    precioUni: 75.00,
                    montoDescu: 0,
                    ventaNoSuj: 0,
                    ventaExenta: 0,
                    ventaGravada: 150.00,
                    tributos: ['20'], // IVA Code
                    psv: 0,
                    noGravado: 0
                }
            ],
            totales: {
                totalGravada: 150.00,
                totalExenta: 0,
                totalNoSuj: 0,
                totalDescuentos: 0,
                subTotal: 150.00,
                totalIva: 19.50,
                totalPagar: 169.50,
                totalLetras: 'CIENTO SESENTA Y NUEVE 50/100 USD'
            },
            condicionOperacion: 1,
            formaPago: '01'
        };

        console.log('📤 Enviando solicitud a API local...');

        // 5. Llamar al API
        const response = await axios.post('http://localhost:3000/api/dtes/generar', payload, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        // 6. Analizar Respuesta
        console.log('\n✅ RESPUESTA DEL API (PDF Recibido)');

        // 7. Verificar estado en DB
        console.log('🔍 Verificando estado en Base de Datos...');
        await new Promise(r => setTimeout(r, 1000));

        const dteRes = await client.query(`
            SELECT numero_control, estado, sello_recibido, codigo_mensaje, descripcion_mensaje 
            FROM documento_factura 
            ORDER BY id DESC LIMIT 1
        `);

        if (dteRes.rows.length > 0) {
            const dte = dteRes.rows[0];
            console.log('--- RESULTADO DTE ---');
            console.log('#️⃣  Control:', dte.numero_control);
            console.log('📊 Estado:', dte.estado);
            console.log('📜 Sello MH:', dte.sello_recibido || 'N/A');
            console.log('💬 Mensaje:', dte.descripcion_mensaje || 'N/A');
            console.log('---------------------');

            if (dte.estado === 'PROCESADO') {
                console.log('🎉 ÉXITO: El DTE fue recibido y procesado por Hacienda.');
            } else {
                console.log('⚠️ ADVERTENCIA: El DTE fue generado pero su estado es ' + dte.estado);
            }
        } else {
            console.log('❌ No se encontró el DTE en la base de datos.');
        }

    } catch (error) {
        console.error('❌ FALLÓ LA PRUEBA');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error:', error.message);
        }
    } finally {
        client.release();
        await pool.end();
    }
}

testTransmission();
