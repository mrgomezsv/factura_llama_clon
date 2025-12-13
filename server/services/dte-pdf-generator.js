/**
 * Generador de PDF para Documentos Tributarios Electrónicos (DTE)
 * Basado en la plantilla de treming_dte
 * Usa Puppeteer para generar PDF desde HTML
 */

const puppeteer = require('puppeteer');
const qrcode = require('qrcode');
const path = require('path');
const fs = require('fs').promises;

class DtePdfGenerator {
  constructor() {
    this.qrUrlTest = process.env.DTE_QR_URL_TEST || 'https://test7.mh.gob.sv/ssc/consulta/fe/';
    this.qrUrlProd = process.env.DTE_QR_URL_PROD || 'https://portaldgii.mh.gob.sv/ssc/consulta/fe/';
    this.dteEnvironment = process.env.DTE_ENVIRONMENT || 'TEST';
  }

  /**
   * Generar código QR para el DTE
   */
  async generateQrCode(codigoGeneracion) {
    try {
      const qrUrl = this.dteEnvironment === 'PROD' ? this.qrUrlProd : this.qrUrlTest;
      const qrData = `${qrUrl}${codigoGeneracion}`;
      
      // Generar QR como data URI
      const qrDataUri = await qrcode.toDataURL(qrData, {
        errorCorrectionLevel: 'L',
        type: 'image/png',
        width: 200
      });
      
      return qrDataUri;
    } catch (error) {
      console.error('Error al generar QR:', error);
      return null;
    }
  }

  /**
   * Obtener contenido del logo en base64 (similar a super_pos)
   */
  async getLogoContent(logoUrl) {
    if (!logoUrl) {
      return '';
    }

    try {
      // Si es una URL completa (http/https), usarla directamente
      if (logoUrl.startsWith('http://') || logoUrl.startsWith('https://') || logoUrl.startsWith('data:')) {
        return logoUrl;
      }

      // Si es un path local, convertir a base64
      const cleanPath = logoUrl.replace(/^\//, ''); // Remover slash inicial
      const logoPath = path.resolve(cleanPath);

      // Verificar si el archivo existe
      try {
        await fs.access(logoPath);
      } catch {
        console.warn(`Logo no encontrado en ruta: ${logoPath}`);
        return '';
      }

      // Leer archivo y convertir a base64
      const fileBuffer = await fs.readFile(logoPath);
      const base64String = fileBuffer.toString('base64');

      // Determinar mime type
      let mimeType = 'image/png';
      if (logoUrl.toLowerCase().endsWith('.jpg') || logoUrl.toLowerCase().endsWith('.jpeg')) {
        mimeType = 'image/jpeg';
      } else if (logoUrl.toLowerCase().endsWith('.gif')) {
        mimeType = 'image/gif';
      }

      return `data:${mimeType};base64,${base64String}`;
    } catch (error) {
      console.error('Error al leer logo:', error);
      return '';
    }
  }

  /**
   * Formatear moneda
   */
  formatCurrency(amount) {
    return `$${parseFloat(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  }

  /**
   * Formatear fecha
   */
  formatDate(date) {
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
   * Mapear tipo de DTE a nombre
   */
  getTipoDteName(tipoDte) {
    const tipoDteNames = {
      '01': 'FACTURA CONSUMIDOR FINAL',  // Corregido según fe-fc-v1.json
      '03': 'CRÉDITO FISCAL',
      '04': 'NOTA DE REMISIÓN',
      '05': 'NOTA DE CRÉDITO',
      '06': 'NOTA DE DÉBITO',
      '07': 'COMPROBANTE DE RETENCIÓN',
      '08': 'COMPROBANTE DE LIQUIDACIÓN',
      '11': 'FACTURA DE EXPORTACIÓN',
      '14': 'FACTURA DE SUJETO EXCLUIDO',
      '15': 'COMPROBANTE DE DONACIÓN',
    };
    return tipoDteNames[tipoDte] || 'DOCUMENTO TRIBUTARIO';
  }

  /**
   * Construir HTML del PDF
   */
  async buildHtmlTemplate(dteData, dteJson) {
    const { dte, empresaConfig } = dteData;
    const identificacion = dteJson.identificacion || {};
    const receptor = dteJson.receptor || {};
    const cuerpoDocumento = dteJson.cuerpoDocumento || [];
    const resumen = dteJson.resumen || {};

    // Generar QR
    const qrImage = dte.qrImage || '';

    const tipoDteName = this.getTipoDteName(dte.tipoDte || identificacion.tipoDte);

    // Construir dirección completa
    const direccionCompleta = empresaConfig.direccion || '';

    // Obtener logo en base64 si es necesario
    const logoContent = await this.getLogoContent(empresaConfig.logoUrl);

    // Construir tabla de items
    const itemsTable = this.buildItemsTable(cuerpoDocumento, dte.tipoDte || identificacion.tipoDte, resumen);

    // Construir resumen financiero
    const financialSummary = this.buildFinancialSummary(resumen);

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        ${this.getCssStyles(dte.tipoDte || identificacion.tipoDte)}
    </style>
</head>
<body>
    <div class="container-fluid">
        <!-- Header: Logo a la izquierda, Banner título al centro, QR a la derecha -->
        <div class="row header-row">
            <div class="col-logo">
                ${logoContent ? `<img id="dte_logo" src="${logoContent}" alt="Logo"/>` : ''}
            </div>
            <div class="col-title">
                <div class="title-banner">
                    <p class="title-main">DOCUMENTO TRIBUTARIO ELECTRÓNICO</p>
                    <p class="title-sub">${tipoDteName}</p>
                </div>
            </div>
            <div class="col-qr">
                <div class="qr-container">
                    ${qrImage ? `<img id="qr_cont" src="${qrImage}" alt="QR Code"/>` : ''}
                    <p class="qr-text-bold">Escanea el QR</p>
                    <p class="qr-text-small">Para poder visualizar la factura en el sitio oficial del Ministerio de Hacienda</p>
                </div>
            </div>
        </div>
        
        <!-- Información del DTE -->
        <div class="row dte-info-row">
            <div class="col-dte-info-left">
                <p class="dte-info-label">Código de generación:</p>
                <p class="dte-info-value">${dte.codigoGeneracion || identificacion.codigoGeneracion || ''}</p>
                <p class="dte-info-label">Número de control:</p>
                <p class="dte-info-value">${dte.numeroControl || identificacion.numeroControl || ''}</p>
                <p class="dte-info-label">Sello de recepción:</p>
                <p class="dte-info-value">${dte.selloRecibido || 'Pendiente'}</p>
            </div>
            <div class="col-dte-info-right">
                <p class="dte-info-label">Módelo de facturación:</p>
                <p class="dte-info-value">Normal</p>
                <p class="dte-info-label">Tipo de transmisión:</p>
                <p class="dte-info-value">Normal</p>
                <p class="dte-info-label">Fecha y hora de generación:</p>
                <p class="dte-info-value">${this.formatDate(dte.fechaEmision || new Date())}</p>
            </div>
        </div>
        
        <!-- Cajas Emisor y Receptor -->
        <div class="row emisor-receptor-row">
            <div class="col-emisor">
                <div class="info-box">
                    <div class="info-box-header">Emisor</div>
                    <div class="info-box-content">
                        <p><span class="info-label">Nombre o razon social:</span> <span class="info-value">${empresaConfig.nombreLegal || empresaConfig.nombreComercial || ''}</span></p>
                        <p><span class="info-label">NIT:</span> <span class="info-value">${empresaConfig.nit || ''}</span></p>
                        <p><span class="info-label">NRC:</span> <span class="info-value">${empresaConfig.nrc || ''}</span></p>
                        <p><span class="info-label">Actividad económica:</span> <span class="info-value">${empresaConfig.actividadEconomicaPrimaria || 'Actividad Económica'}</span></p>
                        <p><span class="info-label">Dirección:</span> <span class="info-value">${direccionCompleta || 'No especificada'}</span></p>
                        <p><span class="info-label">Número de teléfono:</span> <span class="info-value">${empresaConfig.telefono || 'No especificado'}</span></p>
                        <p><span class="info-label">Correo electrónico:</span> <span class="info-value">${empresaConfig.correo || 'No especificado'}</span></p>
                        <p><span class="info-label">Nombre comercial:</span> <span class="info-value">${empresaConfig.nombreComercial || empresaConfig.nombreLegal || ''}</span></p>
                    </div>
                </div>
            </div>
            
            <div class="col-receptor">
                <div class="info-box">
                    <div class="info-box-header">Receptor</div>
                    <div class="info-box-content">
                        <p><span class="info-label">Nombre o razon social:</span> <span class="info-value">${receptor.nombre || dte.nombreReceptor || 'CONSUMIDOR FINAL'}</span></p>
                        <p><span class="info-label">Nombre comercial:</span> <span class="info-value">CLIENTE TIKETE</span></p>
                        <p><span class="info-label">${receptor.tipoDocumento === '36' ? 'NIT' : 'DUI'}:</span> <span class="info-value">${receptor.numDocumento || dte.nitReceptor || ''}</span></p>
                        <p><span class="info-label">NRC:</span> <span class="info-value">${receptor.nrc || dte.nrcReceptor || ''}</span></p>
                        <p><span class="info-label">Actividad económica:</span> <span class="info-value"></span></p>
                        <p><span class="info-label">Dirección:</span> <span class="info-value">${receptor.direccion?.complemento || dte.direccionReceptor || 'SAN SALVADOR'}</span></p>
                        <p><span class="info-label">Correo electrónico:</span> <span class="info-value">${receptor.correo || dte.emailReceptor || ''}</span></p>
                        <p><span class="info-label">Número de teléfono:</span> <span class="info-value">12345678</span></p>
                        <p><span class="info-label">Condiciones de pago:</span> <span class="info-value">CONTADO</span></p>
                        <p><span class="info-label">Vendedor:</span> <span class="info-value">Tienda</span></p>
                        <p><span class="info-label">Facturado por:</span> <span class="info-value"></span></p>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Tabla de items -->
        ${itemsTable}
        
        <!-- Footer: Valor en letras y Resumen financiero -->
        <div class="row footer-row">
            <div class="col-footer-left">
                <p class="footer-label">Valor en letras:</p>
                <p class="footer-value">${resumen.totalLetras || this.numberToWords(resumen.totalPagar || resumen.montoTotalOperacion || 0)}</p>
                <p class="footer-label">Observaciones:</p>
                <div class="observations-box">
                    <p class="obs-line"></p>
                    <p class="obs-line"></p>
                    <p class="obs-line"></p>
                </div>
            </div>
            <div class="col-footer-right">
                ${financialSummary}
            </div>
        </div>
        
        <!-- Cajas ENTREGADO POR y RECIBIDO POR -->
        <div class="row delivery-row">
            <div class="col-delivery-left">
                <div class="delivery-box">
                    <p class="delivery-title">Operacion superior a $25000</p>
                    <p class="delivery-header">ENTREGADO POR:</p>
                    <p class="delivery-label">DUI</p>
                    <div class="delivery-signature-line"></div>
                    <p class="delivery-label">FIRMA</p>
                    <div class="delivery-signature-line"></div>
                </div>
            </div>
            <div class="col-delivery-right">
                <div class="delivery-box">
                    <p class="delivery-title">Operacion superior a $25000</p>
                    <p class="delivery-header">RECIBIDO POR:</p>
                    <p class="delivery-label">DUI</p>
                    <div class="delivery-signature-line"></div>
                    <p class="delivery-label">FIRMA</p>
                    <div class="delivery-signature-line"></div>
                </div>
            </div>
        </div>
        
        <p id="emi_filler">
            DTE generado por Factura Llama Clon - Sistema de Facturación Electrónica
        </p>
    </div>
</body>
</html>
    `;

    return html;
  }

  /**
   * Construir tabla de items
   */
  buildItemsTable(cuerpoDocumento, tipoDte, resumen) {
    let headers = `
                    <tr>
                        <th>N°</th>
                        <th>Cant</th>
                        <th>Unidad</th>
                        <th class="desc_col_th">Descripción</th>
                        <th>Precio unitario</th>
                        <th>Otros montos no afectos</th>
                        <th>Descuento por item</th>
    `;

    if (!['11', '14'].includes(tipoDte)) {
      headers += `
                        <th>Ventas No Sujetas</th>
                        <th>Ventas Exentas</th>
      `;
    }

    headers += `
                        <th>Ventas Gravadas</th>
                    </tr>
    `;

    let rows = '';
    cuerpoDocumento.forEach(item => {
      rows += `
                    <tr class="line_tr">
                        <td>${item.numItem || item.numeroLinea || ''}</td>
                        <td>${parseFloat(item.cantidad || 0).toFixed(2)}</td>
                        <td class="line_uniMedida">${item.uniMedida || 'UNI'}</td>
                        <td class="line_descripcion_td">
                            <span class="line_descripcion">${item.descripcion || ''}</span>
                        </td>
                        <td class="line_precioUni">${this.formatCurrency(item.precioUni || 0)}</td>
                        <td class="line_noGravado">${this.formatCurrency(item.noGravado || 0)}</td>
                        <td class="line_montoDescu">${this.formatCurrency(item.montoDescu || 0)}</td>
      `;

      if (!['11', '14'].includes(tipoDte)) {
        rows += `
                        <td class="line_ventaNoSuj">${this.formatCurrency(item.ventaNoSuj || 0)}</td>
                        <td class="line_ventaExenta">${this.formatCurrency(item.ventaExenta || 0)}</td>
        `;
      }

      rows += `
                        <td class="line_taxed_field_selector">${this.formatCurrency(item.ventaGravada || 0)}</td>
                    </tr>
      `;
    });

    // Totales
    const totals = this.buildTotalsFooter(resumen, tipoDte);

    return `
        <table class="lines_cont inv_format_tr">
            <thead class="head_tr">
                ${headers}
            </thead>
            <tbody>
                ${rows}
            </tbody>
            <tfoot>
                ${totals}
            </tfoot>
        </table>
    `;
  }

  /**
   * Construir footer con totales
   */
  buildTotalsFooter(resumen, tipoDte) {
    // Calcular número de columnas según tipo de DTE
    const numCols = ['11', '14'].includes(tipoDte) ? 8 : 10;
    
    let html = `
                <tr class="spacer-row">
                    <td colspan="${numCols}" style="border: none; padding: 0; height: 300px; background: transparent;"></td>
                </tr>
    `;

    if (resumen.totalNoSuj > 0 || resumen.totalExenta > 0 || resumen.totalGravada > 0) {
      html += `
                <tr class="sum_tr sum_line">
                    <td class="non_border_cell"></td>
                    <td class="non_border_cell"></td>
                    <td class="non_border_cell"></td>
                    <td class="non_border_cell"></td>
                    <td colspan="2" class="left_sum_line">SUMA DE VENTAS:</td>
      `;
      
      if (!['11', '14'].includes(tipoDte)) {
        html += `
                    <td class="amt_sum_line">${this.formatCurrency(resumen.totalNoSuj || 0)}</td>
                    <td class="amt_sum_line">${this.formatCurrency(resumen.totalExenta || 0)}</td>
        `;
      }
      
      html += `
                    <td class="amt_sum_line">${this.formatCurrency(resumen.totalGravada || 0)}</td>
                </tr>
      `;
    }

    if (resumen.ivaRete1 > 0) {
      const colspan = ['11', '14'].includes(tipoDte) ? 6 : 7;
      html += `
                <tr class="total_tr">
                    <td colspan="${colspan}" class="left_sum_line">IVA Retenido:</td>
                    <td class="amt_sum_line">${this.formatCurrency(resumen.ivaRete1 || 0)}</td>
                </tr>
      `;
    }

    if (resumen.reteRenta > 0) {
      const colspan = ['11', '14'].includes(tipoDte) ? 6 : 7;
      html += `
                <tr class="total_tr">
                    <td colspan="${colspan}" class="left_sum_line">Retención de Renta:</td>
                    <td class="amt_sum_line">${this.formatCurrency(resumen.reteRenta || 0)}</td>
                </tr>
      `;
    }

    html += `
                <tr class="total_tr">
                    <td colspan="${numCols}" style="border: none; padding: 2px; height: 5px;"></td>
                </tr>
    `;

    return html;
  }

  /**
   * Construir resumen financiero
   */
  buildFinancialSummary(resumen) {
    const totalVentas = (resumen.subTotalVentas || resumen.totalGravada + resumen.totalExenta + resumen.totalNoSuj || 0);

    return `
        <div class="financial-summary">
            <div class="summary-line">
                <span class="summary-label">Sumatoria total de ventas:</span>
                <span class="summary-value">${this.formatCurrency(totalVentas)}</span>
            </div>
            <div class="summary-line">
                <span class="summary-label">Monto global Desc. Rebajas y otros a ventas gravadas:</span>
                <span class="summary-value">${this.formatCurrency(resumen.descuGravada || resumen.totalDescu || 0)}</span>
            </div>
            <div class="summary-line">
                <span class="summary-label">Sub-Total:</span>
                <span class="summary-value">${this.formatCurrency(resumen.subTotal || 0)}</span>
            </div>
            <div class="summary-line">
                <span class="summary-label">IVA Retenido:</span>
                <span class="summary-value">${this.formatCurrency(resumen.ivaRete1 || 0)}</span>
            </div>
            ${resumen.reteRenta > 0 ? `
            <div class="summary-line">
                <span class="summary-label">Retencion Renta:</span>
                <span class="summary-value">${this.formatCurrency(resumen.reteRenta || 0)}</span>
            </div>
            ` : ''}
            <div class="summary-line">
                <span class="summary-label">Monto total de la Operacion:</span>
                <span class="summary-value">${this.formatCurrency(resumen.montoTotalOperacion || 0)}</span>
            </div>
            ${resumen.totalNoGravado > 0 ? `
            <div class="summary-line">
                <span class="summary-label">Total Otros Montos no afectos:</span>
                <span class="summary-value">${this.formatCurrency(resumen.totalNoGravado || 0)}</span>
            </div>
            ` : ''}
            <div class="summary-line summary-total">
                <span class="summary-label">Total a pagar:</span>
                <span class="summary-value">${this.formatCurrency(resumen.totalPagar || resumen.montoTotalOperacion || 0)}</span>
            </div>
        </div>
    `;
  }

  /**
   * Convertir número a palabras (simplificado)
   */
  numberToWords(number) {
    return `$${parseFloat(number).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  }

  /**
   * Obtener estilos CSS - Exactamente iguales a super_pos
   */
  getCssStyles(tipoDte = '01') {
    const cssBase = `
        @page {
            size: A4;
            margin: 4mm;
        }
        
        html, body {
            margin: 0;
            padding: 0;
            height: 100%;
        }
        
        /* Fuente Montserrat - usando fuente del sistema como fallback */
        @font-face {
            font-family: 'Montserrat';
            font-style: normal;
            font-weight: 400;
            src: local('Montserrat Regular'), local('Montserrat-Regular');
        }
        
        @font-face {
            font-family: 'Montserrat';
            font-style: normal;
            font-weight: 600;
            src: local('Montserrat SemiBold'), local('Montserrat-SemiBold');
        }
        
        @font-face {
            font-family: 'Montserrat';
            font-style: normal;
            font-weight: 700;
            src: local('Montserrat Bold'), local('Montserrat-Bold');
        }
        
        * {
            font-size: 9px;
            font-family: 'Montserrat', 'Arial', sans-serif;
            box-sizing: border-box;
        }
        
        body {
            background: white;
            color: black;
            margin: 0;
            padding: 0;
        }
        
        .container-fluid {
            width: 100%;
            padding: 0;
        }
        
        .row {
            display: flex;
            flex-wrap: nowrap;
            margin-bottom: 3px;
        }
        
        .row:last-child {
            margin-bottom: 0;
        }
        
        /* Header row: Logo, Título, QR */
        .header-row {
            display: flex;
            align-items: flex-start;
            margin-bottom: 4px;
        }
        
        .col-logo {
            width: 18%;
            padding-right: 3px;
            display: flex;
            align-items: flex-start;
            justify-content: flex-start;
        }
        
        .col-title {
            width: 57%;
            padding: 0 3px;
        }
        
        .col-qr {
            width: 25%;
            padding-left: 3px;
        }
        
        /* Banner de título azul oscuro */
        .title-banner {
            background: #001e41;
            padding: 6px 4px;
            text-align: center;
            border: 1px solid #001e41;
        }
        
        .title-main {
            color: white;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
            margin: 0 0 2px 0;
            line-height: 1.1;
        }
        
        .title-sub {
            color: white;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
            margin: 0;
            line-height: 1.1;
        }
        
        /* QR Container */
        .qr-container {
            border: 1px solid #001e41;
            padding: 4px;
            text-align: center;
            background: white;
        }
        
        #qr_cont {
            max-width: 70px;
            margin: 0 auto 2px auto;
            display: block;
            margin-left: auto;
            margin-right: auto;
        }
        
        .qr-text-bold {
            font-weight: bold;
            color: black;
            font-size: 6px;
            margin: 1px 0;
        }
        
        .qr-text-small {
            color: black;
            font-size: 5px;
            margin: 0;
            line-height: 1.0;
        }
        
        /* Información del DTE */
        .dte-info-row {
            display: flex;
            margin-bottom: 4px;
        }
        
        .col-dte-info-left, .col-dte-info-right {
            width: 50%;
            padding: 0 2px;
        }
        
        .dte-info-label {
            font-weight: bold;
            color: black;
            font-size: 10px;
            margin: 0;
        }
        
        .dte-info-value {
            color: black;
            font-size: 10px;
            margin: 0 0 2px 0;
            word-break: break-all;
        }
        
        /* Cajas Emisor y Receptor */
        .emisor-receptor-row {
            display: flex;
            margin-bottom: 4px;
            gap: 3px;
        }
        
        .col-emisor, .col-receptor {
            width: 50%;
        }
        
        .info-box {
            border: 1px solid #001e41;
            background: white;
        }
        
        .info-box-header {
            background: #001e41;
            color: white;
            font-weight: bold;
            text-align: center;
            padding: 4px;
            font-size: 9px;
            text-transform: uppercase;
        }
        
        .info-box-content {
            padding: 4px;
        }
        
        .info-box-content p {
            margin: 1px 0;
            color: black;
            font-size: 10px;
            line-height: 1.2;
        }
        
        .info-label {
            font-weight: bold;
            color: black;
        }
        
        .info-value {
            color: black;
        }
        
        p, p *, table {
            margin: 0px;
            color: black;
        }
        
        #dte_logo {
            max-width: 100%;
            max-height: 80px;
            width: auto;
            height: auto;
            object-fit: contain;
        }
        
        .lines_cont {
            margin-top: 10px;
            width: 100%;
            border-collapse: collapse;
        }
        
        .head_tr {
            background: #001e41;
            color: white;
            font-weight: bold;
        }
        
        .head_tr tr {
            height: 0mm !important;
        }
        
        .head_tr th {
            text-align: center;
            vertical-align: middle;
            padding: 4px 2px;
            border: 1px solid #001e41;
            font-size: 8px;
            font-weight: bold;
            color: white;
        }
        
        .head_tr th:nth-child(1) {
            width: 3%;
        }
        
        .head_tr th:nth-child(2) {
            width: 5%;
        }
        
        .head_tr th:nth-child(3) {
            width: 6%;
        }
        
        .head_tr th:nth-child(4) {
            width: 25%;
        }
        
        .head_tr th:nth-child(5) {
            width: 10%;
        }
        
        .head_tr th:nth-child(6) {
            width: 10%;
        }
        
        .head_tr th:nth-child(7) {
            width: 8%;
        }
        
        .head_tr th, .head_tr td {
            border: 1px solid black !important;
        }
        
        .line_tr td {
            text-align: center !important;
            vertical-align: top;
            border-left: 1px solid #001e41;
            border-right: 1px solid #001e41;
            padding: 2px 1px;
            color: black;
            font-size: 10px;
        }
        
        .line_descripcion_td {
            text-align: left !important;
        }
        
        .line_tr td:nth-child(n+5) {
            text-align: right;
            padding-right: 2px;
        }
        
        .line_tr td:nth-child(n+6):nth-child(-n+7) {
            text-align: right !important;
            padding-right: 2px;
        }
        
        .line_tr td:last-child {
            text-align: right !important;
            padding-right: 2px;
        }
        
        tfoot {
            border: 1px solid #001e41;
            margin-top: 40px;
        }
        
        tfoot td {
            border: none !important;
            padding: 1px 2px;
            font-size: 10px;
        }
        
        /* Espacio antes de SUMA DE VENTAS para separar de la tabla */
        tfoot tr:first-child {
            margin-top: 40px;
        }
        
        .sum_line {
            margin-top: 40px;
        }
        
        .sum_line td {
            padding-top: 20px;
        }
        
        .total_tr td {
            font-weight: 500;
            text-align: end;
        }
        
        .total_tr td:last-child {
            text-align: right;
            font-weight: 500;
        }
        
        .sum_line td, .sum_line td span, .total_tr td span {
            text-align: left;
            font-weight: 500;
        }
        
        tfoot * {
            font-weight: normal !important;
        }
        
        .amt_sum_line {
            text-align: right !important;
            padding-right: 2px;
        }
        
        /* Fila espaciadora antes de SUMA DE VENTAS */
        .spacer-row {
            border: none !important;
        }
        
        .spacer-row td {
            border: none !important;
            padding: 0 !important;
            height: 300px;
            background: transparent !important;
        }
        
        .mess_holder {
            vertical-align: top;
        }
        
        /* Footer: Valor en letras y Resumen financiero */
        .footer-row {
            display: flex;
            margin-top: 4px;
            margin-bottom: 3px;
        }
        
        .col-footer-left {
            width: 50%;
            padding-right: 3px;
        }
        
        .col-footer-right {
            width: 50%;
            padding-left: 3px;
        }
        
        .footer-label {
            font-weight: bold;
            color: black;
            font-size: 10px;
            margin: 1px 0;
        }
        
        .footer-value {
            color: black;
            font-size: 10px;
            margin: 0 0 3px 0;
        }
        
        .observations-box {
            border: 1px solid #001e41;
            padding: 2px;
            min-height: 30px;
            margin-top: 1px;
        }
        
        .obs-line {
            border-bottom: 1px solid #ccc;
            margin: 1px 0;
            height: 7px;
        }
        
        /* Resumen financiero */
        .financial-summary {
            border: 1px solid #001e41;
            padding: 2px;
        }
        
        .summary-line {
            display: flex;
            justify-content: space-between;
            padding: 0.5px 0;
            border-bottom: 1px solid #001e41;
        }
        
        .summary-line:last-child {
            border-bottom: none;
        }
        
        .summary-total {
            border-top: 2px solid #001e41;
            border-bottom: 2px solid #001e41;
            font-weight: bold;
            margin-top: 1px;
            padding: 1px 0;
        }
        
        .summary-label {
            color: black;
            font-size: 10px;
            text-align: left;
            flex: 1;
            padding-right: 3px;
        }
        
        .summary-value {
            color: black;
            font-size: 10px;
            text-align: right;
            font-weight: 500;
            white-space: nowrap;
        }
        
        .summary-total .summary-value {
            font-weight: bold;
            font-size: 10px;
        }
        
        /* Cajas ENTREGADO POR y RECIBIDO POR */
        .delivery-row {
            display: flex;
            margin-top: 3px;
            margin-bottom: 2px;
            gap: 3px;
        }
        
        .col-delivery-left, .col-delivery-right {
            width: 50%;
        }
        
        .delivery-box {
            border: 1px solid #001e41;
            padding: 3px;
            background: white;
        }
        
        .delivery-title {
            font-weight: bold;
            color: black;
            font-size: 6px;
            margin: 0 0 2px 0;
        }
        
        .delivery-header {
            font-weight: bold;
            color: black;
            font-size: 10px;
            text-transform: uppercase;
            margin: 1px 0;
        }
        
        .delivery-label {
            font-weight: bold;
            color: black;
            font-size: 6px;
            margin: 2px 0 1px 0;
        }
        
        .delivery-signature-line {
            border-bottom: 1px solid #001e41;
            height: 15px;
            margin: 1px 0 2px 0;
        }
        
        .desc_col_th {
            text-align: center !important;
        }
        
        .non_border_cell {
            border: none !important;
        }
        
        .left_sum_line {
            text-align: left;
            font-weight: 500;
        }
        
        .useless_text {
            font-weight: 500;
            margin: 2px 0;
        }
        
        #emi_filler {
            color: black;
            font-size: 10px;
            margin-top: 5px;
            margin-left: 5px;
            text-align: center;
        }
    `;
    
    return cssBase;
  }

  /**
   * Generar PDF del DTE
   */
  async generatePdf(dteData, dteJson) {
    try {
      // Generar QR antes de construir el HTML
      const qrImage = await this.generateQrCode(dteData.dte.codigoGeneracion);
      
      // Agregar QR al objeto dte para que esté disponible en el template
      const dteDataWithQr = {
        ...dteData,
        dte: {
          ...dteData.dte,
          qrImage: qrImage
        }
      };

      // Construir HTML (ahora es async)
      const htmlContent = await this.buildHtmlTemplate(dteDataWithQr, dteJson);

      // Generar PDF con Puppeteer
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: {
          top: '4mm',
          right: '4mm',
          bottom: '4mm',
          left: '4mm'
        },
        printBackground: true
      });

      await browser.close();

      console.log('✅ PDF generado exitosamente');
      return pdfBuffer;
    } catch (error) {
      console.error('❌ Error al generar PDF:', error);
      return null;
    }
  }
}

module.exports = new DtePdfGenerator();
