const FacturaGenerator = require('./dte-generators/FacturaGenerator');
const CreditoFiscalGenerator = require('./dte-generators/CreditoFiscalGenerator');
const NotaCreditoGenerator = require('./dte-generators/NotaCreditoGenerator');
const NotaDebitoGenerator = require('./dte-generators/NotaDebitoGenerator');
const FSEGenerator = require('./dte-generators/FSEGenerator');
const ContingencyGenerator = require('./dte-generators/ContingencyGenerator');
const FacturaExportacionGenerator = require('./dte-generators/FacturaExportacionGenerator');
const NotaRemisionGenerator = require('./dte-generators/NotaRemisionGenerator');

class DteBuilder {
  constructor() {
    this.facturaGenerator = new FacturaGenerator();
    this.creditoFiscalGenerator = new CreditoFiscalGenerator();
    this.notaCreditoGenerator = new NotaCreditoGenerator();
    this.notaDebitoGenerator = new NotaDebitoGenerator();
    this.fseGenerator = new FSEGenerator();
    this.contingencyGenerator = new ContingencyGenerator();
    this.fexGenerator = new FacturaExportacionGenerator();
    this.notaRemisionGenerator = new NotaRemisionGenerator();
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

    if (tipo === '14' || tipo === 'FSE') {
      return this.fseGenerator.generate(data);
    }

    if (tipo === '11' || tipo === 'FEX') {
      return this.fexGenerator.generate(data);
    }

    if (tipo === 'EVENTO_CONTINGENCIA') {
      return this.contingencyGenerator.generate(data);
    }

    if (tipo === '04' || tipo === 'REM' || tipo === 'NR') {
      return this.notaRemisionGenerator.generate(data);
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
      'NR': '04',
      'REM': '04',
      'FEX': '11',
      'FSE': '14',
      'ND': '06',
      'NDB': '06',
      'NC': '05',
      'NCR': '05',
      '01': '01',
      '03': '03',
      '04': '04',
      '11': '11',
      '14': '14',
      '05': '05',
      '06': '06'
    };
    return map[tipo] || '01';
  }
}

module.exports = new DteBuilder();
