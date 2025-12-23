import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormArray, FormGroup, Validators } from '@angular/forms';
import { DteService } from '../../../services/dte.service';

@Component({
  selector: 'app-comprobante-retencion-items',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './items.component.html',
  styleUrl: './items.component.scss'
})
export class ComprobanteRetencionItemsComponent {
  @Output() itemsChanged = new EventEmitter<any[]>();
  form: FormGroup;
  get items(): FormArray<FormGroup> { return this.form.get('items') as FormArray<FormGroup>; }
  collapsed = true;

  // CR Lists
  tiposDocumento = ['03', '01', '11', '14', '05', '06', '04']; // CCF, FAC, FEX, FSE, NC, ND, NR
  tiposGeneracion = [
    { val: 1, label: 'Físico' },
    { val: 2, label: 'Electrónico' }
  ];
  menus: Record<string, boolean> = { tipoDte: false, tipoGen: false };

  constructor(private fb: FormBuilder, private dteService: DteService) {
    this.form = this.fb.group({
      tipoDteRelacionado: ['03', Validators.required],
      tipoGeneracion: [1, Validators.required],
      numeroDocumento: ['', Validators.required],
      fechaEmision: [new Date().toISOString().split('T')[0], Validators.required],
      montoSujeto: [0, [Validators.required, Validators.min(0.01)]],
      ivaRetenido: [0, [Validators.required, Validators.min(0)]],
      items: this.fb.array([])
    });
    this.items.valueChanges.subscribe(v => this.itemsChanged.emit(v));
  }

  agregarItem(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      // Optional: alert('Complete los campos');
      return;
    }
    const v = this.form.value;
    const item = this.fb.group({
      tipoDteRelacionado: [v.tipoDteRelacionado],
      tipoGeneracion: [v.tipoGeneracion],
      numeroDocumento: [v.numeroDocumento],
      fechaEmision: [v.fechaEmision],
      montoSujetoGrav: [Number(v.montoSujeto)],
      ivaRetenido: [Number(v.ivaRetenido)],
      descripcion: [`Retención 1% sobre doc ${v.numeroDocumento}`]
    });

    this.items.push(item);
    this.itemsChanged.emit(this.items.value);

    // Reset form but keep some defaults
    this.form.patchValue({
      numeroDocumento: '',
      montoSujeto: 0,
      ivaRetenido: 0,
      fechaEmision: new Date().toISOString().split('T')[0]
    });
  }

  eliminarItem(i: number): void {
    this.items.removeAt(i);
    this.itemsChanged.emit(this.items.value);
  }

  toggleMenu(key: string) {
    this.menus[key] = !this.menus[key];
  }

  selectTipoDte(val: string) {
    this.form.patchValue({ tipoDteRelacionado: val });
    this.menus['tipoDte'] = false;
  }

  selectTipoGen(val: number) {
    this.form.patchValue({ tipoGeneracion: val });
    this.menus['tipoGen'] = false;
  }

  numberOnly(e: Event) {
    const input = e.target as HTMLInputElement;
    input.value = input.value.replace(/[^0-9.]/g, '');
  }

  calcRetencion() {
    const sujeto = Number(this.form.value.montoSujeto || 0);
    // Auto calc 1%
    const ret = parseFloat((sujeto * 0.01).toFixed(2));
    this.form.patchValue({ ivaRetenido: ret }, { emitEvent: false });
  }

  formatNumber(ctrl: 'montoSujeto' | 'ivaRetenido', decimals: number) {
    const val = Number(this.form.value[ctrl]);
    if (!isNaN(val)) this.form.patchValue({ [ctrl]: val.toFixed(decimals) }, { emitEvent: false });
  }
}

