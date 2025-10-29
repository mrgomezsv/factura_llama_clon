import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-factura-responsables',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card">
      <div class="card-header">Responsables</div>
      <div class="card-body">
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
    .card-header{padding:12px 16px;font-weight:600;border-bottom:1px solid #E9ECEF;}
    .card-body{display:flex;flex-direction:column;gap:10px;padding:16px;}
    .label{font-size:12px;color:var(--color-text-secondary);}
    .subtitulo{font-weight:600;color:var(--color-text-primary);}
    .input{padding:10px;border:1px solid #DEE2E6;border-radius:8px;}
    .input-group{display:flex;gap:8px}
  `]
})
export class FacturaResponsablesComponent {}


