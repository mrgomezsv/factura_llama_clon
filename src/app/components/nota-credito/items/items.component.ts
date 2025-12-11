import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormArray, FormGroup, Validators } from '@angular/forms';
import { DteService } from '../../../services/dte.service';

@Component({
  selector: 'app-nota-credito-items',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './items.component.html',
      styleUrl: './items.component.scss'
})
export class NotaCreditoItemsComponent {
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
      precio: [Number(v.precio)||0], descuento: [Number(v.descuento)||0], tipoVenta: [v.tipoVenta],
      unidad: [v.unidad], codigo: [v.codigo]
    });
    this.items.push(item);
    this.itemsChanged.emit(this.items.value);
    
    // Limpiar el formulario después de agregar el item
    this.form.patchValue({
      producto: '',
      codigo: '',
      descripcion: '',
      cantidad: 1,
      precio: 0,
      descuento: 0,
      tipoProducto: 'Bienes',
      unidad: 'Unidad',
      tipoVenta: 'Gravada',
      tributos: ''
    });
    this.selectedTaxes = [];
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

