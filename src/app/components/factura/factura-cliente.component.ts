import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-factura-cliente',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="card">
      <div class="card-header">Cliente</div>
      <div class="card-body">
        <form [formGroup]="form">
          <label class="label">Cliente</label>
          <div class="input-group">
            <input class="input" placeholder="Buscar por nombre, correo o alias..." formControlName="busqueda" />
            <button class="btn btn-icon" type="button">▾</button>
          </div>
          <label class="label">Nombre</label>
          <input class="input" placeholder="Ingresa el nombre" formControlName="nombre" />
          <label class="label">Correo electrónico</label>
          <input class="input" placeholder="Ingresa el correo electrónico" formControlName="correo" />
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
    .input-group{display:flex;gap:8px}
    .btn.btn-icon{width:40px;height:40px}
  `]
})
export class FacturaClienteComponent {
  @Output() changed = new EventEmitter<any>();
  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      busqueda: [''],
      nombre: [''],
      correo: ['']
    });
    this.form.valueChanges.subscribe(v => this.changed.emit(v));
  }
}


