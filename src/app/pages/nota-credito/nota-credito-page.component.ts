import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotaCreditoClienteComponent } from '../../components/nota-credito/nota-credito-cliente.component';
import { NotaCreditoSucursalComponent } from '../../components/nota-credito/nota-credito-sucursal.component';
import { NotaCreditoRetencionesComponent } from '../../components/nota-credito/nota-credito-retenciones.component';
import { NotaCreditoDescuentosComponent } from '../../components/nota-credito/nota-credito-descuentos.component';
import { NotaCreditoResponsablesComponent } from '../../components/nota-credito/nota-credito-responsables.component';
import { NotaCreditoOtrosComponent } from '../../components/nota-credito/nota-credito-otros.component';
import { NotaCreditoAppendicesComponent } from '../../components/nota-credito/nota-credito-appendices.component';
import { NotaCreditoItemsComponent } from '../../components/nota-credito/nota-credito-items.component';

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
