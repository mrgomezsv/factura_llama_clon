import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-nota-credito-descuentos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="card">
      <button class="card-header" type="button" (click)="collapsed = !collapsed" [class.active]="!collapsed">
        <span class="icon" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 4h6l10 10-6 6L4 10V4Z" stroke="currentColor" stroke-width="1.5"/></svg>
        </span>
        <span class="title">Descuentos</span>
        <span class="chevron" [class.open]="!collapsed">▾</span>
      </button>
      <div class="card-body" *ngIf="!collapsed">
        <form [formGroup]="form">
          <label class="label">Descuento Global Ventas Gravadas</label>
          <input class="input" placeholder="Ingresa el monto (opcional)" formControlName="descuentoGlobal" />
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
    .card-header.active{box-shadow:0 0 0 3px rgba(91,155,213,.1);border-color:transparent}
    .card-body{display:flex;flex-direction:column;gap:10px;padding:16px;}
    .label{font-size:12px;color:var(--color-text-secondary);}
    .input{padding:10px;border:1px solid #DEE2E6;border-radius:8px;}
  `]
})
export class NotaCreditoDescuentosComponent {
  @Output() changed = new EventEmitter<number>();
  form: FormGroup;
  collapsed = true;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({ descuentoGlobal: [0] });
    this.form.valueChanges.subscribe(v => this.changed.emit(Number(v.descuentoGlobal) || 0));
  }
}

