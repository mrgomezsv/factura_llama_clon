import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-factura-sujeto-excluido-retenciones',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './factura-sujeto-excluido-retenciones.component.html',
      styleUrl: './factura-sujeto-excluido-retenciones.component.scss'
})
export class FacturaSujetoExcluidoRetencionesComponent {
  @Output() changed = new EventEmitter<{ renta: number; iva: number }>();
  form: FormGroup;
  collapsed = true;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({ renta: [0], iva: [0] });
    this.form.valueChanges.subscribe(v => this.changed.emit({
      renta: Number(v.renta) || 0,
      iva: Number(v.iva) || 0
    }));
  }
}

