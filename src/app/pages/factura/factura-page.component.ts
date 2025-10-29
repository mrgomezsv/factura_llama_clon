import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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

            <div class="separador"></div>
            <div class="opciones">
              <div class="opciones-header">
                <span class="icono">🔗</span>
                <span>Opciones</span>
              </div>
              <label class="switch-row">
                <input type="checkbox" [(ngModel)]="ambienteProduccion" />
                <span class="switch"></span>
                <span class="switch-label">Generar en Ambiente de Producción</span>
              </label>
              <label class="switch-row disabled">
                <input type="checkbox" disabled />
                <span class="switch"></span>
                <span class="switch-label">Enviar correo de notificación al cliente</span>
              </label>
              <label class="switch-row disabled">
                <input type="checkbox" disabled />
                <span class="switch"></span>
                <span class="switch-label">Mostrar vista previa antes del envío <span class="badge">PRONTO</span></span>
              </label>
            </div>
          </div>
          <div class="panel-derecho">
            <div class="placeholder-totales" *ngIf="items.length === 0">
              <img class="box-illustration" src="images/empty-state-4bf0c4a3.png" alt="Sin ítems" />
              <p class="empty-title">No se han agregado ítems</p>
              <p class="empty-sub">No es posible registrar ventas sin añadir productos o servicios.</p>
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
    .factura-layout { flex:1; display: grid; grid-template-columns: 420px 1fr; gap: 24px; padding: 20px 24px; overflow:auto; }
    .panel-izquierdo { display: flex; flex-direction: column; gap: 12px; }
    .panel-derecho { background: var(--color-bg-white); border-radius: var(--border-radius-md); padding: 16px; box-shadow: var(--shadow-sm); height: fit-content; align-self: start; }
    .placeholder-totales { text-align: center; color: var(--color-text-secondary); padding: 32px 0 16px; }
    .box-illustration { margin-bottom: 8px; }
    .empty-title{font-weight:700;color:#495057;margin:0}
    .empty-sub{margin:4px 0 0;color:#868E96;font-size:14px}
    .tabla-totales { display: flex; flex-direction: column; gap: 8px; }
    .tot-row { display: flex; justify-content: space-between; color: var(--color-text-primary); border-bottom: 1px solid #eee; padding: 6px 0; }
    .tot-row.total { font-weight: 700; }
    .separador{height:1px;background:#E9ECEF;margin:8px 0}
    .opciones{background:#fff;border:1px solid #E9ECEF;border-radius:12px;padding:12px;box-shadow:var(--shadow-sm)}
    .opciones-header{display:flex;align-items:center;gap:8px;color:#868E96;border-bottom:1px dashed #E9ECEF;padding-bottom:8px;margin-bottom:8px}
    .switch-row{display:flex;align-items:center;gap:10px;padding:8px 0}
    .switch-row.disabled{opacity:.6}
    .switch{width:38px;height:22px;border-radius:999px;background:#E9ECEF;position:relative;display:inline-block}
    .switch::after{content:'';position:absolute;width:18px;height:18px;background:#fff;border-radius:50%;top:2px;left:2px;box-shadow:0 1px 2px rgba(0,0,0,.1);transition:left .2s}
    input[type='checkbox']:checked + .switch::after{left:18px}
    input[type='checkbox']:checked + .switch{background:var(--color-primary)}
    .switch-label{color:#495057}
    .badge{background:#E7F1FB;color:#2B6CB0;border-radius:999px;padding:2px 8px;font-size:11px;margin-left:6px}
    @media (max-width: 1024px) { .factura-layout { grid-template-columns: 1fr; } }
  `]
})
export class FacturaPageComponent {
  cliente: any = {};
  items: Array<{ cantidad: number; precio: number; descuento: number }> = [];
  descuentoGlobal = 0;
  retenciones = { renta: 0, iva: 0 };
  ambienteProduccion = true;
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


