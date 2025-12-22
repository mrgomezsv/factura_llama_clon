const BaseGenerator = require('./BaseGenerator');

class FacturaExportacionGenerator extends BaseGenerator {
    generate(data) {
        const {
            empresaConfig,
            cliente,
            items,
            totales,
            ambiente = 'PRUEBAS',
            numeroDocumento = 1,
            tipoModelo = 1,
            tipoOperacion = 1,
            // Datos específicos de FEX
            incoterms = 'OBT', // Default or from data
            modoTransporte = '01', // Catálogo 012: 01 Marítimo, 02 Ferroviario, 03 Carretera, 04 Aéreo
            recintoFiscal = '01', // Catálogo 013
            regimenAduanero = '15', // Catálogo 014: 15 Exportación definitiva
            tipoItemExpor = 1, // 1: Bienes, 2: Servicios, 3: Ambas
            descuentoGlobal = 0,
            flete = 0,
            seguro = 0,
            observaciones = null
        } = data;

        const codigoGeneracion = this.generateUUID();
        const fechaEmision = new Date();

        // Lógica de código de establecimiento
        let rawCodEst = empresaConfig.codigoMH?.substring(0, 4) || '0001';
        if (rawCodEst.startsWith('5') || rawCodEst.length < 1) rawCodEst = '0001';

        const codigoEstablecimiento = String(rawCodEst).padStart(4, '0');
        const puntoEmision = String(empresaConfig.codigoMH?.substring(4, 8) || '0001').padStart(4, '0');

        // FEX Specific Control Number: DTE-11-MXXXPXXX-XXXXXXXXXXXXXXX
        const codEst3 = codigoEstablecimiento.substring(1, 4);
        const punVen3 = puntoEmision.substring(1, 4);
        const correlativoStr = String(numeroDocumento).padStart(15, '0');
        const numeroControl = `DTE-11-M${codEst3}P${punVen3}-${correlativoStr}`;

        // Mapear ítems para FEX (Tipo 11) - Esquema v1
        const cuerpoDocumento = items.map((item, index) => {
            const cantidad = parseFloat(item.cantidad || 0);
            const precioUnitario = parseFloat(item.precio || 0);
            const descuento = parseFloat(item.descuento || 0);
            const ventaGravada = this.round(cantidad * (precioUnitario - descuento));

            return {
                numItem: index + 1,
                cantidad: parseFloat(cantidad.toFixed(4)),
                codigo: String(item.codigo || index + 1).substring(0, 25),
                uniMedida: this.mapUnidadMedida(item.unidad || 'UNI'),
                descripcion: String(item.descripcion || item.producto || '').substring(0, 1000),
                precioUni: parseFloat(precioUnitario.toFixed(6)),
                montoDescu: parseFloat(descuento.toFixed(2)),
                ventaGravada: ventaGravada,
                tributos: ["C3"], // Hacienda FEX v1: "tributos" array de strings requerido según allOf
                noGravado: 0.0
            };
        });

        const totalGravada = cuerpoDocumento.reduce((sum, item) => sum + item.ventaGravada, 0);
        const subTotalVentas = this.round(totalGravada);
        const montoTotalOperacion = this.round(subTotalVentas + flete + seguro - descuentoGlobal);
        const totalPagar = montoTotalOperacion;

        const dteJson = {
            identificacion: {
                ...this.buildIdentificacion('FEX', numeroControl, codigoGeneracion, fechaEmision, ambiente, 1, tipoModelo, tipoOperacion),
                motivoContigencia: null // Requerido por esquema FEX v1
            },
            emisor: {
                ...this.buildEmisor(empresaConfig, codigoEstablecimiento, puntoEmision),
                nombre: String(empresaConfig.nombreLegal || 'MI EMPRESA').substring(0, 200),
                nombreComercial: String(empresaConfig.nombreComercial || empresaConfig.nombreLegal || '').substring(0, 150) || 'COMERCIAL',
                tipoItemExpor: parseInt(tipoItemExpor),
                recintoFiscal: String(recintoFiscal || '01').padStart(2, '0'),
                regimen: String(regimenAduanero || 'EX-1.1000.000') // Catálogo 028: Exportación Definitiva
            },
            receptor: this.buildReceptorFEX(cliente),
            otrosDocumentos: null,
            ventaTercero: null,
            cuerpoDocumento: cuerpoDocumento,
            resumen: {
                totalGravada: totalGravada,
                descuento: 0.0,
                porcentajeDescuento: 0.0,
                totalDescu: this.round(descuentoGlobal),
                montoTotalOperacion: montoTotalOperacion,
                totalNoGravado: 0.0,
                totalPagar: totalPagar,
                totalLetras: this.numeroALetras(totalPagar),
                condicionOperacion: 1, // 1: Contado
                pagos: [{
                    codigo: '01', // Efectivo
                    montoPago: totalPagar,
                    referencia: null,
                    plazo: '01',
                    periodo: 1 // Corregido: Mínimo 1 según observación MH
                }],
                codIncoterms: this.mapIncotermCode(incoterms || 'FOB'), // Catálogo 031
                descIncoterms: this.mapIncotermDesc(incoterms || 'FOB'),
                flete: this.round(flete),
                seguro: this.round(seguro),
                numPagoElectronico: null,
                observaciones: (observaciones || 'Venta por Exportación').substring(0, 500)
            },
            apendice: [{
                campo: "Venta",
                etiqueta: "Tipo",
                valor: "Exportación"
            }]
        };

        // Limpieza técnica
        delete dteJson.identificacion.motivoContin;

        return {
            dteJson,
            codigoGeneracion,
            numeroControl: numeroControl,
            tipoDteCodigo: '11'
        };
    }

    buildReceptorFEX(cliente) {
        if (!cliente) return null;

        // Hacienda FEX v1 RECEPTOR: Estructura plana, sin objeto "direccion"
        // Campos requeridos: nombre, tipoDocumento, numDocumento, nombreComercial, codPais, nombrePais, complemento, tipoPersona, descActividad
        return {
            nombre: String(cliente.nombre || 'CLIENTE EXTRANJERO').substring(0, 250),
            tipoDocumento: cliente.nit ? '36' : '37',
            numDocumento: String(cliente.numeroDocumento || cliente.nit || 'EXTRANJERO').substring(0, 20),
            nombreComercial: String(cliente.nombreComercial || cliente.nombre || 'CLIENTE EXTRANJERO').substring(0, 150),
            codPais: '9300', // Código genérico para otros países (Catálogo 020)
            nombrePais: String(cliente.nombrePais || 'ESTADOS UNIDOS').substring(0, 50).padEnd(3, ' '), // minLength 3
            complemento: String(cliente.direccion || 'DIRECCION EXTRANJERO').substring(0, 300).padEnd(5, ' '), // minLength 5
            tipoPersona: cliente.nit ? 2 : 1, // 2: Jurídica, 1: Natural
            descActividad: String(cliente.descActividad || 'EXPORTACIÓN').substring(0, 150).padEnd(5, ' '), // minLength 5
            telefono: String(cliente.telefono || '00000000').substring(0, 50).padEnd(8, '0'), // minLength 8
            correo: cliente.correo || 'cliente@export.com'
        };
    }

    mapIncotermCode(code) {
        const map = {
            'EXW': '01', 'FCA': '02', 'CPT': '03', 'CIP': '04',
            'DAP': '05', 'DPU': '06', 'DDP': '07', 'FAS': '08',
            'FOB': '09', 'CFR': '10', 'CIF': '11'
        };
        return map[code] || '09'; // Default FOB
    }

    mapIncotermDesc(code) {
        const map = {
            'EXW': 'En Fábrica',
            'FCA': 'Franco en el Medio de Transporte',
            'CPT': 'Porte Pagado Hasta',
            'CIP': 'Porte y Seguro Pagados Hasta',
            'DAP': 'Entregada en Lugar',
            'DPU': 'Entregada en Lugar Descargada',
            'DDP': 'Entregada con Derechos Pagados',
            'FAS': 'Franco al Costado del Buque',
            'FOB': 'Franco a Bordo',
            'CFR': 'Costo y Flete',
            'CIF': 'Costo, Seguro y Flete'
        };
        return map[code] || 'Franco a Bordo';
    }
}

module.exports = FacturaExportacionGenerator;
