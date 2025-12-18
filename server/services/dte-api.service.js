/**
 * Servicio de API para comunicación con el Ministerio de Hacienda (MH)
 * Maneja Autenticación y Transmisión de DTEs
 */

const axios = require('axios');
const querystring = require('querystring');
require('dotenv').config();

class DteApiService {
    constructor() {
        // URLs Ambiente PRUEBAS (API V3)
        this.testAuthUrl = process.env.MH_AUTH_URL || 'https://apitest.dtes.mh.gob.sv/seguridad/auth';
        this.testApiUrl = process.env.MH_API_URL || 'https://apitest.dtes.mh.gob.sv/fesv/recepciondte';

        // URLs Ambiente PRODUCCIÓN
        this.prodAuthUrl = process.env.MH_AUTH_URL_PROD || 'https://api.dtes.mh.gob.sv/seguridad/auth';
        this.prodApiUrl = process.env.MH_API_URL_PROD || 'https://api.dtes.mh.gob.sv/fesv/recepciondte';

        // Credenciales por defecto (Deberían venir en config)
        this.user = process.env.MH_USER;
        this.pwd = process.env.MH_PWD;
        this.nit = process.env.MH_NIT;
    }

    /**
     * Helper para obtener URL basada en ambiente
     * @param {string} ambiente 'PRUEBAS', 'PRODUCCIÓN', '00' (Test), '01' (Prod)
     * @param {string} type 'AUTH' | 'API'
     */
    getUrl(ambiente, type) {
        const isProd = ambiente === 'PRODUCCIÓN' || ambiente === '01';
        if (type === 'AUTH') return isProd ? this.prodAuthUrl : this.testAuthUrl;
        if (type === 'API') return isProd ? this.prodApiUrl : this.testApiUrl;
        return this.testApiUrl;
    }

    /**
     * Autenticación con MH para obtener token
     * @returns {Promise<string>} Token de acceso (Bearer)
     */
    async login(config = {}) {
        try {
            const ambiente = config.ambiente || 'PRUEBAS';
            const authUrl = this.getUrl(ambiente, 'AUTH');
            console.log(`🔐 Iniciando autenticación con MH (${ambiente})... URL: ${authUrl}`);

            // Prioridad: config > this.credenciales > variables de entorno
            const user = config.user || this.user;
            const pwd = config.pwd || this.pwd;
            const nit = config.nit || this.nit || (user ? user.substr(0, 14) : null);

            if (!user || !pwd) {
                throw new Error('Credenciales MH no configuradas (MH_USER, MH_PWD)');
            }

            const data = querystring.stringify({
                user: user,
                pwd: pwd,
                nit: nit
            });

            // NOTA: El endpoint oficial es /seguridad/auth
            const response = await axios.post(
                authUrl,
                data,
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );



            console.log('🔍 DEBUG Auth Response Body:', JSON.stringify(response.data, null, 2));

            if (response.data && response.data.body && response.data.body.token) {
                console.log('✅ Autenticación MH exitosa');
                return response.data.body.token;
            } else if (response.data && response.data.token) {
                // Estructura alternativa posible
                console.log('✅ Autenticación MH exitosa (Estructura simple)');
                return response.data.token;
            } else {
                throw new Error('Respuesta de MH no contenía token');
            }

        } catch (error) {
            console.error('❌ Error en autenticación MH:', error.message);
            if (error.response) {
                console.error('Detalles Auth:', error.response.data);
            }
            throw error;
        }
    }

    /**
     * Enviar DTE firmado al MH
     * @param {Object} dteSignedJson - JSON del DTE ya firmado
     * @param {string} token - Token de autenticación (opcional, si no se pasa se intenta login)
     */
    async enviarDte(dteSignedJson, token = null, config = {}) {
        try {
            if (!token) {
                token = await this.login(config);
            }

            // Extract metadata (Priority: config.dteJson > dteSignedJson)
            let ambiente, tipoDte, version, identificacion, numeroControl;

            if (config.dteJson && config.dteJson.identificacion) {
                identificacion = config.dteJson.identificacion;
            } else if (dteSignedJson && dteSignedJson.identificacion) {
                identificacion = dteSignedJson.identificacion;
            }

            if (identificacion) {
                ambiente = identificacion.ambiente;
                tipoDte = identificacion.tipoDte;
                version = parseInt(identificacion.version);
                numeroControl = identificacion.numeroControl;
            } else {
                // Fallback or error if critical data missing
                console.warn('⚠️ No se pudo identificar metadatos del DTE para transmisión. Usando valores por defecto.');
                ambiente = config.ambiente || '00';
                // These are critical, might throw if missing
            }

            const apiUrl = this.getUrl(ambiente, 'API');

            const payload = {
                ambiente: ambiente, // "00" Pruebas, "01" Producción
                idEnvio: 1, // Puede ser autoincremental
                version: version || 1, // Fallback to 1
                tipoDte: tipoDte || config.tipoDte || '',
                documento: dteSignedJson // El JSON firmado completo (JWS)
            };

            console.log(`📤 Enviando DTE ${numeroControl || 'S/N'} a MH (Ambiente: ${ambiente})... URL: ${apiUrl}`);
            require('fs').appendFileSync('debug_mh.log', `[${new Date().toISOString()}] MH Request Payload: ${JSON.stringify(payload)}\n`);

            const response = await axios.post(
                apiUrl,
                payload,
                {
                    headers: {
                        'Authorization': token.startsWith('Bearer ') ? token : `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'User-Agent': 'FacturaLlamaClon/1.0'
                    }
                }
            );

            console.log(`✅ Respuesta MH recibida para ${numeroControl}:`, response.data.estado);

            return {
                success: true,
                estado: response.data.estado, // PROCESADO, RECHAZADO, RECIBIDO
                selloRecibido: response.data.selloRecibido || null,
                codigoMensaje: response.data.codigoMensaje || null,
                descripcionMensaje: response.data.descripcionMensaje || null,
                clasificacionMsg: response.data.clasificacionMsg || null,
                observaciones: response.data.observaciones || []
            };

        } catch (error) {
            console.error(`❌ Error enviando DTE a MH:`, error.message);

            if (error.response) {
                console.error('Detalles MH:', error.response.data);
                require('fs').appendFileSync('debug_mh.log', `[${new Date().toISOString()}] MH Error Details: ${JSON.stringify(error.response.data)}\n`);
                // Retornar error estructurado
                return {
                    success: false,
                    estado: 'RECHAZADO',
                    codigoMensaje: error.response.data.codigoMensaje || 'ERR_HTTP',
                    descripcionMensaje: error.response.data.descripcionMensaje || error.message,
                    observaciones: error.response.data.observaciones || []
                };
            }

            throw error;
        }
    }
}

module.exports = new DteApiService();
