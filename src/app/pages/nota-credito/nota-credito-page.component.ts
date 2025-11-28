import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotaCreditoClienteComponent } from '../../components/nota-credito/cliente/cliente.component';
import { NotaCreditoSucursalComponent } from '../../components/nota-credito/sucursal/sucursal.component';
import { NotaCreditoRetencionesComponent } from '../../components/nota-credito/retenciones/retenciones.component';
import { NotaCreditoDescuentosComponent } from '../../components/nota-credito/descuentos/descuentos.component';
import { NotaCreditoResponsablesComponent } from '../../components/nota-credito/responsables/responsables.component';
import { NotaCreditoOtrosComponent } from '../../components/nota-credito/otros/otros.component';
import { NotaCreditoAppendicesComponent } from '../../components/nota-credito/appendices/appendices.component';
import { NotaCreditoItemsComponent } from '../../components/nota-credito/items/items.component';

/**
 * Tipos de venta según normativa de El Salvador
 */
type TipoVenta = 'Gravada' | 'Exenta' | 'No Sujeta' | 'No Gravada';

/**
 * Interfaz para items de nota de crédito
 */
interface ItemFactura {
  cantidad: number;
  precio: number;
  descuento: number;
  tipoVenta?: TipoVenta;
  descripcion?: string;
}

@Component({
  selector: 'app-nota-credito-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NotaCreditoClienteComponent,
    NotaCreditoSucursalComponent,
    NotaCreditoRetencionesComponent,
    NotaCreditoDescuentosComponent,
    NotaCreditoResponsablesComponent,
    NotaCreditoOtrosComponent,
    NotaCreditoAppendicesComponent,
    NotaCreditoItemsComponent
  ],
  templateUrl: './nota-credito-page.component.html',
  styleUrl: './nota-credito-page.component.scss'
})
export class NotaCreditoPageComponent {
  // Tasa de IVA en El Salvador (13%)
  readonly IVA_RATE = 0.13;

  cliente: any = {};
  items: ItemFactura[] = [];
  descuentoGlobal = 0;
  retenciones = { renta: 0, iva: 0 };
  otrosMontosNoAfectos = 0; // Otros montos que no afectan el cálculo
  ambienteProduccion = true;
  enviarCorreo = true;
  vistaPrevia = true;
  
  constructor(private router: Router) {}

  onCliente(v: any) { this.cliente = v; }
  onDescuento(v: number) { this.descuentoGlobal = v || 0; }
  onRetenciones(v: { renta: number; iva: number }) { this.retenciones = v; }
  onItems(items: any[]) { 
    this.items = (items || []).map(item => ({
      cantidad: Number(item.cantidad || 0),
      precio: Number(item.precio || 0),
      descuento: Number(item.descuento || 0),
      tipoVenta: item.tipoVenta || 'Gravada' as TipoVenta,
      descripcion: item.descripcion || item.producto || ''
    }));
  }

  /**
   * Calcula el subtotal de un item (cantidad * precio - descuento del item)
   */
  private calcularSubtotalItem(item: ItemFactura): number {
    const subtotalSinDescuento = item.cantidad * item.precio;
    const subtotalConDescuento = Math.max(subtotalSinDescuento - item.descuento, 0);
    return subtotalConDescuento;
  }

  /**
   * Suma de Ventas Gravadas (antes de descuento global)
   * Solo incluye items con tipoVenta = 'Gravada'
   */
  get sumaVentasGravadas(): number {
    return this.items
      .filter(item => item.tipoVenta === 'Gravada')
      .reduce((acc, item) => acc + this.calcularSubtotalItem(item), 0);
  }

  /**
   * Suma de Ventas Exentas
   * Incluye items con tipoVenta = 'Exenta'
   */
  get sumaVentasExentas(): number {
    return this.items
      .filter(item => item.tipoVenta === 'Exenta')
      .reduce((acc, item) => acc + this.calcularSubtotalItem(item), 0);
  }

  /**
   * Suma de Ventas No Sujetas
   * Incluye items con tipoVenta = 'No Sujeta'
   */
  get sumaVentasNoSujetas(): number {
    return this.items
      .filter(item => item.tipoVenta === 'No Sujeta')
      .reduce((acc, item) => acc + this.calcularSubtotalItem(item), 0);
  }

  /**
   * Sumatoria de Ventas (suma de todas las ventas antes de descuento global)
   */
  get sumatoriaVentas(): number {
    return this.items.reduce((acc, item) => acc + this.calcularSubtotalItem(item), 0);
  }

  /**
   * Descuento Global aplicado proporcionalmente a cada tipo de venta
   */
  private calcularDescuentoProporcional(montoVenta: number): number {
    if (this.sumatoriaVentas === 0) return 0;
    const proporcion = montoVenta / this.sumatoriaVentas;
    return this.descuentoGlobal * proporcion;
  }

  /**
   * Descuento Global aplicado a las ventas gravadas
   * Se aplica proporcionalmente según la participación de ventas gravadas en el total
   */
  get descuentoGlobalVentasGravadas(): number {
    return this.calcularDescuentoProporcional(this.sumaVentasGravadas);
  }

  /**
   * Ventas Gravadas Netas (después de aplicar descuento global proporcional)
   */
  get ventasGravadasNetas(): number {
    return Math.max(this.sumaVentasGravadas - this.descuentoGlobalVentasGravadas, 0);
  }

  /**
   * Ventas Exentas Netas (después de aplicar descuento global proporcional)
   */
  get ventasExentasNetas(): number {
    const descuentoExentas = this.calcularDescuentoProporcional(this.sumaVentasExentas);
    return Math.max(this.sumaVentasExentas - descuentoExentas, 0);
  }

  /**
   * Ventas No Sujetas Netas (después de aplicar descuento global proporcional)
   */
  get ventasNoSujetasNetas(): number {
    const descuentoNoSujetas = this.calcularDescuentoProporcional(this.sumaVentasNoSujetas);
    return Math.max(this.sumaVentasNoSujetas - descuentoNoSujetas, 0);
  }

  /**
   * Sub Total (Sumatoria de Ventas - Descuento Global)
   * Representa la base imponible antes de IVA
   */
  get subTotal(): number {
    return Math.max(this.sumatoriaVentas - this.descuentoGlobal, 0);
  }

  /**
   * IVA calculado sobre las ventas gravadas después del descuento global
   * Según normativa de El Salvador: IVA = 13% sobre ventas gravadas netas
   * Las ventas exentas, no sujetas y no gravadas no generan IVA
   */
  get iva(): number {
    // IVA del 13% sobre ventas gravadas netas (precio sin IVA)
    const ivaCalculado = this.ventasGravadasNetas * this.IVA_RATE;
    // Redondear a 2 decimales para evitar errores de precisión
    return Math.round(ivaCalculado * 100) / 100;
  }

  /**
   * IVA Retenido (ingresado manualmente en el componente de retenciones)
   */
  get ivaRetenido(): number {
    return Number(this.retenciones.iva || 0);
  }

  /**
   * Retención de Renta (ingresada manualmente en el componente de retenciones)
   */
  get retencionRenta(): number {
    return Number(this.retenciones.renta || 0);
  }

  /**
   * Monto Total de Operación
   * Suma de todas las ventas netas + IVA - Retenciones
   * Según normativa: (Ventas Gravadas Netas + IVA) + Ventas Exentas Netas + Ventas No Sujetas Netas - Retenciones
   */
  get montoTotalOperacion(): number {
    const totalVentasGravadasConIva = this.ventasGravadasNetas + this.iva;
    const totalVentasExentas = this.ventasExentasNetas;
    const totalVentasNoSujetas = this.ventasNoSujetasNetas;
    
    const totalAntesRetenciones = totalVentasGravadasConIva + totalVentasExentas + totalVentasNoSujetas;
    const totalRetenciones = this.ivaRetenido + this.retencionRenta;
    
    return Math.max(totalAntesRetenciones - totalRetenciones, 0);
  }

  /**
   * Total de Otros Montos No Afectos
   * Montos que no afectan el cálculo de IVA ni retenciones
   */
  get totalOtrosMontosNoAfectos(): number {
    return Number(this.otrosMontosNoAfectos || 0);
  }

  /**
   * Total a Pagar
   * Monto Total de Operación + Otros Montos No Afectos
   */
  get totalPagar(): number {
    return this.montoTotalOperacion + this.totalOtrosMontosNoAfectos;
  }

  /**
   * Para compatibilidad con el template existente
   * @deprecated Usar sumaVentasGravadas en su lugar
   */
  get sumaGravadas(): number {
    return this.sumaVentasGravadas;
  }

  cerrar(): void {
    this.router.navigateByUrl('/dtes');
  }
}
