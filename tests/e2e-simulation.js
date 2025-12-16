const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000/api';
const CERT_PATH = path.join(__dirname, '../Doc_Actualizados_Implementacion_DTE/Certificado_06230805241079.crt');
const EMAIL = `test_${Date.now()}@wavepos.com`;
const PASSWORD = 'password123';
const OUTPUT_DIR = path.join(__dirname, 'output');

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR);
}

async function runSimulation() {
    try {
        console.log('🚀 Iniciando Simulación End-to-End DTE WavePos');
        console.log(`📂 Usando certificado: ${CERT_PATH}`);

        // 1. Registro de Usuario
        console.log('\n--- 1. Creando Usuario ---');
        try {
            await axios.post(`${BASE_URL}/auth/register`, {
                email: EMAIL,
                password: PASSWORD,
                displayName: 'Usuario Test Automatizado'
            });
            console.log('✅ Usuario registrado:', EMAIL);
        } catch (e) {
            console.log('ℹ️  El usuario ya existe (o error ignorado):', e.message);
        }

        // 2. Login
        console.log('\n--- 2. Login ---');
        const loginRes = await axios.post(`${BASE_URL}/auth/login`, {
            email: EMAIL,
            password: PASSWORD
        });
        const token = loginRes.data.token;
        console.log('✅ Login exitoso. Token recibido.');

        const headers = { Authorization: `Bearer ${token}` };

        // 3. Crear Empresa
        console.log('\n--- 3. Creando/Obteniendo Empresa ---');
        const empresaId = `emp_test_${Date.now()}`;
        const nitCorrecto = "06230805241079";

        await axios.post(`${BASE_URL}/execute`, {
            sql: "INSERT INTO empresas (id, nombre, nit, direccion) VALUES ($1, $2, $3, $4)",
            params: [empresaId, "Empresa Test Automática", nitCorrecto, "San Salvador"]
        }, { headers });

        // Generar codigoMH aleatorio para evitar colisión de control_number si se reutiliza
        const codigoMH = `T${Date.now().toString().substr(-5)}`; // Ej: T12345

        await axios.post(`${BASE_URL}/execute`, {
            sql: `INSERT INTO empresa_config (id, empresa_id, nombre_legal, nit, correo, ambiente_pruebas_activo, cert_password_pri_prueba, cert_password_pub_prueba, codigo_mh) 
              VALUES ($1, $2, $3, $4, $5, 1, $6, $7, $8)`,
            params: [`ec_${Date.now()}`, empresaId, "Empresa Test Automática", nitCorrecto, EMAIL, 'Gees25$', 'Gees26$', codigoMH]
        }, { headers });

        // DEBUG: Verificar qué quedó grabado en empresa_config
        const debugConfig = await axios.post(`${BASE_URL}/query`, {
            sql: "SELECT * FROM empresa_config WHERE empresa_id = $1",
            params: [empresaId]
        }, { headers });
        console.log('👀 DEBUG empresa_config:', debugConfig.data[0]);

        // Linkear usuario a empresa
        await axios.post(`${BASE_URL}/execute`, {
            sql: "UPDATE users SET empresa_id = $1 WHERE email = $2",
            params: [empresaId, EMAIL]
        }, { headers });

        console.log(`✅ Empresa creada ID: ${empresaId} con NIT: ${nitCorrecto}`);

        // REFRESH TOKEN para obtener token con la nueva empresa_id (Feature solicitada)
        console.log('\n--- 3.b Refrescando Token para actualizar claims ---');
        const refreshRes = await axios.post(`${BASE_URL}/auth/refresh-token`, {}, { headers });
        const newToken = refreshRes.data.token;
        const newHeaders = { Authorization: `Bearer ${newToken}` };
        console.log('✅ Token actualizado (Refresh Token).');

        // 4. Subir Certificado
        console.log('\n--- 4. Configurando Certificado ---');
        if (!fs.existsSync(CERT_PATH)) {
            throw new Error(`No se encuentra el archivo de certificado en ${CERT_PATH}`);
        }

        const form = new FormData();
        form.append('certificado', fs.createReadStream(CERT_PATH));
        form.append('passwordPriPrueba', 'Gees25$');
        form.append('passwordPubPrueba', 'Gees26$');
        form.append('ambiente', 'PRUEBAS');

        const certRes = await axios.post(`${BASE_URL}/empresas/${empresaId}/certificado`, form, {
            headers: {
                ...newHeaders,
                ...form.getHeaders()
            }
        });
        console.log('✅ Respuesta carga certificado:', certRes.data);

        // Actualizar configuración con credenciales API MH (Usamos las mismas del cert como intento, o mock)
        // El usuario pidió pruebas de transmisión. Intentemos configurar password_api_prueba
        await axios.post(`${BASE_URL}/execute`, {
            sql: `UPDATE empresa_config SET password_api_prueba = $1 WHERE empresa_id = $2`,
            params: ['Gees25$', empresaId] // Asumimos esta password para API también
        }, { headers: newHeaders });


        // Función auxiliar para firmar
        async function testDocumento(tipoDte, payloadDescripcion, extraData = {}) {
            console.log(`\n--- Generando ${tipoDte} (${payloadDescripcion}) ---`);

            // DEBUG: Ver si ya existe algo que choque
            if (tipoDte === 'FAC') {
                const check = await axios.post(`${BASE_URL}/query`, {
                    sql: `SELECT control_number FROM ${tipoDte === 'FAC' ? 'documento_factura' : 'documento_credito_fiscal'} ORDER BY id DESC LIMIT 5`,
                }, { headers: newHeaders });
                // console.log('👀 DEBUG Last 5:', check.data);
            }

            const payload = {
                tipoDte: tipoDte,
                ambiente: "PRUEBAS",
                empresaId: empresaId,
                items: [
                    {
                        codigo: "TEST01",
                        descripcion: `Item de Prueba ${tipoDte}`,
                        cantidad: 1,
                        precioUnitario: 100.00,
                        ventaGravada: 100.00,
                        tipoItem: 1,
                        uniMedida: 59
                    }
                ],
                totales: {
                    totalGravado: 100.00,
                    totalIva: 13.00,
                    totalPagar: 113.00,
                    montoTotalOperacion: 113.00
                },
                ...extraData
            };

            if (tipoDte === 'CCF' || tipoDte === 'NCR' || tipoDte === 'NDB') {
                // Cliente con NIT/NRC validos
                const clienteId = `cli_${Date.now()}_${tipoDte}`;
                await axios.post(`${BASE_URL}/execute`, {
                    sql: "INSERT INTO clientes (id, nombre, nit, nrc, correo, direccion) VALUES ($1, $2, $3, $4, $5, $6)",
                    params: [clienteId, "Cliente Contribuyente Test", "06140409201083", "123456-7", "cliente@test.com", "San Salvador"]
                }, { headers: newHeaders });
                payload.clienteId = clienteId;
            }

            if (tipoDte === 'FEX') {
                payload.incoterms = 'FOB';
                payload.modoTransporte = '1'; // Marítimo
                payload.recintoFiscal = 'ADUANA TEST';
                payload.regimenAduanero = 'EXP';
                // FEX no lleva IVA usualmente igual que local, pero el builder lo maneja
                payload.totales.totalIva = 0;
                payload.totales.totalPagar = 100.00;
                payload.totales.montoTotalOperacion = 100.00;
                payload.items[0].ventaGravada = 0;
                payload.items[0].ventaExenta = 100.00; // FEX suele ser exenta de IVA local
            }


            try {
                const dteRes = await axios.post(`${BASE_URL}/dtes/generar`, payload, {
                    headers: newHeaders,
                    responseType: 'arraybuffer'
                });

                console.log(`✅ ${tipoDte} Generado. Guardando PDF...`);
                const pdfPath = path.join(OUTPUT_DIR, `${tipoDte}_${Date.now()}.pdf`);
                fs.writeFileSync(pdfPath, dteRes.data);
                console.log(`📄 PDF guardado en: ${pdfPath}`);

                // Verificar DB
                let tableName = 'documento_factura';
                if (tipoDte === 'CCF') tableName = 'documento_credito_fiscal';
                if (tipoDte === 'NCR') tableName = 'documento_nota_credito';
                if (tipoDte === 'NDB') tableName = 'documento_nota_debito';
                if (tipoDte === 'REM') tableName = 'documento_nota_remision';
                if (tipoDte === 'FEX') tableName = 'documento_factura_exportacion';
                if (tipoDte === 'FSE') tableName = 'documento_factura_sujeto_excluido';
                if (tipoDte === 'CRT') tableName = 'documento_comprobante_retencion';

                const checkRes = await axios.post(`${BASE_URL}/query`, {
                    sql: `SELECT estado, sello_recibido, codigo_mensaje, codigo_generacion FROM ${tableName} 
                      WHERE empresa_id = $1 
                      ORDER BY fecha_creacion DESC LIMIT 1`,
                    params: [empresaId]
                }, { headers: newHeaders });

                const dteDb = checkRes.data[0];
                console.log('📊 Estado DB:', dteDb);

                if (dteDb && dteDb.estado === 'PROCESADO') {
                    console.log(`🌟 ${tipoDte} EXITOSO: PROCESADO por Hacienda. Sello: ${dteDb.sello_recibido}`);
                    return dteDb;
                } else if (dteDb && dteDb.estado === 'RECHAZADO') {
                    // console.error(`⚠️ ${tipoDte} RECHAZADO:`, dteDb.codigo_mensaje);
                    // Retornar objeto aunque rechazado para seguir flujo si es necesario (o null)
                    return dteDb;
                } else {
                    console.log(`ℹ️ ${tipoDte} Estado: ${dteDb ? dteDb.estado : 'Desconocido'}`);
                    return dteDb;
                }

            } catch (e) {
                console.error(`❌ Error generando ${tipoDte}:`, e.message);
                if (e.response && e.response.data) {
                    try {
                        const msg = Buffer.isBuffer(e.response.data)
                            ? Buffer.from(e.response.data).toString('utf8')
                            : JSON.stringify(e.response.data);
                        console.error('Detalles server:', msg);
                    } catch (err) { }
                }
            }
            return null;
        }

        // 5. Ejecutar Pruebas Secuenciales
        const facResult = await testDocumento('FAC', 'Factura Consumidor Final');
        const ccfResult = await testDocumento('CCF', 'Comprobante Crédito Fiscal');

        // Documentos relacionales
        let docRel = null;
        if (ccfResult && ccfResult.codigo_generacion) {
            docRel = {
                tipoDocumento: '03', // CCF
                numeroDocumento: ccfResult.codigo_generacion,
                fechaEmision: new Date().toISOString().split('T')[0]
            };
        }

        if (docRel) {
            await testDocumento('NCR', 'Nota de Crédito (Anulando CCF)', { documentoRelacionado: docRel });
            await testDocumento('NDB', 'Nota de Débito (Sobre CCF)', { documentoRelacionado: docRel });
            await testDocumento('REM', 'Nota de Remisión (Vinculada a CCF)', { documentoRelacionado: docRel });
        } else {
            console.log('⚠️ Saltando pruebas vinculadas (NCR/NDB/REM) porque CCF no generó código válido');
            // Intentar uno suelto para ver si falla validación MH
            await testDocumento('NCR', 'Nota de Crédito (Aislada)');
        }

        await testDocumento('FEX', 'Factura Exportación');
        await testDocumento('FSE', 'Factura Sujeto Excluido');

    } catch (error) {
        console.error('❌ Error fatal en simulación:', error.response ? error.response.data : error.message);
    }
}

runSimulation();
