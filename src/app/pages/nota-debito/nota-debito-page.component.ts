import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotaDebitoClienteComponent } from '../../components/nota-debito/nota-debito-cliente.component';
import { NotaDebitoSucursalComponent } from '../../components/nota-debito/nota-debito-sucursal.component';
import { NotaDebitoRetencionesComponent } from '../../components/nota-debito/nota-debito-retenciones.component';
import { NotaDebitoDescuentosComponent } from '../../components/nota-debito/nota-debito-descuentos.component';
import { NotaDebitoResponsablesComponent } from '../../components/nota-debito/nota-debito-responsables.component';
import { NotaDebitoOtrosComponent } from '../../components/nota-debito/nota-debito-otros.component';
import { NotaDebitoAppendicesComponent } from '../../components/nota-debito/nota-debito-appendices.component';
import { NotaDebitoItemsComponent } from '../../components/nota-debito/nota-debito-items.component';

@Component({
  selector: 'app-nota-debito-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NotaDebitoClienteComponent,
    NotaDebitoSucursalComponent,
    NotaDebitoRetencionesComponent,
    NotaDebitoDescuentosComponent,
    NotaDebitoResponsablesComponent,
    NotaDebitoOtrosComponent,
    NotaDebitoAppendicesComponent,
    NotaDebitoItemsComponent
  ],
  templateUrl: './nota-debito-page.component.html',
  styleUrl: './nota-debito-page.component.scss'
})
export class NotaDebitoPageComponent {
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
