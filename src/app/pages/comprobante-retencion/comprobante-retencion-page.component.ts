import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComprobanteRetencionClienteComponent } from '../../components/comprobante-retencion/cliente/cliente.component';
import { ComprobanteRetencionSucursalComponent } from '../../components/comprobante-retencion/sucursal/sucursal.component';
import { ComprobanteRetencionRetencionesComponent } from '../../components/comprobante-retencion/retenciones/retenciones.component';
import { ComprobanteRetencionDescuentosComponent } from '../../components/comprobante-retencion/descuentos/descuentos.component';
import { ComprobanteRetencionResponsablesComponent } from '../../components/comprobante-retencion/responsables/responsables.component';
import { ComprobanteRetencionOtrosComponent } from '../../components/comprobante-retencion/otros/otros.component';
import { ComprobanteRetencionAppendicesComponent } from '../../components/comprobante-retencion/appendices/appendices.component';
import { ComprobanteRetencionItemsComponent } from '../../components/comprobante-retencion/items/items.component';

@Component({
  selector: 'app-comprobante-retencion-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ComprobanteRetencionClienteComponent,
    ComprobanteRetencionSucursalComponent,
    ComprobanteRetencionRetencionesComponent,
    ComprobanteRetencionDescuentosComponent,
    ComprobanteRetencionResponsablesComponent,
    ComprobanteRetencionOtrosComponent,
    ComprobanteRetencionAppendicesComponent,
    ComprobanteRetencionItemsComponent
  ],
  templateUrl: './comprobante-retencion-page.component.html',
  styleUrl: './comprobante-retencion-page.component.scss'
})
export class ComprobanteRetencionPageComponent {
  cliente: any = {};
  items: Array<{ cantidad: number; precio: number; descuento: number }> = [];
  descuentoGlobal = 0;
  retenciones = { renta: 0, iva: 0 };
  ambienteProduccion = true;
  enviarCorreo = true;
  vistaPrevia = true;
  constructor(private router: Router) {}

  onCliente(v: any) { this.cliente = v; }
  onDescuento(v: number) { this.descuentoGlobal = v || 0; }
  onRetenciones(v: { renta: number; iva: number }) { this.retenciones = v; }
  onItems(items: any[]) { this.items = items || []; }

  get sumaGravadas(): number {
    const sum = this.items.reduce((acc, it) => acc + (Number(it.precio||0) - Number(it.descuento||0)) * Number(it.cantidad||0), 0);
    return Math.max(sum - Number(this.descuentoGlobal||0), 0);
  }

  get subTotal(): number { return this.sumaGravadas; }

  get totalPagar(): number {
    return Math.max(this.subTotal - (this.retenciones.iva + this.retenciones.renta), 0);
  }

  cerrar(): void {
    this.router.navigateByUrl('/dtes');
  }
}
