const BaseGenerator = require('./BaseGenerator');

class FacturaGenerator extends BaseGenerator {
    generate(data) {
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
        const fechaEmision = new Date();

        // Establishment Code Logic (Copied from dte-builder fixed version)
        let rawCodEst = empresaConfig.codigoMH?.substring(0, 4) || '0001';
        if (rawCodEst.startsWith('5') || rawCodEst.length < 1) rawCodEst = '0001';

        const codigoEstablecimiento = String(rawCodEst).padStart(4, '0');
        const puntoEmision = String(empresaConfig.codigoMH?.substring(4, 8) || '0001').padStart(4, '0');
        const numeroControl = this.buildControlNumber('FAC', codigoEstablecimiento, puntoEmision, numeroDocumento);

        const cuerpoDocumento = this.buildItemsStandard(items, 'FAC');
        const totalsFromItems = this.calculateTotalsStandard(cuerpoDocumento);

        const subTotalVentas = this.round(totalsFromItems.totalVentaGravada + totalsFromItems.totalVentaExenta + totalsFromItems.totalVentaNoSujeta);
        const subTotal = this.round(subTotalVentas - totalsFromItems.totalDescuentos - descuentoGlobal);
        const iva = totalsFromItems.totalImpuestos;
        // For FAC, subTotal is GROSS (includes VAT), so we do NOT add IVA again.
        const montoTotalOperacion = this.round(subTotal - (retenciones.iva || 0) - (retenciones.renta || 0));
        const totalPagar = montoTotalOperacion;

        const dteJson = {
            identificacion: this.buildIdentificacion('FAC', numeroControl, codigoGeneracion, fechaEmision, ambiente),
            documentoRelacionado: null,
            emisor: this.buildEmisor(empresaConfig, codigoEstablecimiento, puntoEmision),
            receptor: this.buildReceptor(cliente),
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
                tributos: null, // Fixed: Remove IVA 20 from summary
                subTotal: subTotal,
                ivaRete1: retenciones.iva || 0,
                reteRenta: retenciones.renta || 0,
                montoTotalOperacion: montoTotalOperacion,
                totalNoGravado: 0.0,
                totalPagar: totalPagar,
                totalLetras: this.numeroALetras(totalPagar),
                totalIva: iva,
                saldoFavor: 0.0,
                condicionOperacion: 1,
                pagos: [{
                    codigo: '01',
                    montoPago: totalPagar,
                    referencia: null,
                    plazo: null,
                    periodo: null
                }],
                numPagoElectronico: null
            },
            extension: null,
            apendice: null
        };

        return {
            dteJson,
            codigoGeneracion,
            numeroControl,
            tipoDteCodigo: '01'
        };
    }

    buildReceptor(cliente) {
        if (!cliente || !cliente.nit) return null;
        return {
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
        };
    }
}

module.exports = FacturaGenerator;
