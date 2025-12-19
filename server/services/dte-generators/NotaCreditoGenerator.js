const BaseGenerator = require('./BaseGenerator');

class NotaCreditoGenerator extends BaseGenerator {
    generate(data) {
        const {
            empresaConfig,
            cliente,
            items,
            documentoRelacionado,
            retenciones = { renta: 0, iva: 0 },
            descuentoGlobal = 0,
            ambiente = 'PRUEBAS',
            numeroDocumento = 1
        } = data;

        console.log('LOG: NotaCreditoGenerator received documentoRelacionado:', JSON.stringify(documentoRelacionado));

        const codigoGeneracion = this.generateUUID();
        const fechaEmision = new Date();

        let rawCodEst = empresaConfig.codigoMH?.substring(0, 4) || '0001';
        if (rawCodEst.startsWith('5') || rawCodEst.length < 1) rawCodEst = '0001';

        const codigoEstablecimiento = String(rawCodEst).padStart(4, '0');
        const puntoEmision = String(empresaConfig.codigoMH?.substring(4, 8) || '0001').padStart(4, '0');

        const numeroControl = this.buildControlNumber('NCR', codigoEstablecimiento, puntoEmision, numeroDocumento);

        // Documento Relacionado - Must be Array
        let docsRel = null;
        let refUUID = null;
        if (documentoRelacionado) {
            docsRel = Array.isArray(documentoRelacionado) ? documentoRelacionado : [documentoRelacionado];
            if (docsRel.length > 0) refUUID = docsRel[0].numeroDocumento;
        }

        // Body Construction
        const itemsBuilt = this.buildItemsStandard(items, 'NCR');

        // Clean items for NCR
        const cuerpoDocumento = itemsBuilt.map(item => {
            const { psv, noGravado, ...rest } = item;

            // Link item to referenced doc UUID if not explicit
            return {
                ...rest,
                numeroDocumento: item.numeroDocumento || refUUID || null,
                codigo: item.codigo || null
            };
        });

        const totalsFromItems = this.calculateTotalsStandard(itemsBuilt);
        const subTotalVentas = this.round(totalsFromItems.totalVentaGravada + totalsFromItems.totalVentaExenta + totalsFromItems.totalVentaNoSujeta);
        const iva = this.round(totalsFromItems.totalImpuestos);
        const montoTotalOperacion = this.round(subTotalVentas + iva - (retenciones.iva || 0) - (retenciones.renta || 0));

        const dteJson = {
            identificacion: this.buildIdentificacion('NCR', numeroControl, codigoGeneracion, fechaEmision, ambiente, 3),
            documentoRelacionado: docsRel,
            emisor: this.buildEmisor(empresaConfig, codigoEstablecimiento, puntoEmision),
            receptor: this.buildReceptor(cliente),
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
                    descripcion: 'Impuesto al Valor Agregado 13%',
                    valor: iva
                }] : null,
                subTotal: this.round(subTotalVentas - (totalsFromItems.totalDescuentos + descuentoGlobal)),
                ivaPerci1: 0.0,
                ivaRete1: retenciones.iva || 0,
                reteRenta: retenciones.renta || 0,
                montoTotalOperacion: montoTotalOperacion,
                totalLetras: this.numeroALetras(montoTotalOperacion),
                condicionOperacion: 1
            },
            extension: {
                nombEntrega: null,
                docuEntrega: null,
                nombRecibe: null,
                docuRecibe: null,
                observaciones: null
            },
            apendice: null
        };

        return {
            dteJson,
            codigoGeneracion,
            numeroControl,
            tipoDteCodigo: '05'
        };
    }

    buildEmisor(empresaConfig, codigoEstablecimiento, puntoEmision) {
        return {
            nit: empresaConfig.nit,
            nrc: empresaConfig.nrc,
            nombre: empresaConfig.nombreLegal || empresaConfig.nombre,
            codActividad: empresaConfig.actividadEconomica || '56101',
            descActividad: empresaConfig.descActividad || 'Actividad',
            nombreComercial: empresaConfig.nombreComercial,
            tipoEstablecimiento: '01',
            direccion: {
                departamento: empresaConfig.direccion?.departamento || '06',
                municipio: empresaConfig.direccion?.municipio || '14',
                complemento: empresaConfig.direccion?.complemento || 'San Salvador'
            },
            telefono: empresaConfig.telefono || '00000000',
            correo: empresaConfig.correo || 'test@test.com'
        };
    }

    buildControlNumber(tipoDte, codigoEstablecimiento, puntoEmision, numeroDocumento) {
        const numDocPadded = String(numeroDocumento).padStart(15, '0');
        return `DTE-05-${codigoEstablecimiento}${puntoEmision}-${numDocPadded}`;
    }

    buildIdentificacion(tipoDte, numeroControl, codigoGeneracion, fechaEmision, ambiente, version = 3) {
        const base = super.buildIdentificacion(tipoDte, numeroControl, codigoGeneracion, fechaEmision, ambiente, version);
        base.tipoDte = '05';
        return base;
    }

    buildReceptor(cliente) {
        return super.buildReceptor(cliente, 'NCR');
    }
}

module.exports = NotaCreditoGenerator;
