import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotaRemisionClienteComponent } from '../../components/nota-remision/nota-remision-cliente.component';
import { NotaRemisionSucursalComponent } from '../../components/nota-remision/nota-remision-sucursal.component';
import { NotaRemisionRetencionesComponent } from '../../components/nota-remision/nota-remision-retenciones.component';
import { NotaRemisionDescuentosComponent } from '../../components/nota-remision/nota-remision-descuentos.component';
import { NotaRemisionResponsablesComponent } from '../../components/nota-remision/nota-remision-responsables.component';
import { NotaRemisionOtrosComponent } from '../../components/nota-remision/nota-remision-otros.component';
import { NotaRemisionAppendicesComponent } from '../../components/nota-remision/nota-remision-appendices.component';
import { NotaRemisionItemsComponent } from '../../components/nota-remision/nota-remision-items.component';

@Component({
  selector: 'app-nota-remision-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NotaRemisionClienteComponent,
    NotaRemisionSucursalComponent,
    NotaRemisionRetencionesComponent,
    NotaRemisionDescuentosComponent,
    NotaRemisionResponsablesComponent,
    NotaRemisionOtrosComponent,
    NotaRemisionAppendicesComponent,
    NotaRemisionItemsComponent
  ],
  templateUrl: './nota-remision-page.component.html',
  styleUrl: './nota-remision-page.component.scss'
})
export class NotaRemisionPageComponent {
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
