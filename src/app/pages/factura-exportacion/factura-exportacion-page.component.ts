import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FacturaExportacionClienteComponent } from '../../components/factura-exportacion/cliente/cliente.component';
import { FacturaExportacionSucursalComponent } from '../../components/factura-exportacion/sucursal/sucursal.component';
import { FacturaExportacionRetencionesComponent } from '../../components/factura-exportacion/retenciones/retenciones.component';
import { FacturaExportacionDescuentosComponent } from '../../components/factura-exportacion/descuentos/descuentos.component';
import { FacturaExportacionResponsablesComponent } from '../../components/factura-exportacion/responsables/responsables.component';
import { FacturaExportacionOtrosComponent } from '../../components/factura-exportacion/otros/otros.component';
import { FacturaExportacionAppendicesComponent } from '../../components/factura-exportacion/appendices/appendices.component';
import { FacturaExportacionItemsComponent } from '../../components/factura-exportacion/items/items.component';

@Component({
  selector: 'app-factura-exportacion-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FacturaExportacionClienteComponent,
    FacturaExportacionSucursalComponent,
    FacturaExportacionRetencionesComponent,
    FacturaExportacionDescuentosComponent,
    FacturaExportacionResponsablesComponent,
    FacturaExportacionOtrosComponent,
    FacturaExportacionAppendicesComponent,
    FacturaExportacionItemsComponent
  ],
  templateUrl: './factura-exportacion-page.component.html',
  styleUrl: './factura-exportacion-page.component.scss'
})
export class FacturaExportacionPageComponent {
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
