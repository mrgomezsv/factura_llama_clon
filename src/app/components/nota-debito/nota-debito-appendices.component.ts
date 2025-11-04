import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-nota-debito-appendices',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card">
      <button class="card-header" type="button" (click)="collapsed = !collapsed" [class.active]="!collapsed">
        <span class="icon" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 4h10l4 4v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.5"/></svg>
        </span>
        <span class="title">Apéndices</span>
        <span class="chevron" [class.open]="!collapsed">▾</span>
      </button>
      <div class="card-body" *ngIf="!collapsed">
        <label class="label">Nombre (Campo)</label>
        <input class="input" placeholder="Añade un nombre" />
        <label class="label">Descripción (Etiqueta)</label>
        <input class="input" placeholder="Añade una descripción" />
        <label class="label">Valor</label>
        <input class="input" placeholder="Añade un valor" />
        <button class="btn btn-primary" type="button">Agregar Apéndice</button>
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
    .btn.btn-primary{align-self:flex-start}
  `]
})
export class NotaDebitoAppendicesComponent { collapsed = true; }

