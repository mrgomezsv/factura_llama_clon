import { Component } from '@angular/core';
import { DteService } from '../../services/dte.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-comprobante-retencion-otros',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card">
      <button class="card-header" type="button" (click)="collapsed = !collapsed" [class.active]="!collapsed">
        <span class="icon" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 3l9 4-9 4-9-4 9-4Zm9 10-9 4-9-4" stroke="currentColor" stroke-width="1.5"/></svg>
        </span>
        <span class="title">Otros</span>
        <span class="chevron" [class.open]="!collapsed">▾</span>
      </button>
      <div class="card-body" *ngIf="!collapsed">
        <label class="label">Actividad Económica</label>
        <div class="input-group">
          <input class="input" value="Venta al por mayor de otros artículos textiles" />
          <button class="btn btn-icon" type="button">×</button>
        </div>
        <label class="label">Fecha de Venta</label>
        <input class="input" value="Octubre 29, 2025" />
        <label class="label">Hora de Venta</label>
        <div class="input-group">
          <input class="input" placeholder="Selecciona una hora" />
          <button class="btn btn-icon" type="button">×</button>
        </div>
        <label class="label">Forma de Pago</label>
        <div class="input-group">
          <button type="button" class="input select" (click)="openFP = !openFP">{{ formaPago || 'Selecciona una forma de pago' }}</button>
          <button class="btn btn-icon" type="button" (click)="openFP = !openFP">▾</button>
          <div class="dropdown" *ngIf="openFP">
            <button type="button" class="dropdown-item" *ngFor="let f of formasPago" (click)="escogerFP(f)">{{ f }}</button>
          </div>
        </div>
        <label class="label">Observaciones</label>
        <textarea class="input" placeholder="Escribe aquí tus observaciones"></textarea>
      </div>
    </div>
  `,
  styles: [`
    .card{background:var(--color-bg-white);border-radius:var(--border-radius-md);box-shadow:var(--shadow-sm);}
    .card-header{width:100%;display:flex;align-items:center;gap:10px;padding:12px 16px;font-weight:600;border-bottom:1px solid #E9ECEF;background:#fff;cursor:pointer;text-align:left}
    .card-header .icon{display:inline-flex;color:var(--color-text-secondary)}
    .card-header .title{flex:1}
    .card-header .chevron{transition:transform .2s ease;color:var(--color-text-secondary)}
    .card-header .chevron.open{transform:rotate(180deg)}
    .card-header.active{box-shadow:0 0 0 3px rgba(91,155,213,.1);border-color:transparent}
    .card-body{display:flex;flex-direction:column;gap:10px;padding:16px;}
    .label{font-size:12px;color:var(--color-text-secondary);}
    .input{padding:10px;border:1px solid #DEE2E6;border-radius:8px;}
    .input-group{display:flex;gap:8px}
    textarea.input{min-height:90px}
  `]
})
export class ComprobanteRetencionOtrosComponent { 
  collapsed = true; 
  formaPago: string | null = null;
  openFP = false;
  formasPago: string[] = [];
  constructor(private dteService: DteService){
    this.dteService.getFormasPago().subscribe((fp: any[]) => this.formasPago = fp.map(x => x.nombre));
  }
  escogerFP(f: string){ this.formaPago = f; this.openFP = false; }
}

