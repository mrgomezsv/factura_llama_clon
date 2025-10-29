import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FacturaClienteComponent } from '../../components/factura/factura-cliente.component';
import { FacturaSucursalComponent } from '../../components/factura/factura-sucursal.component';
import { FacturaRetencionesComponent } from '../../components/factura/factura-retenciones.component';
import { FacturaDescuentosComponent } from '../../components/factura/factura-descuentos.component';
import { FacturaResponsablesComponent } from '../../components/factura/factura-responsables.component';
import { FacturaOtrosComponent } from '../../components/factura/factura-otros.component';
import { FacturaAppendicesComponent } from '../../components/factura/factura-appendices.component';
import { FacturaItemsComponent } from '../../components/factura/factura-items.component';

@Component({
  selector: 'app-factura-page',
  standalone: true,
  imports: [
    CommonModule,
    FacturaClienteComponent,
    FacturaSucursalComponent,
    FacturaRetencionesComponent,
    FacturaDescuentosComponent,
    FacturaResponsablesComponent,
    FacturaOtrosComponent,
    FacturaAppendicesComponent,
    FacturaItemsComponent
  ],
  template: `
    <div class="overlay" (click)="cerrar()">
      <div class="drawer" (click)="$event.stopPropagation()">
        <div class="drawer-header">
          <h3>Factura</h3>
          <button class="btn-cerrar" type="button" (click)="cerrar()">✕</button>
        </div>
        <div class="factura-layout">
          <div class="panel-izquierdo">
            <app-factura-cliente (changed)="onCliente($event)" />
            <app-factura-sucursal />
            <app-factura-retenciones (changed)="onRetenciones($event)" />
            <app-factura-descuentos (changed)="onDescuento($event)" />
            <app-factura-responsables />
            <app-factura-otros />
            <app-factura-appendices />
            <app-factura-items (itemsChanged)="onItems($event)" />
          </div>
          <div class="panel-derecho">
            <div class="placeholder-totales">
              <p *ngIf="items.length === 0">No se han agregado ítems</p>
              <small *ngIf="items.length === 0">No es posible registrar ventas sin añadir productos o servicios.</small>
            </div>
            <div class="tabla-totales">
              <div class="tot-row"><span>Suma de Ventas Gravadas</span><span>{{ sumaGravadas | currency:'USD':'symbol':'1.2-2' }}</span></div>
              <div class="tot-row"><span>Suma de Ventas Exentas</span><span>$0.00</span></div>
              <div class="tot-row"><span>Suma de Ventas No Sujetas</span><span>$0.00</span></div>
              <div class="tot-row"><span>Sub Total</span><span>{{ subTotal | currency:'USD':'symbol':'1.2-2' }}</span></div>
              <div class="tot-row"><span>(-)IVA Retenido</span><span>{{ retenciones.iva | currency:'USD':'symbol':'1.2-2' }}</span></div>
              <div class="tot-row"><span>(-)Retención Renta</span><span>{{ retenciones.renta | currency:'USD':'symbol':'1.2-2' }}</span></div>
              <div class="tot-row total"><span>Total a Pagar</span><span>{{ totalPagar | currency:'USD':'symbol':'1.2-2' }}</span></div>
            </div>
          </div>
        </div>
        <div class="drawer-footer">
          <button class="btn" type="button" (click)="cerrar()">Cancelar</button>
          <button class="btn btn-primary" type="button">Generar DTE</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .overlay{position:fixed;inset:0;background:rgba(0,0,0,.4);backdrop-filter:blur(2px);display:flex;justify-content:flex-end;z-index:1000}
    .drawer{width:min(100%, 980px);height:100vh;background:#fff;display:flex;flex-direction:column;animation:slideIn .25s ease;}
    @keyframes slideIn{from{transform:translateX(100%);}to{transform:translateX(0);}}
    .drawer-header{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid #E9ECEF}
    .drawer-footer{display:flex;gap:12px;justify-content:flex-end;padding:12px 16px;border-top:1px solid #E9ECEF}
    .btn-cerrar{border:none;background:transparent;font-size:18px;cursor:pointer;color:var(--color-text-secondary)}
    .factura-layout { flex:1; display: grid; grid-template-columns: 1fr 1fr; gap: 24px; padding: 16px; overflow:auto; }
    .panel-izquierdo { display: flex; flex-direction: column; gap: 12px; }
    .panel-derecho { background: var(--color-bg-white); border-radius: var(--border-radius-md); padding: 16px; box-shadow: var(--shadow-sm); height: fit-content; align-self: start; }
    .placeholder-totales { text-align: center; color: var(--color-text-secondary); padding: 24px 0; }
    .tabla-totales { display: flex; flex-direction: column; gap: 8px; }
    .tot-row { display: flex; justify-content: space-between; color: var(--color-text-primary); border-bottom: 1px solid #eee; padding: 6px 0; }
    .tot-row.total { font-weight: 700; }
    @media (max-width: 1024px) { .factura-layout { grid-template-columns: 1fr; } }
  `]
})
export class FacturaPageComponent {
  cliente: any = {};
  items: Array<{ cantidad: number; precio: number; descuento: number }> = [];
  descuentoGlobal = 0;
  retenciones = { renta: 0, iva: 0 };
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
    this.router.navigateByUrl('/');
  }
}


