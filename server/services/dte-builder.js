/**
 * Servicio para construir el JSON del DTE según el formato de Hacienda
 * Basado en el servicio dte_service.py de super_pos
 */

const { randomUUID } = require('crypto');

// Mapeo de tipos de documento interno a códigos de Hacienda
const TIPO_DTE_MAP = {
  'FAC': '02',  // Factura consumidor final
  'CCF': '03',  // Crédito Fiscal
  'REM': '04',  // Nota de Remisión
  'NCR': '05',  // Nota de Crédito
  'NDB': '06',  // Nota de Débito
  'CRT': '07',  // Comprobante de Retención
  'FEX': '11',  // Factura de Exportación
  'FSE': '14',  // Factura de Sujeto Excluido
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
   * Formatear fecha y hora según formato requerido por Hacienda
   * Formato: dd/MM/yyyy HH:mm:ss
   */
  formatDateTimeForDte(date) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
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
   */
  buildControlNumber(tipoDte, codigoEstablecimiento, puntoEmision, numero) {
    const tipo = TIPO_DTE_MAP[tipoDte] || '02';
    const establecimiento = String(codigoEstablecimiento || '0001').padStart(4, '0');
    const punto = String(puntoEmision || '001').padStart(3, '0');
    const num = String(numero).padStart(8, '0');
    return `DTE-${tipo}-${establecimiento}${punto}-${num}`;
  }

  /**
   * Mapear tipo de documento interno a código DTE de Hacienda
   */
  mapTipoDte(tipo) {
    return TIPO_DTE_MAP[tipo] || '02';
  }

  /**
   * Mapear método de pago interno a código de Hacienda
   */
  mapFormaPago(formaPago) {
    return FORMA_PAGO_MAP[formaPago] || '01';
  }

  /**
   * Determinar si el tipo de factura es exento de IVA
   */
  isExemptInvoiceType(tipo) {
    const exemptTypes = ['FEX', 'FSE'];
    return exemptTypes.includes(tipo);
  }

  /**
   * Calcular totales desde los items
   */
  calculateTotals(items) {
    let totalVentaGravada = 0;
    let totalVentaExenta = 0;
    let totalVentaNoSujeta = 0;
    let totalImpuestos = 0;
    let totalDescuentos = 0;

    items.forEach(item => {
      totalVentaGravada += parseFloat(item.ventaGravada || 0);
      totalVentaExenta += parseFloat(item.ventaExenta || 0);
      totalVentaNoSujeta += parseFloat(item.ventaNoSuj || 0);
      totalImpuestos += parseFloat(item.montoImpuesto || 0);
      totalDescuentos += parseFloat(item.montoDescu || 0);
    });

    const totalVenta = totalVentaGravada + totalVentaExenta + totalVentaNoSujeta + totalImpuestos - totalDescuentos;

    return {
      totalVentaGravada: Math.round(totalVentaGravada * 100) / 100,
      totalVentaExenta: Math.round(totalVentaExenta * 100) / 100,
      totalVentaNoSujeta: Math.round(totalVentaNoSujeta * 100) / 100,
      totalImpuestos: Math.round(totalImpuestos * 100) / 100,
      totalDescuentos: Math.round(totalDescuentos * 100) / 100,
      totalVenta: Math.round(totalVenta * 100) / 100,
    };
  }

  /**
   * Construir items del DTE desde los items de la factura
   */
  buildItems(facturaItems, tipoDte) {
    const isExemptDteType = this.isExemptInvoiceType(tipoDte);
    const items = [];

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
      let porcentajeImpuesto = 0;

      // Si el tipo de DTE es exento (FEX, FSE), todos los items son exentos
      if (isExemptDteType) {
        if (tipoDte === 'FEX') {
          // Exportación: venta exenta
          ventaExenta = subtotal;
        } else if (tipoDte === 'FSE') {
          // Sujeto Excluido: venta exenta
          ventaExenta = subtotal;
        }
      } else {
        // Para tipos gravados, considerar el tipoVenta del item
        if (tipoVenta === 'Exenta') {
          ventaExenta = subtotal;
        } else if (tipoVenta === 'No Sujeta') {
          ventaNoSujeta = subtotal;
        } else {
          // Gravada (por defecto)
          ventaGravada = subtotal;
          // Calcular IVA (13% para El Salvador)
          porcentajeImpuesto = 13.0;
          montoImpuesto = Math.round((ventaGravada * 0.13) * 100) / 100;
        }
      }

      const montoTotal = ventaGravada + ventaExenta + ventaNoSujeta + montoImpuesto - descuento;

      items.push({
        numeroLinea: index + 1,
        codigo: item.codigo || null,
        descripcion: item.descripcion || item.producto || '',
        cantidad: cantidad,
        precioUnitaro: precioUnitario,
        montoDescu: descuento,
        ventaNoSuj: ventaNoSujeta,
        ventaExenta: ventaExenta,
        ventaGravada: ventaGravada,
        porcentajeImpuesto: porcentajeImpuesto,
        montoImpuesto: montoImpuesto,
        montoTotal: Math.round(montoTotal * 100) / 100,
        uniMedida: item.unidad || 'UNI'
      });
    });

    return items;
  }

  /**
   * Construir el JSON completo del DTE
   */
  buildDteJson(data) {
    const {
      tipoDte,
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
    const tipoDteCodigo = this.mapTipoDte(tipoDte);
    const fechaEmision = new Date();
    
    // Construir número de control
    const codigoEstablecimiento = empresaConfig.codigoMH?.substring(0, 4) || '0001';
    const puntoEmision = empresaConfig.codigoMH?.substring(4, 7) || '001';
    const numeroControl = this.buildControlNumber(tipoDte, codigoEstablecimiento, puntoEmision, numeroDocumento);

    // Construir items
    const cuerpoDocumento = this.buildItems(items, tipoDte);

    // Calcular totales desde items
    const totalsFromItems = this.calculateTotals(cuerpoDocumento);

    // Construir resumen
    const subTotalVentas = totalsFromItems.totalVentaGravada + totalsFromItems.totalVentaExenta + totalsFromItems.totalVentaNoSujeta;
    const subTotal = subTotalVentas - totalsFromItems.totalDescuentos - descuentoGlobal;
    const iva = totalsFromItems.totalImpuestos;
    const montoTotalOperacion = subTotal + iva - retenciones.iva - retenciones.renta;
    const totalPagar = montoTotalOperacion;

    // Construir DTE JSON según formato de Hacienda
    const dteJson = {
      identificacion: {
        version: 1,
        ambiente: ambiente === 'PRODUCCIÓN' ? '01' : '00',
        tipoDte: tipoDteCodigo,
        numeroControl: numeroControl,
        codigoGeneracion: codigoGeneracion,
        tipoModelo: 1,
        tipoOperacion: 1,
        tipoContingencia: null,
        motivoContin: null,
        fecEmi: this.formatDateTimeForDte(fechaEmision),
        horEmi: this.formatTimeForDte(fechaEmision),
        tipoMoneda: 'USD'
      },
      emisor: {
        nit: (empresaConfig.nit || '').replace(/-/g, ''),
        nrc: empresaConfig.nrc || '',
        nombre: empresaConfig.nombreLegal || empresaConfig.nombreComercial || '',
        codActividad: empresaConfig.actividadEconomicaPrimaria || '00000',
        descActividad: empresaConfig.actividadEconomicaPrimaria || 'VENTA AL POR MENOR',
        nombreComercial: empresaConfig.nombreComercial || empresaConfig.nombreLegal || '',
        tipoEstablecimiento: '01',
        direccion: {
          departamento: 'SAN SALVADOR',
          municipio: 'SAN SALVADOR',
          complemento: empresaConfig.direccion || ''
        },
        telefono: empresaConfig.telefono || '',
        correo: empresaConfig.correo || '',
        codEstablecimiento: codigoEstablecimiento,
        codPuntoVenta: puntoEmision,
        codEstablecimientoMH: null,
        codPuntoVentaMH: null
      },
      receptor: {
        tipoDocumento: cliente.nit ? '36' : '13',
        numDocumento: cliente.nit || cliente.numeroDocumento || '00000000-0',
        nrc: cliente.nrc || null,
        nombre: cliente.nombre || 'CONSUMIDOR FINAL',
        codActividad: null,
        descActividad: null,
        direccion: {
          departamento: cliente.departamento || null,
          municipio: cliente.municipio || null,
          complemento: cliente.direccion || null
        },
        telefono: cliente.telefono || null,
        correo: cliente.correo || cliente.correoElectronico || null
      },
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
        subTotal: subTotal,
        ivaRete1: retenciones.iva || 0,
        reteRenta: retenciones.renta || 0,
        montoTotalOperacion: montoTotalOperacion,
        totalNoGravado: 0.0,
        totalPagar: totalPagar,
        totalLetras: null,
        totalIva: iva,
        saldoFavor: 0.0,
        condicionOperacion: 1
      },
      apendice: []
    };

    return {
      dteJson,
      codigoGeneracion,
      numeroControl,
      tipoDteCodigo
    };
  }
}

module.exports = new DteBuilder();
