const FacturaGenerator = require('./dte-generators/FacturaGenerator');
const CreditoFiscalGenerator = require('./dte-generators/CreditoFiscalGenerator');

class DteBuilder {
  constructor() {
    this.facturaGenerator = new FacturaGenerator();
    this.creditoFiscalGenerator = new CreditoFiscalGenerator();
  }

  /**
   * Método principal para construir el JSON del DTE según el tipo
   * @param {Object} data - Datos para el DTE
   */
  buildDteJson(data) {
    const { tipoDte } = data;
    const tipo = String(tipoDte);

    // Mapear alias a códigos si es necesario
    if (tipo === '01' || tipo === 'FAC') {
      return this.buildFacturaConsumidorFinal(data);
    }

    if (tipo === '03' || tipo === 'CCF') {
      return this.creditoFiscalGenerator.generate(data);
    }

    // Futuras implementaciones
    // if (tipo === '03' || tipo === 'CCF') { ... }

    throw new Error(`Tipo de DTE no soportado por el builder actual: ${tipoDte}`);
  }

  /**
   * Construir Factura Consumidor Final (Delegado)
   */
  buildFacturaConsumidorFinal(data) {
    return this.facturaGenerator.generate(data);
  }

  /**
   * Mapear código de tipo de documento a código numérico string o viceversa
   */
  mapTipoDte(tipo) {
    const map = {
      'FAC': '01',
      'CCF': '03',
      'NR': '01', // Revisar si NR es 01 o tiene otro (Nota Remision es otro, pero aqui se usaba asi?)
      'FEX': '11',
      'ND': '05', // Nota Debito? 05 is NC? 06 ND?
      'NC': '06',
      '01': '01',
      '03': '03',
      '11': '11',
      '05': '05',
      '06': '06'
    };
    return map[tipo] || '01';
  }
}

module.exports = new DteBuilder();
