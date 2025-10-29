import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-factura-otros',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card">
      <div class="card-header">Otros</div>
      <div class="card-body">
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
          <input class="input" placeholder="Selecciona una forma de pago" />
          <button class="btn btn-icon" type="button">▾</button>
        </div>
        <label class="label">Observaciones</label>
        <textarea class="input" placeholder="Escribe aquí tus observaciones"></textarea>
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
    textarea.input{min-height:90px}
  `]
})
export class FacturaOtrosComponent {}


