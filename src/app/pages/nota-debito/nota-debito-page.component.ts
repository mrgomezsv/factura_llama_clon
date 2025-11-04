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
  template: `
    <div class="overlay" (click)="cerrar()">
      <div class="drawer" (click)="$event.stopPropagation()">
        <div class="drawer-header">
          <h3>Nota de Débito</h3>
          <button class="btn-cerrar" type="button" (click)="cerrar()">✕</button>
        </div>
        <div class="factura-layout">
          <div class="panel-izquierdo">
            <app-nota-debito-cliente (changed)="onCliente($event)" />
            <app-nota-debito-sucursal />
            <app-nota-debito-retenciones (changed)="onRetenciones($event)" />
            <app-nota-debito-descuentos (changed)="onDescuento($event)" />
            <app-nota-debito-responsables />
            <app-nota-debito-otros />
            <app-nota-debito-appendices />
            <app-nota-debito-items (itemsChanged)="onItems($event)" />

            <div class="card opciones-card">
              <div class="card-header">
                <div class="dashed-line-left"></div>
                <span class="icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" stroke="currentColor" stroke-width="1.5"/></svg>
                </span>
                <span class="title">Opciones</span>
                <div class="dashed-line-right"></div>
              </div>
              <div class="card-body">
                <label class="switch-row">
                  <input type="checkbox" [(ngModel)]="ambienteProduccion" />
                  <span class="switch"></span>
                  <span class="switch-label">Generar en Ambiente de Producción</span>
                </label>
                <label class="switch-row">
                  <input type="checkbox" [(ngModel)]="enviarCorreo" />
                  <span class="switch"></span>
                  <span class="switch-label">Enviar correo de notificación al cliente</span>
                </label>
                <label class="switch-row">
                  <input type="checkbox" [(ngModel)]="vistaPrevia" />
                  <span class="switch"></span>
                  <span class="switch-label">Mostrar vista previa antes del envío</span>
                </label>
              </div>
            </div>
          </div>
          <div class="panel-derecho">
            <div class="placeholder-totales" *ngIf="items.length === 0">
              <img class="box-illustration" src="images/empty-state-4bf0c4a3.png" alt="Sin ítems" />
              <p class="empty-title">No se han agregado ítems</p>
              <p class="empty-sub">No es posible registrar ventas sin añadir productos o servicios.</p>
            </div>
            <div class="card totales-card">
              <div class="card-header">
                <div class="dashed-line-left"></div>
                <span class="icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10Z" stroke="currentColor" stroke-width="1.5"/>
                    <path d="M12 7v1.5M12 15.5V17M10 10.5h2.5a1.5 1.5 0 0 1 1.5 1.5 1.5 1.5 0 0 1-1.5 1.5H10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </span>
                <span class="title">Totales</span>
                <div class="dashed-line-right"></div>
              </div>
              <div class="card-body">
                <div class="tabla-totales">
                  <div class="tot-row"><span>Suma de Ventas Gravadas</span><span>{{ sumaGravadas | currency:'USD':'symbol':'1.2-2' }}</span></div>
                  <div class="tot-row"><span>Suma de Ventas Exentas</span><span>$0.00</span></div>
                  <div class="tot-row"><span>Suma de Ventas No Sujetas</span><span>$0.00</span></div>
                  <div class="tot-row"><span>Sumatoria de Ventas</span><span>{{ sumaGravadas | currency:'USD':'symbol':'1.2-2' }}</span></div>
                  <div class="tot-row"><span>Descuento Global Ventas Gravadas</span><span>{{ descuentoGlobal | currency:'USD':'symbol':'1.2-2' }}</span></div>
                  <div class="tot-row subtotal"><span>Sub Total</span><span>{{ subTotal | currency:'USD':'symbol':'1.2-2' }}</span></div>
                  <div class="tot-row"><span>(-)IVA Retenido</span><span>{{ retenciones.iva | currency:'USD':'symbol':'1.2-2' }}</span></div>
                  <div class="tot-row"><span>(-)Retención Renta</span><span>{{ retenciones.renta | currency:'USD':'symbol':'1.2-2' }}</span></div>
                  <div class="tot-row"><span>Monto Total de Operación</span><span>{{ totalPagar | currency:'USD':'symbol':'1.2-2' }}</span></div>
                  <div class="tot-row"><span>Total de Otros Montos No Afectos</span><span>$0.00</span></div>
                  <div class="tot-row total"><span>Total a Pagar</span><span>{{ totalPagar | currency:'USD':'symbol':'1.2-2' }}</span></div>
                </div>
              </div>
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
    .drawer{width:min(100%, 1250px);height:100vh;background:#fff;display:flex;flex-direction:column;animation:slideIn .25s ease;border:0;}
    @keyframes slideIn{from{transform:translateX(100%);}to{transform:translateX(0);}}
    .drawer-header{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid #E9ECEF}
    .drawer-footer{display:flex;gap:12px;justify-content:flex-end;padding:12px 16px;border-top:1px solid #E9ECEF}
    .btn-cerrar{border:none;background:transparent;font-size:18px;cursor:pointer;color:var(--color-text-secondary)}
    .factura-layout { flex:1; display: grid; grid-template-columns: 500px 1fr; gap: 24px; padding: 20px 24px; overflow:auto; }
    .panel-izquierdo { display: flex; flex-direction: column; gap: 12px; }
    .panel-derecho { display: flex; flex-direction: column; gap: 16px; }
    .placeholder-totales { text-align: center; color: var(--color-text-secondary); padding: 32px 0 16px; }
    .box-illustration { margin-bottom: 8px; }
    .empty-title{font-weight:700;color:#495057;margin:0}
    .empty-sub{margin:4px 0 0;color:#868E96;font-size:14px}
    .card.opciones-card, .card.totales-card { background:var(--color-bg-white); border-radius:var(--border-radius-md); box-shadow:0 1px 2px rgba(15, 23, 42, 0.08); }
    .card.opciones-card .card-header, .card.totales-card .card-header { width:100%; display:flex; align-items:center; padding:0 14px; height:44px; font-weight:600; background:#fff; position:relative; gap:0; }
    .card.opciones-card .card-header { border-bottom:1px solid #E5E7EB; }
    .card.totales-card .card-header { border-bottom:0; }
    .card.opciones-card .card-header .icon, .card.totales-card .card-header .icon { display:inline-flex; color:var(--color-text-secondary); position:relative; z-index:1; margin-right:10px; }
    .card.opciones-card .card-header .title, .card.totales-card .card-header .title { flex:0 0 auto; color:#374151; position:relative; z-index:1; margin-right:10px; }
    .dashed-line-left, .dashed-line-right { flex:1; height:1px; border-top:1px dashed #E9ECEF; align-self:center; }
    .card.opciones-card .card-body, .card.totales-card .card-body { display:flex; flex-direction:column; gap:10px; padding:14px; }
    .card.totales-card .card-body { padding:0 14px 14px 14px; }
    .tabla-totales { display: flex; flex-direction: column; gap: 0; }
    .tot-row { display: flex; justify-content: space-between; align-items: center; color: var(--color-text-primary); border-bottom: 1px solid #E5E7EB; padding: 10px 0; font-size: 14px; }
    .tot-row span:first-child { text-align: left; }
    .tot-row span:last-child { text-align: right; font-weight: 400; }
    .tot-row.subtotal { font-weight: 700; }
    .tot-row.subtotal span:last-child { font-weight: 700; }
    .tot-row.total { font-weight: 700; border-bottom: 1px solid #D1D5DB; }
    .tot-row.total span:last-child { font-weight: 700; }
    .tot-row:last-child { border-bottom: 0; }
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
    this.router.navigateByUrl('/');
  }
}
