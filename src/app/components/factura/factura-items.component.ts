import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-factura-items',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card">
      <div class="card-header">Items</div>
      <div class="card-body">
        <label class="label">Producto</label>
        <div class="input-group">
          <input class="input" placeholder="Buscar por nombre, código interno o descripción..." />
          <button class="btn btn-icon" type="button">▾</button>
        </div>

        <label class="label">Tipo de Producto</label>
        <div class="input-group">
          <input class="input" value="Bienes" />
          <button class="btn btn-icon" type="button">▾</button>
        </div>

        <label class="label">Cantidad</label>
        <input class="input" value="1.0000" />

        <label class="label">Unidad de Medida</label>
        <div class="input-group">
          <input class="input" value="Unidad" />
          <button class="btn btn-icon" type="button">▾</button>
        </div>

        <label class="label">Código</label>
        <input class="input" placeholder="Código" />

        <label class="label">Descripción</label>
        <div class="input-group">
          <input class="input" placeholder="Añade una descripción" />
          <button class="btn btn-icon" type="button">✎</button>
        </div>

        <label class="label">Tributos</label>
        <div class="input-group">
          <input class="input" placeholder="Seleccione los tributos" />
          <button class="btn btn-icon" type="button">▾</button>
        </div>

        <label class="label">Precio Unitario (con IVA)</label>
        <div class="input-group">
          <span class="prefix">$</span>
          <input class="input" value="0.0000" />
        </div>

        <label class="label">Descuento</label>
        <div class="input-group">
          <span class="prefix">$</span>
          <input class="input" value="0.0000" />
        </div>

        <label class="label">Tipo de Venta</label>
        <div class="input-group">
          <input class="input" value="Gravada" />
          <button class="btn btn-icon" type="button">▾</button>
        </div>

        <button class="btn btn-primary" type="button">Agregar ítem</button>
      </div>
    </div>
  `,
  styles: [`
    .card{background:var(--color-bg-white);border-radius:var(--border-radius-md);box-shadow:var(--shadow-sm);}
    .card-header{padding:12px 16px;font-weight:600;border-bottom:1px solid #E9ECEF;}
    .card-body{display:flex;flex-direction:column;gap:10px;padding:16px;}
    .label{font-size:12px;color:var(--color-text-secondary);}
    .input{padding:10px;border:1px solid #DEE2E6;border-radius:8px;}
    .input-group{display:flex;align-items:center;gap:8px}
    .prefix{color:var(--color-text-secondary);}
    .btn.btn-primary{align-self:flex-start}
  `]
})
export class FacturaItemsComponent {}


