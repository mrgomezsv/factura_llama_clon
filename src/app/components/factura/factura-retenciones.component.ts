import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-factura-retenciones',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="card">
      <div class="card-header">Retenciones</div>
      <div class="card-body">
        <form [formGroup]="form">
          <label class="label">Retención Renta</label>
          <input class="input" placeholder="Ingresa el monto (opcional)" formControlName="renta" />
          <label class="label">IVA Retenido</label>
          <input class="input" placeholder="Ingresa el monto (opcional)" formControlName="iva" />
        </form>
      </div>
    </div>
  `,
  styles: [`
    .card{background:var(--color-bg-white);border-radius:var(--border-radius-md);box-shadow:var(--shadow-sm);}
    .card-header{padding:12px 16px;font-weight:600;border-bottom:1px solid #E9ECEF;}
    .card-body{display:flex;flex-direction:column;gap:10px;padding:16px;}
    .label{font-size:12px;color:var(--color-text-secondary);}
    .input{padding:10px;border:1px solid #DEE2E6;border-radius:8px;}
  `]
})
export class FacturaRetencionesComponent {
  @Output() changed = new EventEmitter<{ renta: number; iva: number }>();
  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({ renta: [0], iva: [0] });
    this.form.valueChanges.subscribe(v => this.changed.emit({
      renta: Number(v.renta) || 0,
      iva: Number(v.iva) || 0
    }));
  }
}


