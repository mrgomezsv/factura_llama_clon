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
   * @returns {Promise<string|null>} DTE firmado como string JSON, o null si hay error
   */
  async signDte(dteJson) {
    try {
      // Intentar diferentes endpoints según la API del firmador
      const endpoints = [
        '/firmar',
        '/sign',
        '/api/firmar',
        '/api/sign',
        '/'
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await axios.post(
            `${this.signerUrl}${endpoint}`,
            dteJson,
            {
              headers: { 'Content-Type': 'application/json' },
              timeout: this.timeout
            }
          );

          if (response.status === 200) {
            console.log(`✅ DTE firmado exitosamente usando endpoint: ${endpoint}`);
            return typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
          }
        } catch (error) {
          if (error.response && error.response.status === 200) {
            // Algunos endpoints pueden retornar 200 con error en el body
            continue;
          }
          // Continuar con el siguiente endpoint
          continue;
        }
      }

      // Si ningún endpoint funcionó, intentar con el JSON como string
      try {
        const response = await axios.post(
          `${this.signerUrl}/firmar`,
          JSON.stringify(dteJson),
          {
            headers: { 'Content-Type': 'application/json' },
            timeout: this.timeout
          }
        );

        if (response.status === 200) {
          console.log('✅ DTE firmado exitosamente');
          return typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
        }
      } catch (error) {
        console.error('❌ Error al firmar DTE:', error.message);
        return null;
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
