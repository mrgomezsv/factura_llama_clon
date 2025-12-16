/**
 * Servicio de Firma Electrónica para DTE
 * Utiliza el contenedor Docker "Firmador" existente
 */

const axios = require('axios');
require('dotenv').config();

class DteSignerService {
  constructor() {
    this.signerUrl = process.env.DTE_SIGNER_URL || 'http://localhost:8080';
    this.timeout = parseInt(process.env.DTE_REQUEST_TIMEOUT || '5000');
  }

  /**
   * Firmar un DTE usando el servicio de firma
   * @param {Object} dteJson - DTE en formato JSON
   * @param {Object} empresaConfig - Configuración de la empresa (incluye passwords)
   * @returns {Promise<string|null>} DTE firmado como string JSON, o null si hay error
   */
  async signDte(dteJson, empresaConfig) {
    try {
      // Determinar ambiente para elegir password
      const ambiente = dteJson.identificacion && dteJson.identificacion.ambiente === '00' ? 'PRUEBAS' : 'PRODUCCION';

      const pwdPri = ambiente === 'PRUEBAS'
        ? empresaConfig.cert_password_pri_prueba
        : empresaConfig.cert_password_pri_produccion;

      const pwdPub = ambiente === 'PRUEBAS'
        ? empresaConfig.cert_password_pub_prueba
        : empresaConfig.cert_password_pub_produccion;

      const nit = empresaConfig.nit;

      if (!pwdPri || !nit) {
        console.error('❌ Faltan credenciales de firma (NIT o Password Privado)');
        return null;
      }

      // Payload esperado por FirmarDocumentoFilter.java del firmador
      const payload = {
        passwordPri: pwdPri,
        passwordPub: pwdPub || 'P4ssw0rd', // Enviar valor dummy si no se define, aunque el firmador prioriza passwordPri
        nit: nit,
        dteJson: dteJson,
        activo: true
        // compactSerialization: no usamos esto para firmar nuevo
      };

      // Intentar diferentes endpoints según la API del firmador
      // Según análisis: FirmarDocumentoController está en /firmardocumento/
      const endpoints = [
        '/firmardocumento/',
        '/api/firmardocumento/'
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await axios.post(
            `${this.signerUrl}${endpoint}`,
            payload,
            {
              headers: { 'Content-Type': 'application/json' },
              timeout: this.timeout
            }
          );

          if (response.status === 200 && response.data && response.data.body) {
            // El firmador responde con estructura { status, body: "JWS..." }
            console.log(`✅ DTE firmado exitosamente usando endpoint: ${endpoint}`);
            return response.data.body;
          } else if (response.status === 200 && typeof response.data === 'string') {
            // Caso raw string
            return response.data;
          }

        } catch (error) {
          if (error.response) {
            console.error(`Error endpoint ${endpoint}:`, error.response.data);
          } else {
            console.error(`Error conexión endpoint ${endpoint}:`, error.message);
          }
          // Continuar con el siguiente endpoint
          continue;
        }
      }

      console.error('❌ No se pudo firmar el DTE en ningún endpoint');
      return null;
    } catch (error) {
      console.error('❌ Error inesperado al firmar DTE:', error.message);
      return null;
    }
  }

  /**
   * Verificar que el servicio de firma esté disponible
   * @returns {Promise<boolean>} True si el servicio está disponible
   */
  async verifyConnection() {
    try {
      const healthEndpoints = ['/health', '/', '/actuator/health'];

      for (const endpoint of healthEndpoints) {
        try {
          const response = await axios.get(`${this.signerUrl}${endpoint}`, {
            timeout: 2000
          });
          if (response.status === 200 || response.status === 404) {
            console.log(`✅ Conexión con firmador exitosa en ${endpoint}`);
            return true;
          }
        } catch (error) {
          continue;
        }
      }

      return false;
    } catch (error) {
      console.error('❌ Error al verificar conexión con firmador:', error.message);
      return false;
    }
  }

  /**
   * Obtener información del servicio de firma
   */
  getSignerInfo() {
    return {
      url: this.signerUrl,
      timeout: this.timeout,
      status: 'configured'
    };
  }
}

module.exports = new DteSignerService();
