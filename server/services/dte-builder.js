/**
 * Servicio para construir el JSON del DTE según el formato de Hacienda
 * Basado en los esquemas JSON oficiales de SVFE
 */

const { randomUUID } = require('crypto');

// Mapeo de tipos de documento interno a códigos de Hacienda
const TIPO_DTE_MAP = {
  'FAC': '01',  // Factura consumidor final (fe-fc-v1.json)
  'CCF': '03',  // Crédito Fiscal (fe-ccf-v3.json)
  'REM': '04',  // Nota de Remisión (fe-nr-v3.json)
  'NCR': '05',  // Nota de Crédito (fe-nc-v3.json)
  'NDB': '06',  // Nota de Débito (fe-nd-v3.json)
  'CRT': '07',  // Comprobante de Retención (fe-cr-v1.json)
  'FEX': '11',  // Factura de Exportación (fe-fex-v1.json)
  'FSE': '14',  // Factura de Sujeto Excluido (fe-fse-v1.json)
};

// Mapeo de versiones por tipo de documento según esquemas
const VERSION_MAP = {
  'FAC': 1,  // fe-fc-v1.json
  'CCF': 3,  // fe-ccf-v3.json
  'REM': 3,  // fe-nr-v3.json
  'NCR': 3,  // fe-nc-v3.json
  'NDB': 3,  // fe-nd-v3.json
  'CRT': 1,  // fe-cr-v1.json
  'FEX': 1,  // fe-fex-v1.json
  'FSE': 1,  // fe-fse-v1.json
};

// Mapeo de formas de pago
const FORMA_PAGO_MAP = {
  'Efectivo': '01',
  'Cheque': '02',
  'Transferencia': '03',
  'Tarjeta de Crédito': '04',
  'Tarjeta de Débito': '05',
};

class DteBuilder {
  /**
   * Generar UUID v4 para código de generación
   */
  generateUUID() {
    return randomUUID();
  }

  /**
   * Formatear fecha según formato requerido por Hacienda
   * Formato: yyyy-MM-dd
   */
  formatDateForDte(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Formatear hora según formato requerido por Hacienda
   * Formato: HH:mm:ss
   */
  formatTimeForDte(date) {
    const d = new Date(date);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

  /**
   * Construir número de control según formato: DTE-{TIPO}-{CODIGO_ESTABLECIMIENTO}{PUNTO}-{NUMERO}
   * Patrón según esquemas: ^DTE-{TIPO}-[A-Z0-9]{8}-[0-9]{15}$
   */
  buildControlNumber(tipoDte, codigoEstablecimiento, puntoEmision, numero) {
    const tipo = TIPO_DTE_MAP[tipoDte] || '01';
    const establecimiento = String(codigoEstablecimiento || '0001').padStart(4, '0');
    const punto = String(puntoEmision || '001').padStart(3, '0');
    // Código de 8 caracteres alfanuméricos (establecimiento + punto)
    const codigo = (establecimiento + punto).padEnd(8, '0').substring(0, 8);
    // Número de 15 dígitos
    const num = String(numero).padStart(15, '0');
    return `DTE-${tipo}-${codigo}-${num}`;
  }

  /**
   * Mapear tipo de documento interno a código DTE de Hacienda
   */
  mapTipoDte(tipo) {
    return TIPO_DTE_MAP[tipo] || '01';
  }

  /**
   * Obtener versión del esquema según tipo de documento
   */
  getVersion(tipoDte) {
    return VERSION_MAP[tipoDte] || 1;
  }

  /**
   * Mapear método de pago interno a código de Hacienda
   */
  mapFormaPago(formaPago) {
    return FORMA_PAGO_MAP[formaPago] || '01';
  }

  /**
   * Construir objeto de identificación común
   */
  buildIdentificacion(tipoDte, numeroControl, codigoGeneracion, fechaEmision, ambiente) {
    const version = this.getVersion(tipoDte);
    const tipoDteCodigo = this.mapTipoDte(tipoDte);

    return {
      version: version,
      ambiente: ambiente === 'PRODUCCIÓN' ? '01' : '00',
      tipoDte: tipoDteCodigo,
      numeroControl: numeroControl,
      codigoGeneracion: codigoGeneracion,
      tipoModelo: 1,
      tipoOperacion: 1,
      tipoContingencia: null,
      motivoContin: null,
      fecEmi: this.formatDateForDte(fechaEmision),
      horEmi: this.formatTimeForDte(fechaEmision),
      tipoMoneda: 'USD'
    };
  }

  /**
   * Construir objeto emisor común
   */
  buildEmisor(empresaConfig, codigoEstablecimiento, puntoEmision) {
    return {
      nit: (empresaConfig.nit || '').replace(/-/g, ''),
      nrc: empresaConfig.nrc || '',
      nombre: empresaConfig.nombreLegal || empresaConfig.nombreComercial || '',
      codActividad: empresaConfig.actividadEconomicaPrimaria || '00000',
      descActividad: empresaConfig.actividadEconomicaPrimaria || 'VENTA AL POR MENOR',
      nombreComercial: empresaConfig.nombreComercial || empresaConfig.nombreLegal || '',
      tipoEstablecimiento: '01',
      direccion: {
        departamento: empresaConfig.departamento || '01',
        municipio: empresaConfig.municipio || '01',
        complemento: empresaConfig.direccion || ''
      },
      telefono: empresaConfig.telefono || '',
      correo: empresaConfig.correo || '',
      codEstableMH: null,
      codEstable: codigoEstablecimiento || null,
      codPuntoVentaMH: null,
      codPuntoVenta: puntoEmision || null
    };
  }

  /**
   * Construir items del cuerpoDocumento para documentos estándar (FAC, CCF, NCR, NDB, REM)
   */
  buildItemsStandard(facturaItems, tipoDte) {
    const items = [];
    // FAC requiere ivaItem, otros no
    const includeIvaItem = tipoDte === 'FAC';

    facturaItems.forEach((item, index) => {
      const cantidad = parseFloat(item.cantidad || 0);
      const precioUnitario = parseFloat(item.precio || 0);
      const descuento = parseFloat(item.descuento || 0);
      const subtotal = cantidad * precioUnitario;
      const tipoVenta = (item.tipoVenta || 'Gravada').trim();

      let ventaGravada = 0;
      let ventaExenta = 0;
      let ventaNoSujeta = 0;
      let montoImpuesto = 0;
      let tributos = null;

      if (tipoVenta === 'Exenta') {
        ventaExenta = subtotal;
      } else if (tipoVenta === 'No Sujeta') {
        ventaNoSujeta = subtotal;
      } else {
        // Gravada (por defecto)
        ventaGravada = subtotal;
        montoImpuesto = Math.round((ventaGravada * 0.13) * 100) / 100;
        tributos = ['20']; // IVA 13%
      }

      const itemObj = {
        numItem: index + 1,
        tipoItem: item.tipoItem ? parseInt(item.tipoItem) : 1, // 1=Bien, 2=Servicio (Por defecto 1)
        numeroDocumento: null,
        codigo: item.codigo || null,
        codTributo: null,
        descripcion: item.descripcion || item.producto || '',
        cantidad: cantidad,
        uniMedida: this.mapUnidadMedida(item.unidad || 'UNI'),
        precioUni: precioUnitario,
        montoDescu: descuento,
        ventaNoSuj: ventaNoSujeta,
        ventaExenta: ventaExenta,
        ventaGravada: ventaGravada,
        tributos: tributos,
        psv: 0.0,
        noGravado: 0.0
      };

      // Solo FAC requiere ivaItem
      if (includeIvaItem) {
        itemObj.ivaItem = montoImpuesto;
      }

      items.push(itemObj);
    });

    return items;
  }

  /**
   * Mapear unidad de medida a código numérico
   */
  mapUnidadMedida(unidad) {
    const unidades = {
      'UNI': 1,
      'CJ': 2,
      'PQ': 3,
      'KG': 4,
      'LB': 5,
      'LT': 6,
      'GL': 7,
      'M': 8,
      'M2': 9,
      'M3': 10,
      'PZ': 11,
      'PAR': 12,
      'DOC': 13,
      'BOL': 14,
      'CAJ': 15,
      'BOT': 16,
      'TUB': 17,
      'LAT': 18,
      'BLK': 19,
      'ROL': 20,
      'PLG': 21,
      'PIE': 22,
      'YRD': 23,
      'MI': 24,
      'KM': 25,
      'GR': 26,
      'OZ': 27,
      'GAL': 29,
      'QT': 30,
      'PT': 31,
      'FL': 32,
      'OZ': 33,
      'TB': 34,
      'TS': 35,
      'CUP': 36,
      'PK': 37,
      'BU': 38,
      'BBL': 39,
      'TON': 40,
      'MT': 42,
      'FT': 43,
      'YD': 44,
      'IN': 45,
      'FT2': 46,
      'YD2': 47,
      'AC': 49,
      'MI2': 50,
      'FT3': 51,
      'YD3': 52,
      'AC-FT': 53,
      'CORD': 54,
      'BTU': 55,
      'L': 56,
      'N': 57,
      'PA': 58,
      'W': 59,
      'J': 60,
      'V': 61,
      'F': 62,
      'C': 63,
      'S': 64,
      'HZ': 65,
      '1/S': 66,
      'M/S': 67,
      'M/S2': 68,
      'M3/S': 69,
      'M3/H': 70,
      'L/H': 71,
      'W/M2': 72,
      'J/K': 73,
      'PA-S': 74,
      'N-M': 75,
      'N/M': 76,
      'RAD/S': 77,
      'RAD/S2': 78,
      'W/M-K': 79,
      'J/KG-K': 80,
      'J/KG': 81,
      'J/K-MOL': 82,
      'J/MOL': 83,
      'MOL/M3': 84,
      'MOL/KG': 85,
      'MOL/MOL': 86,
      '1': 87,
      'GY': 88,
      'GY/S': 89,
      'W/SR': 90,
      'W/SR-M2': 91,
      'PA/M': 92,
      'J/M2': 93,
      'K-GY': 94,
      'J/KG': 95,
      'SV': 96,
      'SV/S': 97,
      'SV/H': 98,
      'SERV': 99
    };
    return unidades[unidad.toUpperCase()] || 1;
  }

  /**
   * Calcular totales desde los items estándar
   */
  calculateTotalsStandard(items) {
    let totalVentaGravada = 0;
    let totalVentaExenta = 0;
    let totalVentaNoSujeta = 0;
    let totalImpuestos = 0;
    let totalDescuentos = 0;

    items.forEach(item => {
      totalVentaGravada += parseFloat(item.ventaGravada || 0);
      totalVentaExenta += parseFloat(item.ventaExenta || 0);
      totalVentaNoSujeta += parseFloat(item.ventaNoSuj || 0);
      // Calcular IVA del 13% sobre ventas gravadas
      if (item.ventaGravada > 0) {
        totalImpuestos += Math.round((item.ventaGravada * 0.13) * 100) / 100;
      }
      totalDescuentos += parseFloat(item.montoDescu || 0);
    });

    return {
      totalVentaGravada: Math.round(totalVentaGravada * 100) / 100,
      totalVentaExenta: Math.round(totalVentaExenta * 100) / 100,
      totalVentaNoSujeta: Math.round(totalVentaNoSujeta * 100) / 100,
      totalImpuestos: Math.round(totalImpuestos * 100) / 100,
      totalDescuentos: Math.round(totalDescuentos * 100) / 100,
    };
  }

  /**
   * Construir JSON para Factura Consumidor Final (FAC) - fe-fc-v1.json
   */
  buildFacturaConsumidorFinal(data) {
    const {
      empresaConfig,
      cliente,
      items,
      totales,
      retenciones = { renta: 0, iva: 0 },
      descuentoGlobal = 0,
      ambiente = 'PRUEBAS',
      numeroDocumento = 1
    } = data;

    const codigoGeneracion = this.generateUUID();
    const tipoDteCodigo = '01';
    const fechaEmision = new Date();

    const codigoEstablecimiento = empresaConfig.codigoMH?.substring(0, 4) || '0001';
    const puntoEmision = empresaConfig.codigoMH?.substring(4, 7) || '001';
    const numeroControl = this.buildControlNumber('FAC', codigoEstablecimiento, puntoEmision, numeroDocumento);

    const cuerpoDocumento = this.buildItemsStandard(items, 'FAC');
    const totalsFromItems = this.calculateTotalsStandard(cuerpoDocumento);

    const subTotalVentas = totalsFromItems.totalVentaGravada + totalsFromItems.totalVentaExenta + totalsFromItems.totalVentaNoSujeta;
    const subTotal = subTotalVentas - totalsFromItems.totalDescuentos - descuentoGlobal;
    const iva = totalsFromItems.totalImpuestos;
    const montoTotalOperacion = subTotal + iva - retenciones.iva - retenciones.renta;
    const totalPagar = montoTotalOperacion;

    const dteJson = {
      identificacion: this.buildIdentificacion('FAC', numeroControl, codigoGeneracion, fechaEmision, ambiente),
      documentoRelacionado: null,
      emisor: this.buildEmisor(empresaConfig, codigoEstablecimiento, puntoEmision),
      receptor: cliente && cliente.nit ? {
        tipoDocumento: cliente.nit ? '36' : '13',
        numDocumento: cliente.nit || cliente.numeroDocumento || '00000000-0',
        nrc: cliente.nrc || null,
        nombre: cliente.nombre || 'CONSUMIDOR FINAL',
        codActividad: null,
        descActividad: null,
        direccion: cliente.direccion ? {
          departamento: cliente.departamento || '01',
          municipio: cliente.municipio || '01',
          complemento: cliente.direccion || ''
        } : null,
        telefono: cliente.telefono || null,
        correo: cliente.correo || cliente.correoElectronico || null
      } : null,
      otrosDocumentos: null,
      ventaTercero: null,
      cuerpoDocumento: cuerpoDocumento,
      resumen: {
        totalNoSuj: totalsFromItems.totalVentaNoSujeta,
        totalExenta: totalsFromItems.totalVentaExenta,
        totalGravada: totalsFromItems.totalVentaGravada,
        subTotalVentas: subTotalVentas,
        descuNoSuj: 0.0,
        descuExenta: 0.0,
        descuGravada: totalsFromItems.totalDescuentos + descuentoGlobal,
        porcentajeDescuento: 0.0,
        totalDescu: totalsFromItems.totalDescuentos + descuentoGlobal,
        tributos: iva > 0 ? [{
          codigo: '20',
          descripcion: 'IVA',
          valor: iva
        }] : null,
        subTotal: subTotal,
        ivaRete1: retenciones.iva || 0,
        reteRenta: retenciones.renta || 0,
        montoTotalOperacion: montoTotalOperacion,
        totalNoGravado: 0.0,
        totalPagar: totalPagar,
        totalLetras: null,
        totalIva: iva,
        saldoFavor: 0.0,
        condicionOperacion: 1,
        pagos: null,
        numPagoElectronico: null
      },
      extension: null,
      apendice: null
    };

    return {
      dteJson,
      codigoGeneracion,
      numeroControl,
      tipoDteCodigo
    };
  }

  /**
   * Construir JSON para Crédito Fiscal (CCF) - fe-ccf-v3.json
   */
  buildCreditoFiscal(data) {
    const {
      empresaConfig,
      cliente,
      items,
      totales,
      retenciones = { renta: 0, iva: 0 },
      descuentoGlobal = 0,
      ambiente = 'PRUEBAS',
      numeroDocumento = 1
    } = data;

    const codigoGeneracion = this.generateUUID();
    const tipoDteCodigo = '03';
    const fechaEmision = new Date();

    const codigoEstablecimiento = empresaConfig.codigoMH?.substring(0, 4) || '0001';
    const puntoEmision = empresaConfig.codigoMH?.substring(4, 7) || '001';
    const numeroControl = this.buildControlNumber('CCF', codigoEstablecimiento, puntoEmision, numeroDocumento);

    const cuerpoDocumento = this.buildItemsStandard(items, 'CCF');
    const totalsFromItems = this.calculateTotalsStandard(cuerpoDocumento);

    const subTotalVentas = totalsFromItems.totalVentaGravada + totalsFromItems.totalVentaExenta + totalsFromItems.totalVentaNoSujeta;
    const subTotal = subTotalVentas - totalsFromItems.totalDescuentos - descuentoGlobal;
    const iva = totalsFromItems.totalImpuestos;
    const montoTotalOperacion = subTotal + iva - retenciones.iva - retenciones.renta;
    const totalPagar = montoTotalOperacion;

    const emisor = this.buildEmisor(empresaConfig, codigoEstablecimiento, puntoEmision);
    emisor.codEstableMH = null;
    emisor.codEstable = codigoEstablecimiento || null;
    emisor.codPuntoVentaMH = null;
    emisor.codPuntoVenta = puntoEmision || null;

    const dteJson = {
      identificacion: this.buildIdentificacion('CCF', numeroControl, codigoGeneracion, fechaEmision, ambiente),
      documentoRelacionado: null,
      emisor: emisor,
      receptor: {
        nit: (cliente.nit || '').replace(/-/g, ''),
        nrc: cliente.nrc || '',
        nombre: cliente.nombre || '',
        codActividad: cliente.codActividad || '',
        descActividad: cliente.descActividad || '',
        nombreComercial: cliente.nombreComercial || null,
        direccion: {
          departamento: cliente.departamento || '01',
          municipio: cliente.municipio || '01',
          complemento: cliente.direccion || ''
        },
        telefono: cliente.telefono || null,
        correo: cliente.correo || cliente.correoElectronico || null
      },
      otrosDocumentos: null,
      ventaTercero: null,
      cuerpoDocumento: cuerpoDocumento,
      resumen: {
        totalNoSuj: totalsFromItems.totalVentaNoSujeta,
        totalExenta: totalsFromItems.totalVentaExenta,
        totalGravada: totalsFromItems.totalVentaGravada,
        subTotalVentas: subTotalVentas,
        descuNoSuj: 0.0,
        descuExenta: 0.0,
        descuGravada: totalsFromItems.totalDescuentos + descuentoGlobal,
        porcentajeDescuento: 0.0,
        totalDescu: totalsFromItems.totalDescuentos + descuentoGlobal,
        tributos: iva > 0 ? [{
          codigo: '20',
          descripcion: 'IVA',
          valor: iva
        }] : null,
        subTotal: subTotal,
        ivaPerci1: iva,
        ivaRete1: retenciones.iva || 0,
        reteRenta: retenciones.renta || 0,
        montoTotalOperacion: montoTotalOperacion,
        totalNoGravado: 0.0,
        totalPagar: totalPagar,
        totalLetras: null,
        saldoFavor: 0.0,
        condicionOperacion: 1,
        pagos: null,
        numPagoElectronico: null
      },
      extension: null,
      apendice: null
    };

    return {
      dteJson,
      codigoGeneracion,
      numeroControl,
      tipoDteCodigo
    };
  }

  /**
   * Construir JSON para Nota de Crédito (NCR) - fe-nc-v3.json
   */
  buildNotaCredito(data) {
    const {
      empresaConfig,
      cliente,
      items,
      totales,
      retenciones = { renta: 0, iva: 0 },
      descuentoGlobal = 0,
      ambiente = 'PRUEBAS',
      numeroDocumento = 1,
      documentoRelacionado = null
    } = data;

    const codigoGeneracion = this.generateUUID();
    const tipoDteCodigo = '05';
    const fechaEmision = new Date();

    const codigoEstablecimiento = empresaConfig.codigoMH?.substring(0, 4) || '0001';
    const puntoEmision = empresaConfig.codigoMH?.substring(4, 7) || '001';
    const numeroControl = this.buildControlNumber('NCR', codigoEstablecimiento, puntoEmision, numeroDocumento);

    const cuerpoDocumento = this.buildItemsStandard(items, 'NCR');
    const totalsFromItems = this.calculateTotalsStandard(cuerpoDocumento);

    const subTotalVentas = totalsFromItems.totalVentaGravada + totalsFromItems.totalVentaExenta + totalsFromItems.totalVentaNoSujeta;
    const subTotal = subTotalVentas - totalsFromItems.totalDescuentos - descuentoGlobal;
    const iva = totalsFromItems.totalImpuestos;
    const montoTotalOperacion = subTotal + iva - retenciones.iva - retenciones.renta;

    const emisor = this.buildEmisor(empresaConfig, codigoEstablecimiento, puntoEmision);
    delete emisor.codEstableMH;
    delete emisor.codEstable;
    delete emisor.codPuntoVentaMH;
    delete emisor.codPuntoVenta;

    const dteJson = {
      identificacion: this.buildIdentificacion('NCR', numeroControl, codigoGeneracion, fechaEmision, ambiente),
      documentoRelacionado: documentoRelacionado ? [documentoRelacionado] : [],
      emisor: emisor,
      receptor: {
        nit: (cliente.nit || '').replace(/-/g, ''),
        nrc: cliente.nrc || '',
        nombre: cliente.nombre || '',
        codActividad: cliente.codActividad || '',
        descActividad: cliente.descActividad || '',
        nombreComercial: cliente.nombreComercial || null,
        direccion: {
          departamento: cliente.departamento || '01',
          municipio: cliente.municipio || '01',
          complemento: cliente.direccion || ''
        },
        telefono: cliente.telefono || null,
        correo: cliente.correo || cliente.correoElectronico || null
      },
      ventaTercero: null,
      cuerpoDocumento: cuerpoDocumento,
      resumen: {
        totalNoSuj: totalsFromItems.totalVentaNoSujeta,
        totalExenta: totalsFromItems.totalVentaExenta,
        totalGravada: totalsFromItems.totalVentaGravada,
        subTotalVentas: subTotalVentas,
        descuNoSuj: 0.0,
        descuExenta: 0.0,
        descuGravada: totalsFromItems.totalDescuentos + descuentoGlobal,
        totalDescu: totalsFromItems.totalDescuentos + descuentoGlobal,
        tributos: iva > 0 ? [{
          codigo: '20',
          descripcion: 'IVA',
          valor: iva
        }] : null,
        subTotal: subTotal,
        ivaPerci1: iva,
        ivaRete1: retenciones.iva || 0,
        reteRenta: retenciones.renta || 0,
        montoTotalOperacion: montoTotalOperacion,
        totalLetras: null,
        condicionOperacion: 1
      },
      extension: null,
      apendice: null
    };

    return {
      dteJson,
      codigoGeneracion,
      numeroControl,
      tipoDteCodigo
    };
  }

  /**
   * Construir JSON para Nota de Débito (NDB) - fe-nd-v3.json
   */
  buildNotaDebito(data) {
    const {
      empresaConfig,
      cliente,
      items,
      totales,
      retenciones = { renta: 0, iva: 0 },
      descuentoGlobal = 0,
      ambiente = 'PRUEBAS',
      numeroDocumento = 1,
      documentoRelacionado = null
    } = data;

    const codigoGeneracion = this.generateUUID();
    const tipoDteCodigo = '06';
    const fechaEmision = new Date();

    const codigoEstablecimiento = empresaConfig.codigoMH?.substring(0, 4) || '0001';
    const puntoEmision = empresaConfig.codigoMH?.substring(4, 7) || '001';
    const numeroControl = this.buildControlNumber('NDB', codigoEstablecimiento, puntoEmision, numeroDocumento);

    const cuerpoDocumento = this.buildItemsStandard(items, 'NDB');
    const totalsFromItems = this.calculateTotalsStandard(cuerpoDocumento);

    const subTotalVentas = totalsFromItems.totalVentaGravada + totalsFromItems.totalVentaExenta + totalsFromItems.totalVentaNoSujeta;
    const subTotal = subTotalVentas - totalsFromItems.totalDescuentos - descuentoGlobal;
    const iva = totalsFromItems.totalImpuestos;
    const montoTotalOperacion = subTotal + iva - retenciones.iva - retenciones.renta;

    const emisor = this.buildEmisor(empresaConfig, codigoEstablecimiento, puntoEmision);
    delete emisor.codEstableMH;
    delete emisor.codEstable;
    delete emisor.codPuntoVentaMH;
    delete emisor.codPuntoVenta;

    const dteJson = {
      identificacion: this.buildIdentificacion('NDB', numeroControl, codigoGeneracion, fechaEmision, ambiente),
      documentoRelacionado: documentoRelacionado ? [documentoRelacionado] : [],
      emisor: emisor,
      receptor: {
        nit: (cliente.nit || '').replace(/-/g, ''),
        nrc: cliente.nrc || '',
        nombre: cliente.nombre || '',
        codActividad: cliente.codActividad || '',
        descActividad: cliente.descActividad || '',
        nombreComercial: cliente.nombreComercial || null,
        direccion: {
          departamento: cliente.departamento || '01',
          municipio: cliente.municipio || '01',
          complemento: cliente.direccion || ''
        },
        telefono: cliente.telefono || null,
        correo: cliente.correo || cliente.correoElectronico || null
      },
      ventaTercero: null,
      cuerpoDocumento: cuerpoDocumento,
      resumen: {
        totalNoSuj: totalsFromItems.totalVentaNoSujeta,
        totalExenta: totalsFromItems.totalVentaExenta,
        totalGravada: totalsFromItems.totalVentaGravada,
        subTotalVentas: subTotalVentas,
        descuNoSuj: 0.0,
        descuExenta: 0.0,
        descuGravada: totalsFromItems.totalDescuentos + descuentoGlobal,
        totalDescu: totalsFromItems.totalDescuentos + descuentoGlobal,
        tributos: iva > 0 ? [{
          codigo: '20',
          descripcion: 'IVA',
          valor: iva
        }] : null,
        subTotal: subTotal,
        ivaPerci1: iva,
        ivaRete1: retenciones.iva || 0,
        reteRenta: retenciones.renta || 0,
        montoTotalOperacion: montoTotalOperacion,
        totalLetras: null,
        condicionOperacion: 1,
        numPagoElectronico: null
      },
      extension: null,
      apendice: null
    };

    return {
      dteJson,
      codigoGeneracion,
      numeroControl,
      tipoDteCodigo
    };
  }

  /**
   * Construir JSON para Nota de Remisión (REM) - fe-nr-v3.json
   */
  buildNotaRemision(data) {
    const {
      empresaConfig,
      cliente,
      items,
      totales,
      retenciones = { renta: 0, iva: 0 },
      descuentoGlobal = 0,
      ambiente = 'PRUEBAS',
      numeroDocumento = 1,
      documentoRelacionado = null
    } = data;

    const codigoGeneracion = this.generateUUID();
    const tipoDteCodigo = '04';
    const fechaEmision = new Date();

    const codigoEstablecimiento = empresaConfig.codigoMH?.substring(0, 4) || '0001';
    const puntoEmision = empresaConfig.codigoMH?.substring(4, 7) || '001';
    const numeroControl = this.buildControlNumber('REM', codigoEstablecimiento, puntoEmision, numeroDocumento);

    const cuerpoDocumento = this.buildItemsStandard(items, 'REM');
    const totalsFromItems = this.calculateTotalsStandard(cuerpoDocumento);

    const subTotalVentas = totalsFromItems.totalVentaGravada + totalsFromItems.totalVentaExenta + totalsFromItems.totalVentaNoSujeta;
    const subTotal = subTotalVentas - totalsFromItems.totalDescuentos - descuentoGlobal;
    const montoTotalOperacion = subTotal;

    const emisor = this.buildEmisor(empresaConfig, codigoEstablecimiento, puntoEmision);
    emisor.codEstableMH = null;
    emisor.codEstable = codigoEstablecimiento || null;
    emisor.codPuntoVentaMH = null;
    emisor.codPuntoVenta = puntoEmision || null;

    const dteJson = {
      identificacion: this.buildIdentificacion('REM', numeroControl, codigoGeneracion, fechaEmision, ambiente),
      documentoRelacionado: documentoRelacionado ? [documentoRelacionado] : null,
      emisor: emisor,
      receptor: {
        tipoDocumento: cliente.nit ? '36' : '13',
        numDocumento: cliente.nit || cliente.numeroDocumento || '00000000-0',
        nrc: cliente.nrc || null,
        nombre: cliente.nombre || '',
        codActividad: cliente.codActividad || null,
        descActividad: cliente.descActividad || null,
        nombreComercial: cliente.nombreComercial || null,
        direccion: {
          departamento: cliente.departamento || '01',
          municipio: cliente.municipio || '01',
          complemento: cliente.direccion || ''
        },
        telefono: cliente.telefono || null,
        correo: cliente.correo || cliente.correoElectronico || null,
        bienTitulo: '01' // Por defecto
      },
      ventaTercero: null,
      cuerpoDocumento: cuerpoDocumento,
      resumen: {
        totalNoSuj: totalsFromItems.totalVentaNoSujeta,
        totalExenta: totalsFromItems.totalVentaExenta,
        totalGravada: totalsFromItems.totalVentaGravada,
        subTotalVentas: subTotalVentas,
        descuNoSuj: 0.0,
        descuExenta: 0.0,
        descuGravada: totalsFromItems.totalDescuentos + descuentoGlobal,
        porcentajeDescuento: null,
        totalDescu: totalsFromItems.totalDescuentos + descuentoGlobal,
        tributos: null,
        subTotal: subTotal,
        montoTotalOperacion: montoTotalOperacion,
        totalLetras: null
      },
      extension: null,
      apendice: null
    };

    return {
      dteJson,
      codigoGeneracion,
      numeroControl,
      tipoDteCodigo
    };
  }

  /**
   * Construir JSON para Factura Sujeto Excluido (FSE) - fe-fse-v1.json
   */
  buildFacturaSujetoExcluido(data) {
    const {
      empresaConfig,
      cliente,
      items,
      totales,
      retenciones = { renta: 0, iva: 0 },
      descuentoGlobal = 0,
      ambiente = 'PRUEBAS',
      numeroDocumento = 1
    } = data;

    const codigoGeneracion = this.generateUUID();
    const tipoDteCodigo = '14';
    const fechaEmision = new Date();

    const codigoEstablecimiento = empresaConfig.codigoMH?.substring(0, 4) || '0001';
    const puntoEmision = empresaConfig.codigoMH?.substring(4, 7) || '001';
    const numeroControl = this.buildControlNumber('FSE', codigoEstablecimiento, puntoEmision, numeroDocumento);

    // Items para FSE tienen estructura diferente (compra en lugar de ventaGravada/ventaExenta)
    const cuerpoDocumento = items.map((item, index) => {
      const cantidad = parseFloat(item.cantidad || 0);
      const precioUnitario = parseFloat(item.precio || 0);
      const descuento = parseFloat(item.descuento || 0);
      const compra = cantidad * precioUnitario;

      return {
        numItem: index + 1,
        tipoItem: 1,
        cantidad: cantidad,
        codigo: item.codigo || null,
        uniMedida: this.mapUnidadMedida(item.unidad || 'UNI'),
        descripcion: item.descripcion || item.producto || '',
        precioUni: precioUnitario,
        montoDescu: descuento,
        compra: compra
      };
    });

    const totalCompra = cuerpoDocumento.reduce((sum, item) => sum + (item.compra || 0), 0);
    const totalDescu = cuerpoDocumento.reduce((sum, item) => sum + (item.montoDescu || 0), 0) + descuentoGlobal;
    const subTotal = totalCompra - totalDescu;
    const totalPagar = subTotal - retenciones.iva - retenciones.renta;

    const emisor = this.buildEmisor(empresaConfig, codigoEstablecimiento, puntoEmision);
    emisor.codEstableMH = null;
    emisor.codEstable = codigoEstablecimiento || null;
    emisor.codPuntoVentaMH = null;
    emisor.codPuntoVenta = puntoEmision || null;
    delete emisor.nombreComercial;

    const dteJson = {
      identificacion: this.buildIdentificacion('FSE', numeroControl, codigoGeneracion, fechaEmision, ambiente),
      emisor: emisor,
      sujetoExcluido: {
        tipoDocumento: cliente.tipoDocumento || (cliente.nit ? '36' : '13'),
        numDocumento: cliente.nit || cliente.numeroDocumento || '00000000-0',
        nombre: cliente.nombre || 'CONSUMIDOR FINAL',
        codActividad: cliente.codActividad || null,
        descActividad: cliente.descActividad || null,
        direccion: {
          departamento: cliente.departamento || '01',
          municipio: cliente.municipio || '01',
          complemento: cliente.direccion || ''
        },
        telefono: cliente.telefono || null,
        correo: cliente.correo || cliente.correoElectronico || null
      },
      cuerpoDocumento: cuerpoDocumento,
      resumen: {
        totalCompra: totalCompra,
        descu: descuentoGlobal,
        totalDescu: totalDescu,
        subTotal: subTotal,
        ivaRete1: retenciones.iva || 0,
        reteRenta: retenciones.renta || 0,
        totalPagar: totalPagar,
        totalLetras: null,
        condicionOperacion: 1,
        pagos: null,
        observaciones: null
      },
      apendice: null
    };

    return {
      dteJson,
      codigoGeneracion,
      numeroControl,
      tipoDteCodigo
    };
  }

  /**
   * Construir JSON para Factura Exportación (FEX) - fe-fex-v1.json
   */
  buildFacturaExportacion(data) {
    const {
      empresaConfig,
      cliente,
      items,
      totales,
      retenciones = { renta: 0, iva: 0 },
      descuentoGlobal = 0,
      ambiente = 'PRUEBAS',
      numeroDocumento = 1
    } = data;

    const codigoGeneracion = this.generateUUID();
    const tipoDteCodigo = '11';
    const fechaEmision = new Date();

    const codigoEstablecimiento = empresaConfig.codigoMH?.substring(0, 4) || '0001';
    const puntoEmision = empresaConfig.codigoMH?.substring(4, 7) || '001';
    const numeroControl = this.buildControlNumber('FEX', codigoEstablecimiento, puntoEmision, numeroDocumento);

    // Items para FEX tienen estructura diferente
    const cuerpoDocumento = items.map((item, index) => {
      const cantidad = parseFloat(item.cantidad || 0);
      const precioUnitario = parseFloat(item.precio || 0);
      const descuento = parseFloat(item.descuento || 0);
      const ventaGravada = cantidad * precioUnitario;

      return {
        numItem: index + 1,
        codigo: item.codigo || null,
        descripcion: item.descripcion || item.producto || '',
        cantidad: cantidad,
        uniMedida: this.mapUnidadMedida(item.unidad || 'UNI'),
        precioUni: precioUnitario,
        montoDescu: descuento,
        ventaGravada: ventaGravada,
        tributos: ['C3'], // Exportación
        noGravado: 0.0
      };
    });

    const totalGravada = cuerpoDocumento.reduce((sum, item) => sum + (item.ventaGravada || 0), 0);
    const totalDescu = cuerpoDocumento.reduce((sum, item) => sum + (item.montoDescu || 0), 0) + descuentoGlobal;
    const montoTotalOperacion = totalGravada - totalDescu;
    const totalPagar = montoTotalOperacion;

    const emisor = this.buildEmisor(empresaConfig, codigoEstablecimiento, puntoEmision);
    emisor.codEstableMH = null;
    emisor.codEstable = codigoEstablecimiento || null;
    emisor.codPuntoVentaMH = null;
    emisor.codPuntoVenta = puntoEmision || null;
    emisor.tipoItemExpor = 1; // Por defecto
    emisor.recintoFiscal = data.recintoFiscal || null;
    emisor.regimen = data.regimenAduanero || null;

    // Construir otrosDocumentos para Transporte si existe modoTransporte
    let otrosDocumentos = null;
    if (data.modoTransporte) {
      otrosDocumentos = [{
        codDocAsociado: 4, // 4 = Transporte de Carga conforme al catálogo
        descDocumento: 'TRANSPORTE DE CARGA',
        detalleDocumento: 'TRANSPORTE INTERNACIONAL', // Detalle obligatorio 
        modoTransp: parseInt(data.modoTransporte),
        placaTrans: 'PENDIENTE', // Requerido por esquema, pendiente en UI
        numConductor: 'PENDIENTE', // Requerido por esquema, pendiente en UI
        nombreConductor: 'PENDIENTE' // Requerido por esquema, pendiente en UI
      }];
    }

    const dteJson = {
      identificacion: {
        ...this.buildIdentificacion('FEX', numeroControl, codigoGeneracion, fechaEmision, ambiente),
        motivoContigencia: null
      },
      emisor: emisor,
      receptor: {
        nombre: cliente.nombre || '',
        tipoDocumento: cliente.tipoDocumento || (cliente.nit ? '36' : '13'),
        numDocumento: cliente.nit || cliente.numeroDocumento || '',
        nombreComercial: cliente.nombreComercial || null,
        codPais: cliente.codPais || '9999',
        nombrePais: cliente.nombrePais || 'EL SALVADOR',
        complemento: cliente.direccion || '',
        tipoPersona: cliente.tipoPersona || 1,
        descActividad: cliente.descActividad || '',
        telefono: cliente.telefono || null,
        correo: cliente.correo || cliente.correoElectronico || null
      },
      otrosDocumentos: otrosDocumentos,
      ventaTercero: null,
      cuerpoDocumento: cuerpoDocumento,
      resumen: {
        totalGravada: totalGravada,
        descuento: descuentoGlobal,
        porcentajeDescuento: descuentoGlobal > 0 ? (descuentoGlobal / totalGravada) * 100 : 0.0,
        totalDescu: totalDescu,
        montoTotalOperacion: montoTotalOperacion,
        totalNoGravado: 0.0,
        totalPagar: totalPagar,
        totalLetras: null,
        condicionOperacion: 1,
        pagos: null,
        codIncoterms: data.incoterms || null,
        descIncoterms: data.incoterms ? 'INCOTERMS ' + data.incoterms : null,
        observaciones: null,
        flete: null,
        numPagoElectronico: null,
        seguro: null
      },
      apendice: null
    };

    return {
      dteJson,
      codigoGeneracion,
      numeroControl,
      tipoDteCodigo
    };
  }

  /**
   * Construir JSON para Comprobante de Retención (CRT) - fe-cr-v1.json
   */
  buildComprobanteRetencion(data) {
    const {
      empresaConfig,
      cliente,
      items, // En CRT, items son documentos retenidos
      totales,
      ambiente = 'PRUEBAS',
      numeroDocumento = 1
    } = data;

    const codigoGeneracion = this.generateUUID();
    const tipoDteCodigo = '07';
    const fechaEmision = new Date();

    const codigoEstablecimiento = empresaConfig.codigoMH?.substring(0, 4) || '0001';
    const puntoEmision = empresaConfig.codigoMH?.substring(4, 7) || '001';
    const numeroControl = this.buildControlNumber('CRT', codigoEstablecimiento, puntoEmision, numeroDocumento);

    // Items para CRT tienen estructura completamente diferente
    const cuerpoDocumento = items.map((item, index) => {
      return {
        numItem: index + 1,
        tipoDte: item.tipoDte || '03',
        tipoDoc: item.tipoDoc || 2,
        numDocumento: item.numDocumento || '',
        fechaEmision: item.fechaEmision || this.formatDateForDte(fechaEmision),
        montoSujetoGrav: parseFloat(item.montoSujetoGrav || 0),
        codigoRetencionMH: item.codigoRetencionMH || '22',
        ivaRetenido: parseFloat(item.ivaRetenido || 0),
        descripcion: item.descripcion || ''
      };
    });

    const totalSujetoRetencion = cuerpoDocumento.reduce((sum, item) => sum + (item.montoSujetoGrav || 0), 0);
    const totalIVAretenido = cuerpoDocumento.reduce((sum, item) => sum + (item.ivaRetenido || 0), 0);

    const emisor = this.buildEmisor(empresaConfig, codigoEstablecimiento, puntoEmision);
    emisor.codigoMH = null;
    emisor.codigo = codigoEstablecimiento || null;
    emisor.puntoVentaMH = null;
    emisor.puntoVenta = puntoEmision || null;
    delete emisor.codEstableMH;
    delete emisor.codEstable;
    delete emisor.codPuntoVentaMH;
    delete emisor.codPuntoVenta;

    const dteJson = {
      identificacion: {
        ...this.buildIdentificacion('CRT', numeroControl, codigoGeneracion, fechaEmision, ambiente),
        tipoModelo: 1,
        tipoOperacion: 1,
        tipoContingencia: null,
        motivoContin: null
      },
      emisor: emisor,
      receptor: {
        tipoDocumento: cliente.tipoDocumento || (cliente.nit ? '36' : '13'),
        numDocumento: cliente.nit || cliente.numeroDocumento || '',
        nrc: cliente.nrc || '',
        nombre: cliente.nombre || '',
        codActividad: cliente.codActividad || '',
        descActividad: cliente.descActividad || '',
        nombreComercial: cliente.nombreComercial || null,
        direccion: {
          departamento: cliente.departamento || '01',
          municipio: cliente.municipio || '01',
          complemento: cliente.direccion || ''
        },
        telefono: cliente.telefono || null,
        correo: cliente.correo || cliente.correoElectronico || null
      },
      cuerpoDocumento: cuerpoDocumento,
      resumen: {
        totalSujetoRetencion: totalSujetoRetencion,
        totalIVAretenido: totalIVAretenido,
        totalIVAretenidoLetras: null
      },
      extension: null,
      apendice: null
    };

    return {
      dteJson,
      codigoGeneracion,
      numeroControl,
      tipoDteCodigo
    };
  }

  /**
   * Construir el JSON completo del DTE - Router principal
   */
  buildDteJson(data) {
    const { tipoDte } = data;

    switch (tipoDte) {
      case 'FAC':
        return this.buildFacturaConsumidorFinal(data);
      case 'CCF':
        return this.buildCreditoFiscal(data);
      case 'NCR':
        return this.buildNotaCredito(data);
      case 'NDB':
        return this.buildNotaDebito(data);
      case 'REM':
        return this.buildNotaRemision(data);
      case 'FSE':
        return this.buildFacturaSujetoExcluido(data);
      case 'FEX':
        return this.buildFacturaExportacion(data);
      case 'CRT':
        return this.buildComprobanteRetencion(data);
      default:
        // Fallback a Factura Consumidor Final
        return this.buildFacturaConsumidorFinal(data);
    }
  }
}

module.exports = new DteBuilder();
