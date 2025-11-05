import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FacturaClienteComponent } from '../../components/factura/cliente/cliente.component';
import { FacturaSucursalComponent } from '../../components/factura/sucursal/sucursal.component';
import { FacturaRetencionesComponent } from '../../components/factura/retenciones/retenciones.component';
import { FacturaDescuentosComponent } from '../../components/factura/descuentos/descuentos.component';
import { FacturaResponsablesComponent } from '../../components/factura/responsables/responsables.component';
import { FacturaOtrosComponent } from '../../components/factura/otros/otros.component';
import { FacturaAppendicesComponent } from '../../components/factura/appendices/appendices.component';
import { FacturaItemsComponent } from '../../components/factura/items/items.component';

@Component({
  selector: 'app-factura-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FacturaClienteComponent,
    FacturaSucursalComponent,
    FacturaRetencionesComponent,
    FacturaDescuentosComponent,
    FacturaResponsablesComponent,
    FacturaOtrosComponent,
    FacturaAppendicesComponent,
    FacturaItemsComponent
  ],
  templateUrl: './factura-page.component.html',
  styleUrl: './factura-page.component.scss'
})
export class FacturaPageComponent {
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


