const BaseGenerator = require('./BaseGenerator');

class FSEGenerator extends BaseGenerator {
    generate(data) {
        const {
            empresaConfig,
            sujetoExcluido: sujetoExcluidoRaw, // Rename to avoid confusion with the method
            cliente,
            items,
            totales,
            retenciones = { renta: 0, iva: 0 },
            ambiente = 'PRUEBAS',
            numeroDocumento = 1,
            tipoModelo = 1,
            tipoOperacion = 1
        } = data;

        // Log input for debugging FSE
        require('fs').appendFileSync('server_current.log', `[FSE DEBUG] sujetoExcluidoRaw: ${JSON.stringify(sujetoExcluidoRaw)}\n`);
        require('fs').appendFileSync('server_current.log', `[FSE DEBUG] cliente: ${JSON.stringify(cliente)}\n`);

        const receptorData = sujetoExcluidoRaw || cliente;
        const codigoGeneracion = this.generateUUID();
        const fechaEmision = new Date();

        // Establishment Code Logic
        let rawCodEst = empresaConfig.codigoMH?.substring(0, 4) || '0001';
        if (rawCodEst.startsWith('5') || rawCodEst.length < 1) rawCodEst = '0001';

        const codigoEstablecimiento = String(rawCodEst).padStart(4, '0');
        const puntoEmision = String(empresaConfig.codigoMH?.substring(4, 8) || '0001').padStart(4, '0');
        const numeroControl = this.buildControlNumber('FSE', codigoEstablecimiento, puntoEmision, numeroDocumento);

        const cuerpoDocumento = this.buildItemsFSE(items);

        // Si es contingencia, tipoOperacion suele ser 2 (Contingencia)
        const finalTipoOperacion = (tipoModelo === 2) ? 2 : tipoOperacion;

        const dteJson = {
            identificacion: this.buildIdentificacion('FSE', numeroControl, codigoGeneracion, fechaEmision, ambiente, 1, tipoModelo, finalTipoOperacion),
            emisor: this.buildEmisorFSE(empresaConfig, codigoEstablecimiento, puntoEmision),
            sujetoExcluido: this.buildSujetoExcluido(receptorData),
            cuerpoDocumento: cuerpoDocumento,
            resumen: {
                totalCompra: this.round(totales?.totalCompra || 0),
                descu: this.round(totales?.descu || 0),
                totalDescu: this.round(totales?.totalDescu || 0),
                subTotal: this.round(totales?.subTotal || 0),
                ivaRete1: this.round(totales?.ivaRete1 || 0),
                reteRenta: this.round(totales?.reteRenta || 0),
                totalPagar: this.round(totales?.totalPagar || 0),
                totalLetras: this.numeroALetras(totales?.totalPagar || 0),
                condicionOperacion: totales?.condicionOperacion || 1,
                pagos: (totales?.pagos || []).map(p => ({
                    codigo: p.codigo || '01',
                    montoPago: this.round(p.montoPago || totales?.totalPagar || 0),
                    referencia: p.referencia || null,
                    plazo: p.plazo || null,
                    periodo: p.periodo || null
                })),
                observaciones: totales?.observaciones || null
            },
            apendice: null
        };

        // Fallback pagos if empty
        if (dteJson.resumen.pagos.length === 0) {
            dteJson.resumen.pagos.push({
                codigo: '01',
                montoPago: dteJson.resumen.totalPagar,
                referencia: null,
                plazo: null,
                periodo: null
            });
        }

        return {
            dteJson,
            codigoGeneracion,
            numeroControl,
            tipoDteCodigo: '14'
        };
    }

    /**
     * Build Emisor for FSE (excludes forbidden fields for DTE 14)
     */
    buildEmisorFSE(empresaConfig, codigoEstablecimiento, puntoEmision) {
        return {
            nit: empresaConfig.nit,
            nrc: empresaConfig.nrc,
            nombre: empresaConfig.nombreLegal || empresaConfig.nombreComercial,
            codActividad: /^\d{5}$/.test(empresaConfig.actividadEconomicaPrimaria) ? empresaConfig.actividadEconomicaPrimaria : '56101',
            descActividad: empresaConfig.descActividad || 'VENTA DE COMIDAS Y BEBIDAS',
            direccion: {
                departamento: empresaConfig.direccion?.departamento || '06',
                municipio: empresaConfig.direccion?.municipio || '14',
                complemento: String(empresaConfig.direccion?.complemento || empresaConfig.direccion || 'San Salvador').substring(0, 200)
            },
            telefono: empresaConfig.telefono || '',
            correo: empresaConfig.correo || '',
            codEstableMH: codigoEstablecimiento,
            codEstable: codigoEstablecimiento,
            codPuntoVentaMH: puntoEmision.startsWith('P') ? puntoEmision : 'P' + puntoEmision.padStart(3, '0'), // Reference used P001
            codPuntoVenta: String(puntoEmision).replace('P', '')
        };
    }

    buildSujetoExcluido(c) {
        if (!c) return null;

        // Map identification type
        let tipoDoc = c.tipoDocumento || '13';

        // Use nit if present, otherwise numDocumento/numeroDocumento
        let rawNum = c.numDocumento || c.numeroDocumento || c.nit || '000000000';

        // Clean non-alphanumeric just in case, but usually hyphens are the issue
        let numDoc = String(rawNum).replace(/[^0-9A-Z]/g, '');

        // Validation based on MH schemas:
        // DUI (13): 9 digits
        // NIT (36): 14 digits
        // For DTE 14 reference, a 9-digit number was used for tipoDocumento 13 (DUI)

        if (tipoDoc === '13' && numDoc.length > 9) {
            numDoc = numDoc.substring(0, 9);
        } else if (tipoDoc === '36' && numDoc.length > 14) {
            numDoc = numDoc.substring(0, 14);
        }

        return {
            tipoDocumento: tipoDoc,
            numDocumento: numDoc,
            nombre: String(c.nombre || 'SUJETO EXCLUIDO').substring(0, 200),
            codActividad: c.codActividad || null,
            descActividad: c.descActividad || null,
            direccion: {
                departamento: c.departamento || '06',
                municipio: c.municipio || '14',
                complemento: String(c.direccion?.complemento || c.direccion || 'San Salvador').substring(0, 200)
            },
            telefono: c.telefono || null,
            correo: c.correo || null
        };
    }

    buildItemsFSE(invoiceItems) {
        return invoiceItems.map((item, index) => {
            const cantidad = parseFloat(item.cantidad || 0);
            const precioUni = parseFloat(item.precioUni || item.precio || 0);
            const montoDescu = parseFloat(item.montoDescu || item.descuento || 0);

            // FSE specific field: compra = (cantidad * precioUni) - montoDescu
            const compra = this.round((cantidad * precioUni) - montoDescu);

            return {
                numItem: index + 1,
                tipoItem: item.tipoItem || 1,
                cantidad: parseFloat(cantidad.toFixed(4)),
                codigo: item.codigo || null,
                uniMedida: parseInt(item.uniMedida) || 59,
                descripcion: item.descripcion || item.producto || 'SERVICIO',
                precioUni: this.round(precioUni, 6),
                montoDescu: this.round(montoDescu),
                compra: compra
            };
        });
    }
}

module.exports = FSEGenerator;
