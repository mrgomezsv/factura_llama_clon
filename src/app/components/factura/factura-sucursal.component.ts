import { Component } from '@angular/core';
import { DteService } from '../../services/dte.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-factura-sucursal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card">
      <button class="card-header" type="button" (click)="collapsed = !collapsed" [class.active]="!collapsed">
        <span class="icon" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10Z" stroke="currentColor" stroke-width="1.5"/></svg>
        </span>
        <span class="title">Sucursal</span>
        <span class="chevron" [class.open]="!collapsed">▾</span>
      </button>
      <div class="card-body" *ngIf="!collapsed">
        <label class="label">Sucursal</label>
        <div class="input-group">
          <button type="button" class="input select" (click)="open = !open">{{ sucursal || 'Selecciona una sucursal' }}</button>
          <button class="btn btn-icon" type="button" (click)="open = !open">▾</button>
          <div class="dropdown" *ngIf="open">
            <button type="button" class="dropdown-item" *ngFor="let s of sucursales" (click)="seleccionar(s)">{{ s }}</button>
          </div>
        </div>
        <label class="label">No. de POS</label>
        <input class="input" placeholder="" />
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
    .input.select{display:flex;align-items:center;justify-content:space-between}
    .dropdown{position:absolute;top:100%;left:0;right:0;background:#fff;border:1px solid #E9ECEF;border-radius:8px;box-shadow:var(--shadow-lg);z-index:50;margin-top:6px;max-height:220px;overflow:auto}
    .dropdown-item{width:100%;text-align:left;padding:10px 12px;border:none;background:transparent;cursor:pointer}
    .dropdown-item:hover{background:#F8F9FA}
  `]
})
export class FacturaSucursalComponent { 
  collapsed = true; 
  sucursal: string | null = null;
  open = false;
  sucursales: string[] = [];
  constructor(private dteService: DteService){
    this.dteService.getSucursales().subscribe((s: any[]) => this.sucursales = s.map(x => x.nombre));
  }
  seleccionar(s: string){ this.sucursal = s; this.open = false; }
}


