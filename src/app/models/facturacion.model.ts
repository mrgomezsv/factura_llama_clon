/**
 * Tipos de venta según normativa de El Salvador
 */
export type TipoVenta = 'Gravada' | 'Exenta' | 'No Sujeta' | 'No Gravada';

/**
 * Interfaz para items de factura
 */
export interface ItemFactura {
  cantidad: number;
  precio: number;
  descuento: number;
  tipoVenta?: TipoVenta;
  descripcion?: string;
}

/**
 * Interfaz para retenciones
 */
export interface Retenciones {
  renta: number;
  iva: number;
}

/**
 * Parámetros para cálculos de facturación
 */
export interface ParametrosCalculoFacturacion {
  items: ItemFactura[];
  descuentoGlobal: number;
  retenciones: Retenciones;
  otrosMontosNoAfectos?: number;
}

/**
 * Resultados de cálculos de facturación
 */
export interface ResultadosCalculoFacturacion {
  sumaVentasGravadas: number;
  sumaVentasExentas: number;
  sumaVentasNoSujetas: number;
  sumatoriaVentas: number;
  descuentoGlobalVentasGravadas: number;
  ventasGravadasNetas: number;
  ventasExentasNetas: number;
  ventasNoSujetasNetas: number;
  subTotal: number;
  iva: number;
  ivaRetenido: number;
  retencionRenta: number;
  montoTotalOperacion: number;
  totalOtrosMontosNoAfectos: number;
  totalPagar: number;
  // Para compatibilidad
  sumaGravadas: number;
}

