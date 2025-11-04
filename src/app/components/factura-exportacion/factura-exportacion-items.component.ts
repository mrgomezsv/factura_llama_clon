import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormArray, FormGroup, Validators } from '@angular/forms';
import { DteService } from '../../services/dte.service';

@Component({
  selector: 'app-factura-exportacion-items',
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
          <div class="input-group" style="position:relative">
            <input class="input" placeholder="Buscar por nombre, código interno o descripción..." formControlName="producto" (focus)="openProducts()" (input)="filterProducts()" />
            <button class="btn btn-icon" type="button" (click)="openProducts()">▾</button>
            <div class="dropdown" *ngIf="productMenu">
              <button type="button" class="dropdown-item" *ngFor="let pr of filteredProducts" (click)="chooseProduct(pr)">
                {{ pr.nombre }} <span style="color:#868E96;font-size:12px" *ngIf="pr.codigo">({{ pr.codigo }})</span>
              </button>
              <div class="dropdown-vacio" *ngIf="filteredProducts.length===0">Sin resultados</div>
            </div>
          </div>

          <label class="label">Tipo de Producto</label>
          <div class="input-group">
            <button type="button" class="input select" (click)="toggleMenu('tipoProducto')">
              {{ form.value.tipoProducto }}
            </button>
            <button class="btn btn-icon" type="button" (click)="toggleMenu('tipoProducto')">▾</button>
            <div class="dropdown" *ngIf="menus['tipoProducto']">
              <button type="button" class="dropdown-item" *ngFor="let t of productTypes" (click)="selectTipoProducto(t)">{{ t }}</button>
            </div>
          </div>

          <label class="label">Cantidad</label>
          <input class="input" formControlName="cantidad" (input)="numberOnly($event)" (blur)="formatNumber('cantidad', 4)" />

          <label class="label">Unidad de Medida</label>
          <div class="input-group">
            <button type="button" class="input select" (click)="toggleMenu('unidad')">
              {{ form.value.unidad }}
            </button>
            <button class="btn btn-icon" type="button" (click)="toggleMenu('unidad')">▾</button>
            <div class="dropdown" *ngIf="menus['unidad']">
              <button type="button" class="dropdown-item" *ngFor="let u of units" (click)="selectUnidad(u)">{{ u }}</button>
            </div>
          </div>

          <label class="label">Código</label>
          <input class="input" placeholder="Código" formControlName="codigo" />

          <label class="label">Descripción</label>
          <div class="input-group">
            <input class="input" placeholder="Añade una descripción" formControlName="descripcion" />
            <button class="btn btn-icon" type="button">✎</button>
          </div>

          <label class="label">Tributos</label>
          <div class="input-group" style="position:relative">
            <button type="button" class="input select" (click)="toggleMenu('tributos')">
              {{ selectedTaxes.length ? selectedTaxes.join(', ') : 'Seleccione los tributos' }}
            </button>
            <button class="btn btn-icon" type="button" (click)="toggleMenu('tributos')">▾</button>
            <div class="dropdown" *ngIf="menus['tributos']">
              <button type="button" class="dropdown-item" *ngFor="let tx of taxes" (click)="toggleTax(tx)">
                <input type="checkbox" [checked]="selectedTaxes.includes(tx)" /> {{ tx }}
              </button>
            </div>
          </div>

          <label class="label">Precio Unitario (con IVA)</label>
          <div class="input-group">
            <span class="prefix">$</span>
            <input class="input" formControlName="precio" (input)="numberOnly($event)" (blur)="formatNumber('precio', 4)" />
          </div>

          <label class="label">Descuento</label>
          <div class="input-group">
            <span class="prefix">$</span>
            <input class="input" formControlName="descuento" (input)="numberOnly($event)" (blur)="formatNumber('descuento', 4)" />
          </div>

          <label class="label">Tipo de Venta</label>
          <div class="input-group">
            <button type="button" class="input select" (click)="toggleMenu('tipoVenta')">
              {{ form.value.tipoVenta }}
            </button>
            <button class="btn btn-icon" type="button" (click)="toggleMenu('tipoVenta')">▾</button>
            <div class="dropdown" *ngIf="menus['tipoVenta']">
              <button type="button" class="dropdown-item" *ngFor="let v of saleTypes" (click)="selectTipoVenta(v)">{{ v }}</button>
            </div>
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
    .card-header.active{box-shadow:0 0 0 3px rgba(91,155,213,.1);border-color:transparent}
    .card-body{display:flex;flex-direction:column;gap:10px;padding:16px;}
    .label{font-size:12px;color:var(--color-text-secondary);}
    .input{padding:10px;border:1px solid #DEE2E6;border-radius:8px;}
    .input-group{display:flex;align-items:center;gap:8px}
    .prefix{color:var(--color-text-secondary);}
    .btn.btn-primary{align-self:flex-start}
    .items-list{margin-top:8px;border-top:1px solid #E9ECEF}
    .item-row{display:grid;grid-template-columns:1fr auto auto auto;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid #F1F3F5}
    .input.select{display:flex;align-items:center;justify-content:space-between}
    .dropdown{position:absolute;top:100%;left:0;right:0;background:#fff;border:1px solid #E9ECEF;border-radius:8px;box-shadow:var(--shadow-lg);z-index:50;margin-top:6px;max-height:220px;overflow:auto}
    .dropdown-item{width:100%;text-align:left;padding:10px 12px;border:none;background:transparent;cursor:pointer}
    .dropdown-item:hover{background:#F8F9FA}
  `]
})
export class FacturaExportacionItemsComponent {
  @Output() itemsChanged = new EventEmitter<any[]>();
  form: FormGroup;
  get items(): FormArray<FormGroup> { return this.form.get('items') as FormArray<FormGroup>; }
  collapsed = true;

  productTypes = ['Bienes', 'Servicios', 'Bienes y Servicios'];
  units = ['Unidad', 'Caja', 'Docena', 'Kg', 'Lt'];
  taxes = [
    'Impuesto al Valor Agregado (exportaciones) 0%',
    'Turismo: por alojamiento (5%)',
    'Turismo: salida del país por vía aérea $7.00',
    'FOVIAL ($0.20 Ctvs. por galón)',
    'COTRANS ($0.10 Ctvs. por galón)',
    'Otras tasas casos especiales'
  ];
  saleTypes = ['Gravada', 'Exenta', 'No Sujeta', 'No Gravada'];
  menus: Record<string, boolean> = { tipoProducto: false, unidad: false, tributos: false, tipoVenta: false };
  selectedTaxes: string[] = [];

  constructor(private fb: FormBuilder, private dteService: DteService) {
    this.form = this.fb.group({
      producto: [''], tipoProducto: ['Bienes'], cantidad: [1, [Validators.required, Validators.min(0.0001)]], unidad: ['Unidad'],
      codigo: [''], descripcion: [''], tributos: [''], precio: [0, [Validators.required, Validators.min(0)]], descuento: [0, [Validators.min(0)]], tipoVenta: ['Gravada'],
      items: this.fb.array([])
    });
    this.items.valueChanges.subscribe(v => this.itemsChanged.emit(v));
    // Cargar productos
    this.dteService.getProductos().subscribe((p: any[]) => {
      this.allProducts = p;
      this.filteredProducts = p;
    });
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

  toggleMenu(key: string) {
    this.menus[key] = !this.menus[key];
  }
  selectTipoProducto(val: string) { this.form.patchValue({ tipoProducto: val }); this.menus['tipoProducto'] = false; }
  selectUnidad(val: string) { this.form.patchValue({ unidad: val }); this.menus['unidad'] = false; }
  selectTributo(val: string) { this.form.patchValue({ tributos: val }); this.menus['tributos'] = false; }
  toggleTax(val: string) {
    const idx = this.selectedTaxes.indexOf(val);
    if (idx >= 0) this.selectedTaxes.splice(idx, 1); else this.selectedTaxes.push(val);
    this.form.patchValue({ tributos: this.selectedTaxes.join(', ') });
  }
  selectTipoVenta(val: string) { this.form.patchValue({ tipoVenta: val }); this.menus['tipoVenta'] = false; }

  numberOnly(e: Event) {
    const input = e.target as HTMLInputElement;
    input.value = input.value.replace(/[^0-9.]/g, '');
  }
  formatNumber(ctrl: 'cantidad'|'precio'|'descuento', decimals: number) {
    const val = Number(this.form.value[ctrl]);
    if (!isNaN(val)) this.form.patchValue({ [ctrl]: val.toFixed(decimals) }, { emitEvent: false });
  }

  // Productos dropdown (búsqueda simple al tipear en campo producto)
  productMenu = false;
  allProducts: Array<{ id:string; nombre:string; codigo?: string }> = [];
  filteredProducts: Array<{ id:string; nombre:string; codigo?: string }> = [];
  openProducts(){ this.productMenu = true; this.filterProducts(); }
  filterProducts(){
    const q = (this.form.value.producto || '').toLowerCase();
    this.filteredProducts = this.allProducts.filter(p => p.nombre.toLowerCase().includes(q) || (p.codigo||'').toLowerCase().includes(q));
  }
  chooseProduct(p: any){ this.form.patchValue({ producto: p.nombre, codigo: p.codigo||'' }); this.productMenu = false; }
}

