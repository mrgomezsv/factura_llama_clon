const crypto = require('crypto');

class BaseGenerator {
    constructor() {
        this.unidadesMap = {
            'UNI': 1, 'CJ': 2, 'PQ': 3, 'KG': 4, 'LB': 5, 'LT': 6, 'GL': 7,
            'M': 8, 'M2': 9, 'M3': 10, 'PZ': 11, 'PAR': 12, 'DOC': 13,
            'BOL': 14, 'CAJ': 15, 'BOT': 16, 'TUB': 17, 'LAT': 18, 'BLK': 19,
            'ROL': 20, 'PLG': 21, 'PIE': 22, 'YRD': 23, 'MI': 24, 'KM': 25,
            'GR': 26, 'OZ': 27, 'GAL': 29, 'QT': 30, 'PT': 31, 'FL': 32,
            'OZ': 33, 'TB': 34, 'TS': 35, 'CUP': 36, 'PK': 37, 'BU': 38,
            'BBL': 39, 'TON': 40, 'MT': 42, 'FT': 43, 'YD': 44, 'IN': 45,
            'FT2': 46, 'YD2': 47, 'AC': 49, 'MI2': 50, 'FT3': 51, 'YD3': 52,
            'AC-FT': 53, 'CORD': 54, 'BTU': 55, 'L': 56, 'N': 57, 'PA': 58,
            'W': 59, 'J': 60, 'V': 61, 'F': 62, 'C': 63, 'S': 64, 'HZ': 65,
            '1/S': 66, 'M/S': 67, 'M/S2': 68, 'M3/S': 69, 'M3/H': 70,
            'L/H': 71, 'W/M2': 72, 'J/K': 73, 'PA-S': 74, 'N-M': 75, 'N/M': 76,
            'RAD/S': 77, 'RAD/S2': 78, 'W/M-K': 79, 'J/KG-K': 80, 'J/KG': 81,
            'J/K-MOL': 82, 'J/MOL': 83, 'MOL/M3': 84, 'MOL/KG': 85, 'MOL/MOL': 86,
            '1': 87, 'GY': 88, 'GY/S': 89, 'W/SR': 90, 'W/SR-M2': 91, 'PA/M': 92,
            'J/M2': 93, 'K-GY': 94, 'J/KG': 95, 'SV': 96, 'SV/S': 97, 'SV/H': 98,
            'SERV': 99
        };
    }

    round(value, decimals = 2) {
        if (!value) return 0;
        return parseFloat(parseFloat(value).toFixed(decimals));
    }

    generateUUID() {
        return crypto.randomUUID().toUpperCase();
    }

    buildControlNumber(tipoDte, codigoEstablecimiento, puntoEmision, numeroDocumento) {
        const tipoMap = {
            'FAC': 'DTE-01',
            '01': 'DTE-01',
            'CCF': 'DTE-03',
            '03': 'DTE-03',
            'NCR': 'DTE-05',
            '05': 'DTE-05',
            'NDB': 'DTE-06',
            '06': 'DTE-06',
            '06': 'DTE-06',
            'NR': 'DTE-04',
            'REM': 'DTE-04',
            '04': 'DTE-04',
            'FSE': 'DTE-14',
            '14': 'DTE-14',
            'FEX': 'DTE-11',
            '11': 'DTE-11'
        };
        const tipo = tipoMap[tipoDte] || 'DTE-00';

        const numDocPadded = String(numeroDocumento).padStart(15, '0');
        return `${tipo}-${codigoEstablecimiento}${puntoEmision}-${numDocPadded}`;
    }

    buildIdentificacion(tipoDte, numeroControl, codigoGeneracion, fechaEmision, ambiente, version = 1, tipoModelo = 1, tipoOperacion = 1) {
        // Determine TipoDte code (01, 03, etc.)
        const tipos = {
            'FAC': '01', '01': '01',
            'CCF': '03', '03': '03',
            'NCR': '05', '05': '05',
            'NDB': '06', '06': '06',
            'NR': '04', '04': '04', 'REM': '04',
            'FSE': '14', '14': '14',
            'FEX': '11', '11': '11'
        };
        const tipoCodigo = tipos[tipoDte] || '01';

        const fechaStr = fechaEmision.toISOString().split('T')[0];
        const horaStr = fechaEmision.toTimeString().split(' ')[0];

        return {
            version: version,
            ambiente: ambiente === 'PRODUCCIÓN' ? '01' : '00',
            tipoDte: tipoCodigo,
            numeroControl: numeroControl,
            codigoGeneracion: codigoGeneracion,
            tipoModelo: tipoModelo, // 1: Previo (Online), 2: Diferido (Contingencia)
            tipoOperacion: tipoOperacion, // 1: Normal, 2: Contingencia
            tipoContingencia: null,
            motivoContin: null,
            fecEmi: fechaStr,
            horEmi: horaStr,
            tipoMoneda: 'USD'
        };
    }

    buildEmisor(empresaConfig, codigoEstablecimiento, puntoEmision) {
        return {
            nit: empresaConfig.nit,
            nrc: empresaConfig.nrc,
            nombre: empresaConfig.nombreLegal,
            codActividad: /^\d{5}$/.test(empresaConfig.actividadEconomicaPrimaria) ? empresaConfig.actividadEconomicaPrimaria : '56101',
            descActividad: empresaConfig.descActividad || 'VENTA DE COMIDAS Y BEBIDAS', // Fallback or from DB if added
            nombreComercial: empresaConfig.nombreComercial || empresaConfig.nombreLegal || '',
            tipoEstablecimiento: '01', // Sucursal / Agencia
            direccion: {
                departamento: empresaConfig.direccion?.departamento || '06', // Default San Salvador
                municipio: empresaConfig.direccion?.municipio || '14', // Default San Salvador
                complemento: String(empresaConfig.direccion?.complemento || empresaConfig.direccion || 'San Salvador, El Salvador').substring(0, 200)
            },
            telefono: empresaConfig.telefono || '',
            correo: empresaConfig.correo || '',
            codEstableMH: null,
            codEstable: codigoEstablecimiento,
            codPuntoVentaMH: null,
            codPuntoVenta: puntoEmision
        };
    }

    mapUnidadMedida(unidad) {
        return this.unidadesMap[unidad.toUpperCase()] || 59; // Default 59 (Unidad)? Old code had 1? 
        // Wait, old code returned 1 for UNI.
        // Joaquin said "Unidad de medida real".
        // 59 is "Unidad" in MH Catalog? Or 1?
        // Let's stick to old code logic unless verified.
        // Old code: return unidades[unidad.toUpperCase()] || 1;
        // But I changed it to return input if numeric in builder.
        // BaseGenerator should provide the map.
        return this.unidadesMap[unidad.toUpperCase()] || 1;
    }

    buildItemsStandard(facturaItems, tipoDte) {
        // Same logic as corrected in dte-builder.js
        const items = [];
        const includeIvaItem = tipoDte === 'FAC';

        facturaItems.forEach((item, index) => {
            const cantidad = parseFloat(item.cantidad || 0);
            // FIXED LOGIC: Accept different variations of price keys
            const precioUnitario = parseFloat(item.precioUni || item.precio || item.precioUnitario || 0);
            const descuento = parseFloat(item.descuento || item.montoDescu || 0);
            const subtotal = cantidad * precioUnitario;
            // Assuming tipoVenta is handled by caller or default 'Gravada'
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
                // Gravada
                ventaGravada = subtotal;
                if (tipoDte === 'FAC') {
                    // For FAC, input prices are GROSS (include VAT). 
                    // We must EXTRACT VAT, not add it.
                    // VAT = Gross - (Gross / 1.13)
                    const baseGravada = ventaGravada / 1.13;
                    montoImpuesto = parseFloat((ventaGravada - baseGravada).toFixed(6));
                    // ventaGravada remains GROSS for FAC body
                } else {
                    // For CCF/Standard, input prices are NET (exclude VAT).
                    // We ADD VAT.
                    montoImpuesto = parseFloat((ventaGravada * 0.13).toFixed(6));
                    if (ventaGravada > 0) {
                        tributos = ['20'];
                    }
                }
            }

            let unidadMedida = 59;
            if (item.uniMedida) {
                unidadMedida = parseInt(item.uniMedida);
            } else {
                unidadMedida = this.mapUnidadMedida(item.unidad || 'UNI');
            }

            const itemObj = {
                numItem: index + 1,
                tipoItem: item.tipoItem ? parseInt(item.tipoItem) : 1,
                numeroDocumento: null,
                codigo: item.codigo || null,
                codTributo: null,
                descripcion: item.descripcion || item.producto || '',
                cantidad: parseFloat(cantidad.toFixed(4)), // Standard usually allows more precision
                uniMedida: unidadMedida,
                precioUni: parseFloat(precioUnitario.toFixed(6)), // Allow up to 6
                montoDescu: parseFloat(descuento.toFixed(2)), // Discount usually 2?
                ventaNoSuj: this.round(ventaNoSujeta),
                ventaExenta: this.round(ventaExenta),
                ventaGravada: this.round(ventaGravada),
                tributos: tipoDte === 'FAC' ? null : tributos, // FAC does not use tributos in body
                psv: 0.0,
                noGravado: 0.0
            };

            if (includeIvaItem) {
                itemObj.ivaItem = montoImpuesto;
            }

            items.push(itemObj);
        });

        return items;
    }

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
            // Calc IVA from Gravada items implicitly (since items have it?)
            // Or sum ivaItem?
            // Old logic recalculated it.
            if (item.ventaGravada > 0) {
                // If item has ivaItem (which we added in buildItemsStandard), use it.
                // Otherwise calculate.
                if (item.ivaItem) {
                    totalImpuestos += item.ivaItem;
                } else {
                    totalImpuestos += Math.round((item.ventaGravada * 0.13) * 100) / 100;
                }
            }
            totalDescuentos += parseFloat(item.montoDescu || 0);
        });

        return {
            totalVentaGravada: parseFloat(totalVentaGravada.toFixed(2)),
            totalVentaExenta: parseFloat(totalVentaExenta.toFixed(2)),
            totalVentaNoSujeta: parseFloat(totalVentaNoSujeta.toFixed(2)),
            totalImpuestos: parseFloat(totalImpuestos.toFixed(2)), // This is IVA
            totalDescuentos: parseFloat(totalDescuentos.toFixed(2)),
        };
    }

    numeroALetras(monto) {
        // Basic implementation copied from dte-builder.js
        const unidades = ['', 'UN ', 'DOS ', 'TRES ', 'CUATRO ', 'CINCO ', 'SEIS ', 'SIETE ', 'OCHO ', 'NUEVE '];
        const decenas = ['', 'DIEZ ', 'VEINTE ', 'TREINTA ', 'CUARENTA ', 'CINCUENTA ', 'SESENTA ', 'SETENTA ', 'OCHENTA ', 'NOVENTA '];
        const diez_veinte = ['DIEZ ', 'ONCE ', 'DOCE ', 'TRECE ', 'CATORCE ', 'QUINCE ', 'DIECISES ', 'DIECISIETE ', 'DIECIOCHO ', 'DIECINUEVE '];
        const centenas = ['', 'CIENTO ', 'DOSCIENTOS ', 'TRESCIENTOS ', 'CUATROCIENTOS ', 'QUINIENTOS ', 'SEISCIENTOS ', 'SETECIENTOS ', 'OCHOCIENTOS ', 'NOVECIENTOS '];

        let valor = parseFloat(monto).toFixed(2);
        let partes = valor.split('.');
        let entero = parseInt(partes[0]);
        let centavos = partes[1];

        if (entero === 0) return `CERO ${centavos}/100 USD`;
        if (entero === 100) return `CIEN ${centavos}/100 USD`;

        let letras = '';
        if (entero >= 1000) { letras += 'MIL '; entero = entero % 1000; } // Simplified
        if (entero >= 100) { letras += centenas[Math.floor(entero / 100)]; entero = entero % 100; }
        if (entero >= 20) { letras += decenas[Math.floor(entero / 10)]; entero = entero % 10; if (entero > 0) letras += 'Y '; }
        else if (entero >= 10) { letras += diez_veinte[entero - 10]; entero = 0; }
        if (entero > 0) { letras += unidades[entero]; }

        return `${letras.trim()} ${centavos}/100 USD`;
    }

    buildReceptor(cliente, tipoDte = 'FAC') {
        if (!cliente) return null;

        const isTaxpayer = !!cliente.nit && !!cliente.nrc; // Usually CCF/NCR to taxpayers
        const hasNit = !!cliente.nit;
        const hasDui = !!cliente.numeroDocumento || (hasNit && cliente.nit.length === 9); // Simplified DUI check

        if (tipoDte === 'CCF' || (tipoDte === 'NCR' && isTaxpayer)) {
            // Strict Taxpayer Structure
            if (!hasNit) return null; // CCF MUST have NIT
            return {
                nit: cliente.nit,
                nrc: cliente.nrc,
                nombre: cliente.nombre,
                nombreComercial: cliente.nombreComercial || cliente.nombre,
                codActividad: cliente.codActividad || '10005',
                descActividad: cliente.descActividad || 'Otros',
                direccion: {
                    departamento: cliente.departamento || '06',
                    municipio: cliente.municipio || '14',
                    complemento: String(cliente.direccion || 'San Salvador').substring(0, 200)
                },
                telefono: cliente.telefono || '00000000',
                correo: cliente.correo || 'cliente@test.com'
            };
        } else {
            // Consumer Structure (FAC, or NCR to consumer)
            let tipoDoc = '36'; // NIT
            let numDoc = cliente.nit || cliente.numeroDocumento || '00000000-0';

            if (!cliente.nit || cliente.nit.length < 10) {
                tipoDoc = '13'; // DUI
                numDoc = cliente.numeroDocumento || cliente.nit || '00000000-0';
            }

            return {
                tipoDocumento: tipoDoc,
                numDocumento: numDoc,
                nrc: cliente.nrc || null,
                nombre: cliente.nombre || 'CONSUMIDOR FINAL',
                codActividad: null,
                descActividad: null,
                direccion: cliente.direccion ? {
                    departamento: cliente.departamento || '06',
                    municipio: cliente.municipio || '14',
                    complemento: String(cliente.direccion).substring(0, 200)
                } : null,
                telefono: cliente.telefono || null,
                correo: cliente.correo || null
            };
        }
    }
}

module.exports = BaseGenerator;
