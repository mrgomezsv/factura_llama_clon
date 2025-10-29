import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-factura-sucursal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card">
      <div class="card-header">Sucursal</div>
      <div class="card-body">
        <label class="label">Sucursal</label>
        <div class="input-group">
          <input class="input" placeholder="Selecciona una sucursal" />
          <button class="btn btn-icon" type="button">▾</button>
        </div>
        <label class="label">No. de POS</label>
        <input class="input" placeholder="" />
      </div>
    </div>
  `,
  styles: [`
    .card{background:var(--color-bg-white);border-radius:var(--border-radius-md);box-shadow:var(--shadow-sm);}
    .card-header{padding:12px 16px;font-weight:600;border-bottom:1px solid #E9ECEF;}
    .card-body{display:flex;flex-direction:column;gap:10px;padding:16px;}
    .label{font-size:12px;color:var(--color-text-secondary);}
    .input{padding:10px;border:1px solid #DEE2E6;border-radius:8px;}
    .input-group{display:flex;gap:8px}
  `]
})
export class FacturaSucursalComponent {}


