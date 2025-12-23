const BaseGenerator = require('./BaseGenerator');

class NotaRemisionGenerator extends BaseGenerator {
    generate(data) {
        const {
            empresaConfig,
            cliente,
            items,
            totales,
            retenciones = { renta: 0, iva: 0 },
            descuentoGlobal = 0,
            ambiente = 'PRUEBAS',
            numeroDocumento = 1,
            tipoModelo = 1,
            tipoOperacion = 1
        } = data;

        const codigoGeneracion = this.generateUUID();
        const fechaEmision = new Date();

        // Establishment Code Logic
        // Establishment Code Logic - Restoring alphanumeric support as per valid example (M001)
        // Ensure we use the config values if available, otherwise default.
        // The valid example uses M001 and P001. We should respect the empresaConfig if it has letters.

        let codigoEstablecimiento = String(empresaConfig.codigoMH || '0001').substring(0, 4);
        let puntoEmision = String(empresaConfig.codigoMH || '0001').substring(4, 8);

        // Pad if they are purely numeric and short? The example has M001 (4 chars). 
        // If our config is "M001P001", the substrings are correct.
        // If config is "1", pad? 
        if (codigoEstablecimiento.length < 4) codigoEstablecimiento = codigoEstablecimiento.padStart(4, '0');
        if (puntoEmision.length < 4) puntoEmision = puntoEmision.padStart(4, '0');

        // '04' is the code for Nota de Remisión
        const numeroControl = this.buildControlNumber('04', codigoEstablecimiento, puntoEmision, numeroDocumento);

        // Uses custom item builder for REM to satisfy schema (ivaItem required, tributos null)
        const cuerpoDocumento = this.buildItemsRemision(items);
        const totalsFromItems = this.calculateTotalsStandard(cuerpoDocumento);

        const subTotalVentas = this.round(totalsFromItems.totalVentaGravada + totalsFromItems.totalVentaExenta + totalsFromItems.totalVentaNoSujeta);
        const subTotal = this.round(subTotalVentas - totalsFromItems.totalDescuentos - descuentoGlobal);

        // Notes de Remisión typically don't have IVA in the same way as invoices, 
        // but if they follow standard tax rules we keep it. 
        // Checking documentation or standard practice, Remissions often value items at cost or price 
        // but final tax implication depends on if it's a sale or transfer.
        // Assuming standard calculation for now as requested.
        const iva = totalsFromItems.totalImpuestos;

        const montoTotalOperacion = this.round(subTotal - (retenciones.iva || 0) - (retenciones.renta || 0));
        const totalPagar = montoTotalOperacion;

        const finalTipoOperacion = (tipoModelo === 2) ? 2 : tipoOperacion;

        const dteJson = {
            identificacion: this.buildIdentificacion('04', numeroControl, codigoGeneracion, fechaEmision, ambiente, 3, tipoModelo, finalTipoOperacion),
            documentoRelacionado: null,
            // otrosDocumentos: removed for V3
            emisor: this.buildEmisor(empresaConfig, codigoEstablecimiento, puntoEmision),
            receptor: this.buildReceptor(cliente, '04'),
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
                tributos: [], // Empty array for V3 REM
                subTotal: subTotal,
                montoTotalOperacion: montoTotalOperacion,
                totalLetras: this.numeroALetras(totalPagar)
            },
            extension: null,
            apendice: null
        };

        // Manual Patches for V3 strictness (fixing check_diff issues)
        // Ensure emisor has MH codes duplicates as per sample
        if (dteJson.emisor) {
            dteJson.emisor.codEstableMH = codigoEstablecimiento;
            dteJson.emisor.codPuntoVentaMH = puntoEmision;
        }

        return {
            dteJson,
            codigoGeneracion,
            numeroControl,
            tipoDteCodigo: '04'
        };
    }

    buildItemsRemision(items) {
        return items.map((item, index) => {
            const cantidad = parseFloat(item.cantidad || 0);
            const precioUnitario = parseFloat(item.precioUni || item.precio || item.precioUnitario || 0);
            const descuento = parseFloat(item.descuento || item.montoDescu || 0);
            const subtotal = cantidad * precioUnitario;

            // V3 Logic: Match the example. Use Exenta or NoSuj logic.
            // Example uses: ventaExenta: 5.0, ventaGravada: 0, tributos: null.
            // We will mimic this behavior.

            let ventaGravada = 0;
            let ventaExenta = 0;
            let ventaNoSujeta = 0;

            if (item.tipoVenta === 'Gravada') {
                // Remissions are usually transfers. Map Gravada to Exenta by default to match example
                // unless explicitly handling tax downstream which isn't standard for REM.
                ventaExenta = subtotal;
            } else if (item.tipoVenta === 'Exenta') {
                ventaExenta = subtotal;
            } else if (item.tipoVenta === 'No Sujeta') {
                ventaNoSujeta = subtotal;
            } else {
                // Fallback
                ventaExenta = subtotal;
            }

            let unidadMedida = 59;
            if (item.uniMedida) {
                unidadMedida = parseInt(item.uniMedida);
            } else {
                unidadMedida = this.mapUnidadMedida(item.unidad || 'UNI');
            }

            return {
                numItem: index + 1,
                tipoItem: 1,
                numeroDocumento: null,
                codigo: item.codigo || null,
                codTributo: null,
                descripcion: item.descripcion || item.producto || '',
                cantidad: parseFloat(cantidad.toFixed(4)),
                uniMedida: unidadMedida,
                precioUni: parseFloat(precioUnitario.toFixed(6)),
                montoDescu: parseFloat(descuento.toFixed(2)),
                // Matches valid JSON structure
                ventaNoSuj: this.round(ventaNoSujeta),
                ventaExenta: this.round(ventaExenta),
                ventaGravada: this.round(ventaGravada),
                tributos: null
            };
        });
    }

    buildReceptor(cliente, tipoDte) {
        // Call base buildReceptor
        const receptor = super.buildReceptor(cliente, tipoDte);

        if (receptor) {
            // V3 Required Field: bienTitulo
            // 01=Deposito, 02=Propiedad, 03=Consignacion, 04=Traslado, 05=Otros
            receptor.bienTitulo = '04';

            // Fix missing strings or nulls
            if (!receptor.nombreComercial) receptor.nombreComercial = receptor.nombre;

            // Ensure strings for strict types (handle nulls by defaulting)
            receptor.nrc = receptor.nrc ? String(receptor.nrc) : "Sin NRC";
            receptor.codActividad = receptor.codActividad ? String(receptor.codActividad) : "10005"; // Default activity
            receptor.descActividad = receptor.descActividad ? String(receptor.descActividad) : "Otras actividades";

            if (receptor.telefono) receptor.telefono = String(receptor.telefono);
        }

        return receptor;
    }
}

module.exports = NotaRemisionGenerator;
