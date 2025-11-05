import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FacturaSujetoExcluidoClienteComponent } from '../../components/factura-sujeto-excluido/factura-sujeto-excluido-cliente.component';
import { FacturaSujetoExcluidoSucursalComponent } from '../../components/factura-sujeto-excluido/factura-sujeto-excluido-sucursal.component';
import { FacturaSujetoExcluidoRetencionesComponent } from '../../components/factura-sujeto-excluido/factura-sujeto-excluido-retenciones.component';
import { FacturaSujetoExcluidoDescuentosComponent } from '../../components/factura-sujeto-excluido/factura-sujeto-excluido-descuentos.component';
import { FacturaSujetoExcluidoResponsablesComponent } from '../../components/factura-sujeto-excluido/factura-sujeto-excluido-responsables.component';
import { FacturaSujetoExcluidoOtrosComponent } from '../../components/factura-sujeto-excluido/factura-sujeto-excluido-otros.component';
import { FacturaSujetoExcluidoAppendicesComponent } from '../../components/factura-sujeto-excluido/factura-sujeto-excluido-appendices.component';
import { FacturaSujetoExcluidoItemsComponent } from '../../components/factura-sujeto-excluido/factura-sujeto-excluido-items.component';

@Component({
  selector: 'app-factura-sujeto-excluido-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FacturaSujetoExcluidoClienteComponent,
    FacturaSujetoExcluidoSucursalComponent,
    FacturaSujetoExcluidoRetencionesComponent,
    FacturaSujetoExcluidoDescuentosComponent,
    FacturaSujetoExcluidoResponsablesComponent,
    FacturaSujetoExcluidoOtrosComponent,
    FacturaSujetoExcluidoAppendicesComponent,
    FacturaSujetoExcluidoItemsComponent
  ],
  templateUrl: './factura-sujeto-excluido-page.component.html',
  styleUrl: './factura-sujeto-excluido-page.component.scss'
})
export class FacturaSujetoExcluidoPageComponent {
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
