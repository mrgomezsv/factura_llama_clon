/**
 * Tipos de venta según normativa de El Salvador
 */
export type TipoVenta = 'Gravada' | 'Exenta' | 'No Sujeta' | 'No Gravada';

/**
 * Interfaz para items de factura
 */
export interface ItemFactura {
  numItem?: number;
  tipoItem?: number; // 1: Bienes, 2: Servicios
  cantidad: number;
  codigo?: string;
  uniMedida?: number | string;
  descripcion?: string;
  precio: number; // Para compatibilidad interna
  precioUni?: number; // FSE usa este
  descuento: number;
  montoDescu?: number; // FSE usa este
  compra?: number; // FSE usa este (cantidad * precioUni)
  tipoVenta?: TipoVenta;
  producto?: string; // Para compatibilidad interna
  unidad?: string; // Para compatibilidad interna
}

/**
 * Interfaz para formas de pago
 */
export interface Pago {
  codigo: string;
  montoPago: number;
  referencia: string | null;
  plazo: string | null;
  periodo: number | null;
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
  tipoDte?: string; // Tipo de DTE (FAC, CCF, FEX, FSE, etc.)
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
  // Para FSE
  totalCompra?: number;
  totalDescu?: number;
  sumatoriaDescuentosItems?: number;
  // Para compatibilidad
  sumaGravadas: number;
}
