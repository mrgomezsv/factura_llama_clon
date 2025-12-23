const BaseGenerator = require('./BaseGenerator');

class ComprobanteRetencionGenerator extends BaseGenerator {
    constructor() {
        super();
    }

    generate(data) {
        const { empresaConfig, cliente, items, ambiente, numeroDocumento, tipoModelo = 1, tipoOperacion = 1 } = data;

        const codigoGeneracion = this.generateUUID();
        // Calculate establishment codes (fallback to 0001 if missing)
        let rawCodEst = empresaConfig.codigoMH?.substring(0, 4) || '0001';
        if (rawCodEst.startsWith('5') || rawCodEst.length < 1) rawCodEst = '0001';
        const codigoEstablecimiento = String(rawCodEst).padStart(4, '0');
        const puntoVenta = String(empresaConfig.codigoMH?.substring(4, 8) || '0001').padStart(4, '0');

        const numeroControl = this.buildControlNumber('07', codigoEstablecimiento, puntoVenta, numeroDocumento);

        // CR (07) Version is 1 (DTE-07 uses version 1, not 3)
        // Si es contingencia, tipoOperacion suele ser 2 (Contingencia)
        // Usar siempre la fecha actual del momento de generación para evitar errores de fecha
        const finalTipoOperacion = (tipoModelo === 2) ? 2 : tipoOperacion;
        const fechaActual = new Date(); // Fecha actual del momento de generación
        const identificacion = this.buildIdentificacion('07', numeroControl, codigoGeneracion, fechaActual, ambiente, 1, tipoModelo, finalTipoOperacion);
        const emisor = this.buildEmisorCR(empresaConfig, codigoEstablecimiento, puntoVenta);

        // CR Receptor must be Taxpayer style (Nit, Nrc, Actividad)
        const receptor = this.buildReceptorCR(cliente);

        const cuerpoDocumento = this.buildCuerpoDocumento(data.items);
        const resumen = this.buildResumen(cuerpoDocumento);

        // Extension is required fields with minLengths
        const extension = {
            nombEntrega: String(empresaConfig.nombreLegal || empresaConfig.nombreComercial || 'EMPLEADO DE VENTA').substring(0, 100).padEnd(5, ' '),
            docuEntrega: String(empresaConfig.nit || '0000-000000-000-0').substring(0, 25).padEnd(5, ' '),
            nombRecibe: String(cliente?.nombre || 'RECEPTOR DE DOCUMENTO').substring(0, 100).padEnd(5, ' '),
            docuRecibe: String(cliente?.nit || cliente?.numeroDocumento || '0000-000000-000-0').substring(0, 25).padEnd(5, ' '),
            observaciones: String(data.observaciones || 'Emitido desde WavePos').substring(0, 3000)
        };

        const dteJson = {
            identificacion,
            emisor,
            receptor,
            cuerpoDocumento,
            resumen,
            extension,
            apendice: null
        };

        return {
            dteJson,
            codigoGeneracion,
            numeroControl,
            tipoDteCodigo: '07'
        };
    }

    buildCuerpoDocumento(items) {
        if (!items || !Array.isArray(items)) return [];

        return items.map((item, index) => {
            const montoSujeto = parseFloat(item.montoSujetoGrav || item.montoSujeto || 0);
            let retencion = parseFloat(item.ivaRetenido || item.retencion || 0);
            const tipoDoc = parseInt(item.tipoGeneracion || 1);
            const codigoRetencion = item.codigoRetencion || '22';

            // Si no se proporciona retención, calcularla según el código de retención
            // Código 22 = Retención IVA (1% del monto sujeto a retención)
            // Código C4 = Retención Renta (1% del monto sujeto)
            // Código C9 = Retención Renta (1% del monto sujeto)
            // IMPORTANTE: El cálculo debe ser exacto y validado por MH
            if (retencion === 0 && montoSujeto > 0) {
                if (codigoRetencion === '22') {
                    // 1% del monto sujeto para retención IVA (código 22)
                    retencion = Math.round(montoSujeto * 0.01 * 100) / 100;
                } else if (codigoRetencion === 'C4' || codigoRetencion === 'C9') {
                    // 1% para otros tipos de retención
                    retencion = Math.round(montoSujeto * 0.01 * 100) / 100;
                }
            } else if (retencion > 0 && montoSujeto > 0) {
                // Validar que el cálculo proporcionado sea correcto
                let esperado = 0;
                if (codigoRetencion === '22') {
                    // 1% del monto sujeto para retención IVA (código 22)
                    esperado = Math.round(montoSujeto * 0.01 * 100) / 100;
                } else if (codigoRetencion === 'C4' || codigoRetencion === 'C9') {
                    // 1% para otros tipos de retención
                    esperado = Math.round(montoSujeto * 0.01 * 100) / 100;
                }
                // Si hay diferencia, usar el cálculo correcto
                if (Math.abs(retencion - esperado) > 0.01) {
                    retencion = esperado;
                }
            }

            // Según esquema: cuando tipoDoc === 1, NO debe tener codGeneracion
            // cuando tipoDoc === 2, codGeneracion es requerido con formato UUID
            const itemObj = {
                numItem: index + 1,
                tipoDte: item.tipoDteRelacionado || '03',
                tipoDoc: tipoDoc,
                numDocumento: item.numDocumento || item.numeroDocumento || '',
                fechaEmision: item.fechaEmision || new Date().toISOString().split('T')[0],
                montoSujetoGrav: this.round(montoSujeto, 2), // Usar método round del BaseGenerator
                codigoRetencionMH: codigoRetencion,
                ivaRetenido: this.round(retencion, 2), // Usar método round para precisión
                descripcion: (item.descripcion || 'Retención sobre documento').substring(0, 1000)
            };
            
            // codGeneracion solo se incluye si tipoDoc === 2 (Diferido)
            if (tipoDoc === 2) {
                itemObj.codGeneracion = item.codGeneracion || item.codigoGeneracion || null;
            }
            // Si tipoDoc === 1, NO incluir codGeneracion (según esquema)
            
            return itemObj;
        });
    }

    buildResumen(cuerpoDocumento) {
        let totalSujeto = 0;
        let totalRetenido = 0;

        cuerpoDocumento.forEach(item => {
            totalSujeto += item.montoSujetoGrav;
            totalRetenido += item.ivaRetenido;
        });

        return {
            totalSujetoRetencion: parseFloat(totalSujeto.toFixed(2)),
            totalIVAretenido: parseFloat(totalRetenido.toFixed(2)),
            totalIVAretenidoLetras: this.numeroALetras(totalRetenido).substring(0, 200)
        };
    }

    buildReceptorCR(cliente) {
        // Según el esquema JSON fe-cr-v1.json:
        // - numDocumento para tipoDocumento "36" (NIT) debe ser: "^([0-9]{14}|[0-9]{9})$" (SOLO números, sin guiones)
        // - nrc es REQUERIDO y debe ser: "^[0-9]{1,8}$"
        // - telefono pattern: "^[0-9+;]{8,30}$"
        // - correo es REQUERIDO
        
        // Helper para limpiar NIT: solo números, sin guiones
        const cleanNIT = (nit) => {
            if (!nit) return "00000000000000";
            // Extraer solo números
            const clean = nit.replace(/\D/g, '');
            if (clean.length === 14 || clean.length === 9) {
                return clean;
            }
            // Si tiene menos dígitos, rellenar con ceros a la izquierda hasta 14
            if (clean.length > 0 && clean.length < 14) {
                return clean.padStart(14, '0');
            }
            return "00000000000000";
        };

        // Helper para limpiar NRC: solo números
        const cleanNRC = (nrc) => {
            if (!nrc) return null;
            const clean = String(nrc).replace(/\D/g, '');
            return clean.length > 0 ? clean : null;
        };

        // Helper para limpiar teléfono
        const cleanTelefono = (tel) => {
            if (!tel) return "00000000";
            // Remover espacios, pero mantener números, + y ;
            const clean = String(tel).replace(/[^\d+;]/g, '');
            if (clean.length >= 8) return clean;
            return "00000000";
        };

        // Helper para convertir departamento/municipio a código numérico
        const getCodigoDepartamento = (dept) => {
            if (!dept) return "06";
            if (/^\d{2}$/.test(String(dept))) return String(dept).padStart(2, '0');
            const map = {
                'san salvador': '06', 'santa ana': '01', 'san miguel': '09',
                'la libertad': '05', 'ahuachapan': '02', 'cuscatlan': '03',
                'la paz': '05', 'cabañas': '08', 'chalatenango': '03',
                'morazan': '09', 'san vicente': '10', 'usulutan': '11',
                'la union': '12', 'sonsonate': '13'
            };
            return map[String(dept).toLowerCase()] || "06";
        };

        const getCodigoMunicipio = (mun, dept) => {
            if (!mun) return "14";
            if (/^\d{2}$/.test(String(mun))) return String(mun).padStart(2, '0');
            return "14";
        };

        if (!cliente) {
            return {
                tipoDocumento: "36",
                numDocumento: "00000000000000",
                nrc: "00000000",
                nombre: "CLIENTE GENERICO",
                codActividad: "10005",
                descActividad: "Otras actividades".padEnd(5, ' '),
                nombreComercial: "CLIENTE GENERICO",
                telefono: "00000000",
                correo: "cliente@example.com",
                direccion: {
                    departamento: "06",
                    municipio: "14",
                    complemento: "San Salvador".padEnd(5, ' ')
                }
            };
        }

        // CR Receptor: según esquema, numDocumento debe ser SOLO números (14 o 9 dígitos)
        const nitValue = cleanNIT(cliente.nit || cliente.numeroDocumento);
        const nrcValue = cleanNRC(cliente.nrc);
        
        if (!nrcValue) {
            throw new Error('NRC es requerido para Comprobante de Retención (DTE-07)');
        }

        return {
            tipoDocumento: "36", // NIT
            numDocumento: nitValue, // SOLO números, sin guiones
            nrc: nrcValue, // REQUERIDO, solo números
            nombre: String(cliente.nombre || "CLIENTE").substring(0, 250),
            codActividad: cliente.codActividad || "10005",
            descActividad: String(cliente.descActividad || "Otras actividades").substring(0, 150).padEnd(5, ' '),
            nombreComercial: cliente.nombreComercial ? String(cliente.nombreComercial).substring(0, 150) : String(cliente.nombre || "CLIENTE").substring(0, 150), // REQUERIDO
            telefono: cleanTelefono(cliente.telefono), // REQUERIDO, pattern: ^[0-9+;]{8,30}$
            correo: cliente.correo || cliente.email || "cliente@example.com", // REQUERIDO
            direccion: {
                departamento: getCodigoDepartamento(cliente.departamento),
                municipio: getCodigoMunicipio(cliente.municipio, cliente.departamento),
                complemento: String(cliente.direccion || "San Salvador, El Salvador").substring(0, 200).padEnd(5, ' ')
            }
        };
    }

    buildEmisorCR(empresaConfig, codigoEstablecimiento, puntoVenta) {
        // DTE-07 requiere formato específico del emisor
        // codigoMH y codigo deben ser solo el código de establecimiento (4 caracteres)
        // puntoVentaMH y puntoVenta deben ser el código de punto de venta (4 caracteres)
        const codigoMH = codigoEstablecimiento; // Solo establecimiento, no completo
        const codigo = codigoEstablecimiento; // Solo establecimiento
        
        return {
            nit: empresaConfig.nit,
            nrc: empresaConfig.nrc,
            nombre: empresaConfig.nombreLegal,
            codActividad: /^\d{5}$/.test(empresaConfig.actividadEconomicaPrimaria) ? empresaConfig.actividadEconomicaPrimaria : '56101',
            descActividad: empresaConfig.descActividad || 'VENTA DE COMIDAS Y BEBIDAS',
            nombreComercial: empresaConfig.nombreComercial || empresaConfig.nombreLegal || '',
            tipoEstablecimiento: '01',
            codigoMH: codigoMH, // Solo código de establecimiento (4 caracteres)
            codigo: codigo, // Solo código de establecimiento (4 caracteres)
            puntoVentaMH: puntoVenta, // Código de punto de venta (4 caracteres)
            puntoVenta: puntoVenta, // Código de punto de venta (4 caracteres)
            direccion: {
                departamento: empresaConfig.direccion?.departamento || '06',
                municipio: empresaConfig.direccion?.municipio || '14',
                complemento: String(empresaConfig.direccion?.complemento || empresaConfig.direccion || 'San Salvador, El Salvador').substring(0, 200)
            },
            telefono: empresaConfig.telefono || '',
            correo: empresaConfig.correo || ''
        };
    }
}

module.exports = ComprobanteRetencionGenerator;
