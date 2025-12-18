const BaseGenerator = require('./BaseGenerator');

class CreditoFiscalGenerator extends BaseGenerator {
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

        // Establishment Code Logic 
        let rawCodEst = empresaConfig.codigoMH?.substring(0, 4) || '0001';
        if (rawCodEst.startsWith('5') || rawCodEst.length < 1) rawCodEst = '0001';

        // Note: User's example showed 'M001'. We stick to logic but this strongly suggests config is key.
        const codigoEstablecimiento = String(rawCodEst).padStart(4, '0');
        const puntoEmision = String(empresaConfig.codigoMH?.substring(4, 8) || '0001').padStart(4, '0');

        // Type 03 for Credito Fiscal
        const numeroControl = this.buildControlNumber('CCF', codigoEstablecimiento, puntoEmision, numeroDocumento);

        const cuerpoDocumento = this.buildItemsStandard(items, 'CCF');
        const totalsFromItems = this.calculateTotalsStandard(cuerpoDocumento);

        const subTotalVentas = totalsFromItems.totalVentaGravada + totalsFromItems.totalVentaExenta + totalsFromItems.totalVentaNoSujeta;
        const subTotal = subTotalVentas - totalsFromItems.totalDescuentos - descuentoGlobal;
        const iva = totalsFromItems.totalImpuestos;
        const montoTotalOperacion = subTotal + iva - retenciones.iva - retenciones.renta; // Review formula for CCF
        // In Example:
        // subTotalVentas: 66.37
        // tributos (IVA): 8.63
        // subTotal: 66.37
        // montoTotalOperacion: 75.00 (66.37 + 8.63)
        // totalPagar: 75

        // Formula looks consistent: SubTotal + Taxes - Retentions

        const totalPagar = montoTotalOperacion;

        const dteJson = {
            identificacion: this.buildIdentificacion('CCF', numeroControl, codigoGeneracion, fechaEmision, ambiente, 3),
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
                // CCF REQUIRES IVA in tributos summary? 
                // Example: tributos: [{ codigo: '20', ... }]
                tributos: iva > 0 ? [{
                    codigo: '20',
                    descripcion: 'Impuesto al Valor Agregado 13%',
                    valor: iva
                }] : null,
                subTotal: subTotal,
                ivaPerci1: 0, // Field specific to CCF? Example has it.
                ivaRete1: retenciones.iva || 0,
                reteRenta: retenciones.renta || 0,
                montoTotalOperacion: montoTotalOperacion,
                totalNoGravado: 0.0,
                totalPagar: totalPagar,
                totalLetras: this.numeroALetras(totalPagar),
                // totalIva? Example doesn't have 'totalIva' in resumen!
                // CHECK EXAMPLE AGAIN: "totalIva" IS MISSING in Example Resumen!
                // It has 'tributos' array.
                // BaseGenerator / Factura has 'totalIva'.
                // This is a KEY DIFFERENCE.
                saldoFavor: 0.0,
                condicionOperacion: 1,
                pagos: [{
                    codigo: '01', // Example used '05' (Credito?), defaults to 01 (Billetes) for now
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
            tipoDteCodigo: '03'
        };
    }

    buildReceptor(cliente) {
        // CCF needs strict receptor data
        if (!cliente || !cliente.nit) {
            // Warning: CCF requires valid receptor. 
            // Returning minimal structure to avoid crash, but this will fail validation if empty.
            return null;
        }
        return {
            nit: cliente.nit,
            nrc: cliente.nrc,
            nombre: cliente.nombre,
            nombreComercial: cliente.nombreComercial || cliente.nombre,
            codActividad: cliente.codActividad || '10005', // Example used 86901. Needs real data.
            descActividad: cliente.descActividad || 'Otros',
            direccion: {
                departamento: cliente.departamento || '06',
                municipio: cliente.municipio || '14',
                complemento: cliente.direccion || 'San Salvador'
            },
            telefono: cliente.telefono || '00000000',
            correo: cliente.correo || 'cliente@test.com'
        };
    }
}

module.exports = CreditoFiscalGenerator;
