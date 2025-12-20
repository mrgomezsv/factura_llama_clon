const FacturaGenerator = require('./dte-generators/FacturaGenerator');
const CreditoFiscalGenerator = require('./dte-generators/CreditoFiscalGenerator');
const NotaCreditoGenerator = require('./dte-generators/NotaCreditoGenerator');
const NotaDebitoGenerator = require('./dte-generators/NotaDebitoGenerator');

class DteBuilder {
  constructor() {
    this.facturaGenerator = new FacturaGenerator();
    this.creditoFiscalGenerator = new CreditoFiscalGenerator();
    this.notaCreditoGenerator = new NotaCreditoGenerator();
    this.notaDebitoGenerator = new NotaDebitoGenerator();
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

    if (tipo === '05' || tipo === 'NCR' || tipo === 'NC') {
      return this.notaCreditoGenerator.generate(data);
    }

    if (tipo === '06' || tipo === 'NDB' || tipo === 'ND') {
      return this.notaDebitoGenerator.generate(data);
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
      'NR': '01',
      'FEX': '11',
      'ND': '06', // Nota Debito is 06 usually
      'NC': '05', // Nota Credito is 05
      'NCR': '05', // Alias for Nota Credito
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
