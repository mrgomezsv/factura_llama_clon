import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-factura-cliente',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="card">
      <button class="card-header" type="button" (click)="collapsed = !collapsed" [class.active]="!collapsed">
        <span class="icon" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm-7 9a7 7 0 0 1 14 0v1H5v-1Z" stroke="currentColor" stroke-width="1.5"/></svg>
        </span>
        <span class="title">Cliente</span>
        <span class="chevron" [class.open]="!collapsed">▾</span>
      </button>
      <div class="card-body" *ngIf="!collapsed">
        <form [formGroup]="form">
          <label class="label">Cliente
            <span class="help" data-tip="Todos tus clientes con nombre y correo electrónico registrados aparecerán en el listado.">i</span>
          </label>
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
    .card-header{width:100%;display:flex;align-items:center;gap:10px;padding:12px 16px;font-weight:600;border-bottom:1px solid #E9ECEF;background:#fff;cursor:pointer;text-align:left}
    .card-header .icon{display:inline-flex;color:var(--color-text-secondary)}
    .card-header .title{flex:1}
    .card-header .chevron{transition:transform .2s ease;color:var(--color-text-secondary)}
    .card-header .chevron.open{transform:rotate(180deg)}
    .card-header.active{box-shadow:0 0 0 3px rgba(91,155,213,.1);border-color:var(--color-primary)}
    .card-body{display:flex;flex-direction:column;gap:10px;padding:16px;}
    .label{font-size:12px;color:var(--color-text-secondary);}
    .input{padding:10px;border:1px solid #DEE2E6;border-radius:8px;}
    .input-group{display:flex;gap:8px}
    .btn.btn-icon{width:40px;height:40px}
    .help{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;border-radius:50%;background:#E9ECEF;color:#495057;font-size:11px;margin-left:6px;position:relative;cursor:default}
    .help::after{content:attr(data-tip);position:absolute;top:22px;left:0;background:#212529;color:#fff;padding:8px 10px;border-radius:8px;white-space:normal;min-width:220px;max-width:280px;font-size:11px;box-shadow:0 4px 12px rgba(0,0,0,.15);opacity:0;pointer-events:none;transition:opacity .15s}
    .help:hover::after{opacity:1}
  `]
})
export class FacturaClienteComponent {
  @Output() changed = new EventEmitter<any>();
  form: FormGroup;
  collapsed = false;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      busqueda: [''],
      nombre: [''],
      correo: ['']
    });
    this.form.valueChanges.subscribe(v => this.changed.emit(v));
  }
}


