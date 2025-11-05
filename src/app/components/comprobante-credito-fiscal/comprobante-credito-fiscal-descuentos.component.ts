import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-comprobante-credito-fiscal-descuentos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './comprobante-credito-fiscal-descuentos.component.html',
      styleUrl: './comprobante-credito-fiscal-descuentos.component.scss'
})
export class ComprobanteCreditoFiscalDescuentosComponent {
  @Output() changed = new EventEmitter<number>();
  form: FormGroup;
  collapsed = true;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({ descuentoGlobal: [0] });
    this.form.valueChanges.subscribe(v => this.changed.emit(Number(v.descuentoGlobal) || 0));
  }
}

