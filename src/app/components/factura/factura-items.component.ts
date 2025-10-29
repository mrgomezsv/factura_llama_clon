import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormArray, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-factura-items',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="card">
      <button class="card-header" type="button" (click)="collapsed = !collapsed" [class.active]="!collapsed">
        <span class="icon" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-width="1.5"/></svg>
        </span>
        <span class="title">Items</span>
        <span class="chevron" [class.open]="!collapsed">▾</span>
      </button>
      <div class="card-body" *ngIf="!collapsed">
        <form [formGroup]="form">
          <label class="label">Producto</label>
          <div class="input-group">
            <input class="input" placeholder="Buscar por nombre, código interno o descripción..." formControlName="producto" />
            <button class="btn btn-icon" type="button">▾</button>
          </div>

          <label class="label">Tipo de Producto</label>
          <div class="input-group">
            <input class="input" value="Bienes" formControlName="tipoProducto" />
            <button class="btn btn-icon" type="button">▾</button>
          </div>

          <label class="label">Cantidad</label>
          <input class="input" formControlName="cantidad" />

          <label class="label">Unidad de Medida</label>
          <div class="input-group">
            <input class="input" value="Unidad" formControlName="unidad" />
            <button class="btn btn-icon" type="button">▾</button>
          </div>

          <label class="label">Código</label>
          <input class="input" placeholder="Código" formControlName="codigo" />

          <label class="label">Descripción</label>
          <div class="input-group">
            <input class="input" placeholder="Añade una descripción" formControlName="descripcion" />
            <button class="btn btn-icon" type="button">✎</button>
          </div>

          <label class="label">Tributos</label>
          <div class="input-group">
            <input class="input" placeholder="Seleccione los tributos" formControlName="tributos" />
            <button class="btn btn-icon" type="button">▾</button>
          </div>

          <label class="label">Precio Unitario (con IVA)</label>
          <div class="input-group">
            <span class="prefix">$</span>
            <input class="input" formControlName="precio" />
          </div>

          <label class="label">Descuento</label>
          <div class="input-group">
            <span class="prefix">$</span>
            <input class="input" formControlName="descuento" />
          </div>

          <label class="label">Tipo de Venta</label>
          <div class="input-group">
            <input class="input" value="Gravada" formControlName="tipoVenta" />
            <button class="btn btn-icon" type="button">▾</button>
          </div>

          <button class="btn btn-primary" type="button" (click)="agregarItem()">Agregar ítem</button>
        </form>

        <div class="items-list" *ngIf="items.controls.length > 0">
          <div class="item-row" *ngFor="let it of items.controls; let i = index" [formGroup]="it">
            <span>{{ it.value.descripcion || it.value.producto }}</span>
            <span>x{{ it.value.cantidad }}</span>
            <span>{{ (it.value.precio - (it.value.descuento||0)) * it.value.cantidad | number:'1.2-2' }}</span>
            <button class="btn btn-icon" type="button" (click)="eliminarItem(i)">✕</button>
          </div>
        </div>
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
    .input-group{display:flex;align-items:center;gap:8px}
    .prefix{color:var(--color-text-secondary);}
    .btn.btn-primary{align-self:flex-start}
    .items-list{margin-top:8px;border-top:1px solid #E9ECEF}
    .item-row{display:grid;grid-template-columns:1fr auto auto auto;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid #F1F3F5}
  `]
})
export class FacturaItemsComponent {
  @Output() itemsChanged = new EventEmitter<any[]>();
  form: FormGroup;
  get items(): FormArray<FormGroup> { return this.form.get('items') as FormArray<FormGroup>; }
  collapsed = true;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      producto: [''], tipoProducto: ['Bienes'], cantidad: [1], unidad: ['Unidad'],
      codigo: [''], descripcion: [''], tributos: [''], precio: [0], descuento: [0], tipoVenta: ['Gravada'],
      items: this.fb.array([])
    });
    this.items.valueChanges.subscribe(v => this.itemsChanged.emit(v));
  }

  agregarItem(): void {
    const v = this.form.value;
    const item = this.fb.group({
      producto: [v.producto], descripcion: [v.descripcion], cantidad: [Number(v.cantidad)||1],
      precio: [Number(v.precio)||0], descuento: [Number(v.descuento)||0], tipoVenta: [v.tipoVenta]
    });
    this.items.push(item);
    this.itemsChanged.emit(this.items.value);
  }

  eliminarItem(i: number): void {
    this.items.removeAt(i);
    this.itemsChanged.emit(this.items.value);
  }
}


