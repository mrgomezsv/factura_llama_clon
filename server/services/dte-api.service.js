/**
 * Servicio de API para comunicación con el Ministerio de Hacienda (MH)
 * Maneja Autenticación y Transmisión de DTEs
 */

const axios = require('axios');
const querystring = require('querystring');
require('dotenv').config();

class DteApiService {
    constructor() {
        this.mhAuthUrl = process.env.MH_AUTH_URL || 'https://test.identidad.hacienda.gob.sv/Dte/oauth2';
        this.mhApiUrl = process.env.MH_API_URL || 'https://tenet.hacienda.gob.sv/esing/dte';

        // Credenciales (Deberían estar en .env)
        this.user = process.env.MH_USER;
        this.pwd = process.env.MH_PWD;
        this.nit = process.env.MH_NIT;
    }

    /**
     * Autenticación con MH para obtener token
     * @returns {Promise<string>} Token de acceso (Bearer)
     */
    async login(config = {}) {
        try {
            console.log('🔐 Iniciando autenticación con MH...');

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

            const response = await axios.post(
                `${this.mhAuthUrl}/token`,
                data,
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    }
                }
            );

            if (response.data && response.data.body && response.data.body.token) {
                console.log('✅ Autenticación MH exitosa');
                return response.data.body.token;
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

            // Estructura requerida por MH:
            // { "ambiente": "00" o "01", "idEnvio": 1, "version": 1, "tipoDte": "...", "documento": "..." }
            // El "documento" debe ser el string en Base64 O el JSON firmado directo?
            // SEGÚN MANUAL: Se envía el JSON firmado dentro de la propiedad "documento".

            const identificacion = dteSignedJson.identificacion;
            const ambiente = identificacion.ambiente;
            const tipoDte = identificacion.tipoDte;
            const numeroControl = identificacion.numeroControl;
            const codigoGeneracion = identificacion.codigoGeneracion;

            const payload = {
                ambiente: ambiente, // "00" Pruebas, "01" Producción
                idEnvio: 1, // Puede ser autoincremental
                version: parseInt(identificacion.version),
                tipoDte: tipoDte,
                documento: dteSignedJson // El JSON firmado completo
            };

            console.log(`📤 Enviando DTE ${numeroControl} a MH (Ambiente: ${ambiente})...`);

            const response = await axios.post(
                `${this.mhApiUrl}/recepcion`,
                payload,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
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
