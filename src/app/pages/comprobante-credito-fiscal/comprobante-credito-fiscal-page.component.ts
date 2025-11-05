import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ComprobanteCreditoFiscalClienteComponent } from '../../components/comprobante-credito-fiscal/comprobante-credito-fiscal-cliente.component';
import { ComprobanteCreditoFiscalSucursalComponent } from '../../components/comprobante-credito-fiscal/comprobante-credito-fiscal-sucursal.component';
import { ComprobanteCreditoFiscalRetencionesComponent } from '../../components/comprobante-credito-fiscal/comprobante-credito-fiscal-retenciones.component';
import { ComprobanteCreditoFiscalDescuentosComponent } from '../../components/comprobante-credito-fiscal/comprobante-credito-fiscal-descuentos.component';
import { ComprobanteCreditoFiscalResponsablesComponent } from '../../components/comprobante-credito-fiscal/comprobante-credito-fiscal-responsables.component';
import { ComprobanteCreditoFiscalOtrosComponent } from '../../components/comprobante-credito-fiscal/comprobante-credito-fiscal-otros.component';
import { ComprobanteCreditoFiscalAppendicesComponent } from '../../components/comprobante-credito-fiscal/comprobante-credito-fiscal-appendices.component';
import { ComprobanteCreditoFiscalItemsComponent } from '../../components/comprobante-credito-fiscal/comprobante-credito-fiscal-items.component';

@Component({
  selector: 'app-comprobante-credito-fiscal-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ComprobanteCreditoFiscalClienteComponent,
    ComprobanteCreditoFiscalSucursalComponent,
    ComprobanteCreditoFiscalRetencionesComponent,
    ComprobanteCreditoFiscalDescuentosComponent,
    ComprobanteCreditoFiscalResponsablesComponent,
    ComprobanteCreditoFiscalOtrosComponent,
    ComprobanteCreditoFiscalAppendicesComponent,
    ComprobanteCreditoFiscalItemsComponent
  ],
  templateUrl: './comprobante-credito-fiscal-page.component.html',
  styleUrl: './comprobante-credito-fiscal-page.component.scss'
})
export class ComprobanteCreditoFiscalPageComponent {
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

