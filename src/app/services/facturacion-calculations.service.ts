import { Injectable } from '@angular/core';
import { ItemFactura, TipoVenta, ParametrosCalculoFacturacion, ResultadosCalculoFacturacion } from '../models/facturacion.model';

/**
 * Servicio centralizado para cálculos de facturación según normativas de El Salvador
 */
@Injectable({
  providedIn: 'root'
})
export class FacturacionCalculationsService {
  // Tasa de IVA en El Salvador (13%)
  readonly IVA_RATE = 0.13;

  /**
   * Calcula el subtotal de un item (cantidad * precio - descuento del item)
   */
  private calcularSubtotalItem(item: ItemFactura): number {
    const subtotalSinDescuento = item.cantidad * item.precio;
    const subtotalConDescuento = Math.max(subtotalSinDescuento - item.descuento, 0);
    return subtotalConDescuento;
  }

  /**
   * Calcula la suma de ventas por tipo
   */
  private calcularSumaVentasPorTipo(items: ItemFactura[], tipoVenta: TipoVenta): number {
    return items
      .filter(item => item.tipoVenta === tipoVenta)
      .reduce((acc, item) => acc + this.calcularSubtotalItem(item), 0);
  }

  /**
   * Calcula el descuento global aplicado proporcionalmente a un monto de venta
   */
  private calcularDescuentoProporcional(
    montoVenta: number,
    sumatoriaVentas: number,
    descuentoGlobal: number
  ): number {
    if (sumatoriaVentas === 0) return 0;
    const proporcion = montoVenta / sumatoriaVentas;
    return descuentoGlobal * proporcion;
  }

  /**
   * Determinar si el tipo de DTE es exento de IVA
   */
  private isExemptDteType(tipoDte?: string): boolean {
    const exemptTypes = ['FEX', 'FSE'];
    return tipoDte ? exemptTypes.includes(tipoDte) : false;
  }

  /**
   * Determinar si el tipo de DTE no debe calcular IVA (Factura a Consumidor Final)
   * Las facturas FAC no desglosan IVA porque el precio ya lo incluye
   */
  private shouldNotCalculateIva(tipoDte?: string): boolean {
    return tipoDte === 'FAC';
  }

  /**
   * Calcula todos los valores de facturación según normativas de El Salvador
   */
  calcularFacturacion(parametros: ParametrosCalculoFacturacion): ResultadosCalculoFacturacion {
    const { items, descuentoGlobal, retenciones, otrosMontosNoAfectos = 0, tipoDte } = parametros;
    const isExemptDte = this.isExemptDteType(tipoDte);

    // Normalizar items
    const itemsNormalizados: ItemFactura[] = items.map(item => ({
      cantidad: Number(item.cantidad || 0),
      precio: Number(item.precio || 0),
      descuento: Number(item.descuento || 0),
      // Si el DTE es exento (FEX, FSE), todos los items son exentos
      tipoVenta: (isExemptDte ? 'Exenta' : (item.tipoVenta || 'Gravada')) as TipoVenta,
      descripcion: item.descripcion || ''
    }));

    // Calcular sumas por tipo de venta (antes de descuento global)
    const sumaVentasGravadas = this.calcularSumaVentasPorTipo(itemsNormalizados, 'Gravada');
    const sumaVentasExentas = this.calcularSumaVentasPorTipo(itemsNormalizados, 'Exenta');
    const sumaVentasNoSujetas = this.calcularSumaVentasPorTipo(itemsNormalizados, 'No Sujeta');

    // Sumatoria total de ventas
    const sumatoriaVentas = itemsNormalizados.reduce(
      (acc, item) => acc + this.calcularSubtotalItem(item),
      0
    );

    // Calcular descuentos proporcionales
    const descuentoGlobalVentasGravadas = this.calcularDescuentoProporcional(
      sumaVentasGravadas,
      sumatoriaVentas,
      descuentoGlobal
    );
    const descuentoExentas = this.calcularDescuentoProporcional(
      sumaVentasExentas,
      sumatoriaVentas,
      descuentoGlobal
    );
    const descuentoNoSujetas = this.calcularDescuentoProporcional(
      sumaVentasNoSujetas,
      sumatoriaVentas,
      descuentoGlobal
    );

    // Calcular ventas netas (después de descuento global)
    const ventasGravadasNetas = Math.max(sumaVentasGravadas - descuentoGlobalVentasGravadas, 0);
    const ventasExentasNetas = Math.max(sumaVentasExentas - descuentoExentas, 0);
    const ventasNoSujetasNetas = Math.max(sumaVentasNoSujetas - descuentoNoSujetas, 0);

    // Sub Total
    const subTotal = Math.max(sumatoriaVentas - descuentoGlobal, 0);

    // IVA (13% sobre ventas gravadas netas)
    // NO calcular IVA si:
    // - El tipo de DTE es exento (FEX, FSE)
    // - El tipo de DTE es FAC (Factura a Consumidor Final - el precio ya incluye IVA)
    const shouldNotCalculateIva = this.shouldNotCalculateIva(tipoDte);
    const ivaCalculado = (isExemptDte || shouldNotCalculateIva) ? 0 : ventasGravadasNetas * this.IVA_RATE;
    const iva = Math.round(ivaCalculado * 100) / 100;

    // Retenciones
    const ivaRetenido = Number(retenciones.iva || 0);
    const retencionRenta = Number(retenciones.renta || 0);

    // Monto Total de Operación
    const totalVentasGravadasConIva = ventasGravadasNetas + iva;
    const totalVentasExentas = ventasExentasNetas;
    const totalVentasNoSujetas = ventasNoSujetasNetas;
    
    const totalAntesRetenciones = totalVentasGravadasConIva + totalVentasExentas + totalVentasNoSujetas;
    const totalRetenciones = ivaRetenido + retencionRenta;
    
    const montoTotalOperacion = Math.max(totalAntesRetenciones - totalRetenciones, 0);

    // Otros montos no afectos
    const totalOtrosMontosNoAfectos = Number(otrosMontosNoAfectos || 0);

    // Total a Pagar
    const totalPagar = montoTotalOperacion + totalOtrosMontosNoAfectos;

    return {
      sumaVentasGravadas,
      sumaVentasExentas,
      sumaVentasNoSujetas,
      sumatoriaVentas,
      descuentoGlobalVentasGravadas,
      ventasGravadasNetas,
      ventasExentasNetas,
      ventasNoSujetasNetas,
      subTotal,
      iva,
      ivaRetenido,
      retencionRenta,
      montoTotalOperacion,
      totalOtrosMontosNoAfectos,
      totalPagar,
      // Para compatibilidad
      sumaGravadas: sumaVentasGravadas
    };
  }
}

