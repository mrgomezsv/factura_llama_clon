import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-comprobante-retencion-responsables',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card">
      <button class="card-header" type="button" (click)="collapsed = !collapsed" [class.active]="!collapsed">
        <span class="icon" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21a8 8 0 1 1 16 0v1H4v-1Z" stroke="currentColor" stroke-width="1.5"/></svg>
        </span>
        <span class="title">Responsables</span>
        <span class="chevron" [class.open]="!collapsed">▾</span>
      </button>
      <div class="card-body" *ngIf="!collapsed">
        <div class="subtitulo">Emisor</div>
        <label class="label">Nombre</label>
        <input class="input" placeholder="Ingresa el Nombre" />
        <label class="label">Tipo de Documento</label>
        <div class="input-group">
          <input class="input" placeholder="Selecciona el Tipo de Documento" />
          <button class="btn btn-icon" type="button">▾</button>
        </div>
        <label class="label">Número de Documento</label>
        <input class="input" placeholder="Ingresa el Número de Documento" />

        <div class="subtitulo" style="margin-top: 12px;">Receptor</div>
        <label class="label">Nombre</label>
        <input class="input" placeholder="Ingresa el Nombre" />
        <label class="label">Tipo de Documento</label>
        <div class="input-group">
          <input class="input" placeholder="Selecciona el Tipo de Documento" />
          <button class="btn btn-icon" type="button">▾</button>
        </div>
        <label class="label">Número de Documento</label>
        <input class="input" placeholder="Ingresa el Número de Documento" />
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
    .subtitulo{font-weight:600;color:var(--color-text-primary);}
    .input{padding:10px;border:1px solid #DEE2E6;border-radius:8px;}
    .input-group{display:flex;gap:8px}
  `]
})
export class ComprobanteRetencionResponsablesComponent { collapsed = true; }

