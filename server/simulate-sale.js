const axios = require('axios');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'wavepos_dte_v2',
    user: process.env.DB_USER || 'mrgomez',
    password: process.env.DB_PASSWORD || 'Karin2100',
});

async function runSimulation() {
    try {
        console.log('--- 🚀 Iniciando Simulacro de Venta (DTE) ---');

        console.log('1. Verificando base de datos...');

        // 1. Asegurar Empresa de Prueba
        const empresaId = 'test_empresa_simulacion';
        await pool.query(`
      INSERT INTO empresas (id, nombre, nit, direccion) 
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (id) DO NOTHING
    `, [empresaId, 'Empresa Demo S.A. de C.V.', '0614-010121-102-3', 'San Salvador, El Salvador']);

        await pool.query(`
      INSERT INTO empresa_config (id, empresa_id, nombre_comercial, nit, nrc, codigo_mh)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO UPDATE SET
        nombre_comercial = EXCLUDED.nombre_comercial
    `, ['config_simulacion', empresaId, 'Demo Store', '06140101211023', '123456-7', '0001001']);
        console.log('✅ Empresa de prueba configurada.');

        // 2. Asegurar Cliente de Prueba
        const clienteId = 'test_cliente_simulacion';
        await pool.query(`
      INSERT INTO clientes (id, nombre, nit, direccion, correo)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (id) DO NOTHING
    `, [clienteId, 'Juan Pérez (Cliente Test)', '0614-010190-101-1', 'San Salvador', 'juan.test@example.com']);
        console.log('✅ Cliente de prueba configurado.');

        // 3. Preparar Datos de Venta (Payload)
        const salePayload = {
            tipoDte: 'FAC', // Factura Consumidor Final
            empresaId: empresaId,
            clienteId: clienteId,
            ambiente: 'PRUEBAS',
            items: [
                {
                    producto: 'Coca Cola 2.5L',
                    cantidad: 2,
                    precio: 2.50,
                    unidad: 'UNI',
                    tipoVenta: 'Gravada',
                    tipoItem: 1
                },
                {
                    producto: 'Churritos Diana',
                    cantidad: 1,
                    precio: 0.50,
                    unidad: 'UNI',
                    tipoVenta: 'Gravada',
                    tipoItem: 1
                }
            ],
            totales: {
                totalVentaGravada: 5.50,
                totalImpuestos: 0.72, // 13% incluido o calculado
                totalPagar: 5.50
            },
            retenciones: { renta: 0, iva: 0 }
        };

        console.log('2. Enviando petición de generación de DTE a la API local...');
        console.log('📦 Payload:', JSON.stringify(salePayload, null, 2));

        // 4. Llamar a la API
        // Asumimos que el servidor corre en http://localhost:3000
        const apiUrl = 'http://localhost:3000/api/dtes/generar';

        // Nota: axios lanza error en status != 2xx
        const start = Date.now();
        const response = await axios.post(apiUrl, salePayload, {
            responseType: 'arraybuffer' // Esperamos un PDF
        });
        const duration = Date.now() - start;

        console.log(`✅ Respuesta recibida en ${duration}ms!`);
        console.log('📄 Status:', response.status);
        console.log('📎 Headers:', response.headers['content-type']);

        if (response.headers['content-type'] === 'application/pdf') {
            console.log('🎉 simulacro EXITOSO: Se ha generado un PDF firmado (o simulado).');
            console.log(`   Tamaño del PDF: ${response.data.length} bytes`);

            // Opcional: Guardar el PDF para inspección si se corre localmente
            const fs = require('fs');
            fs.writeFileSync('DTE_Simulacro_Resultado.pdf', response.data);
            console.log('   PDF guardado como "DTE_Simulacro_Resultado.pdf" en la raíz.');
        } else {
            console.warn('⚠️  La respuesta no parece ser un PDF:', response.data.toString());
        }

    } catch (error) {
        console.error('❌ Error durante el simulacro:');
        if (error.response) {
            // El servidor respondió con un código de estado fuera de 2xx
            console.error('Status:', error.response.status);
            try {
                const errorData = JSON.parse(error.response.data.toString());
                console.error('Data:', errorData);
            } catch (e) {
                console.error('Data (raw):', error.response.data.toString());
            }
        } else if (error.request) {
            // La petición fue hecha pero no se recibió respuesta
            console.error('No hubo respuesta del servidor. ¿Está corriendo "npm run server"?');
        } else {
            console.error('Mensaje:', error.message);
        }
    } finally {
        await pool.end();
    }
}

runSimulation();
