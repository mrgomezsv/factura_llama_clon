import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormsModule } from '@angular/forms';
import { DteService } from '../../../services/dte.service';

@Component({
  selector: 'app-factura-sujeto-excluido-otros',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './otros.component.html',
  styleUrl: './otros.component.scss'
})
export class FacturaSujetoExcluidoOtrosComponent {
  @Output() changed = new EventEmitter<any>();

  form: FormGroup;
  collapsed = true;
  openFP = false;
  formasPago: { id: string, nombre: string }[] = [];

  condiciones = [
    { label: 'Contado', value: 1 },
    { label: 'Crédito', value: 2 },
    { label: 'Otro', value: 3 }
  ];

  constructor(private fb: FormBuilder, private dteService: DteService) {
    this.form = this.fb.group({
      condicionOperacion: [1], // Default Contado
      formaPago: ['01'], // Default Efectivo
      montoPago: [0],
      referencia: [''],
      observaciones: [''],
      fechaVenta: [new Date().toISOString().split('T')[0]],
      horaVenta: [new Date().toTimeString().split(' ')[0]]
    });

    this.form.valueChanges.subscribe(v => {
      // Emitir en un formato que el padre entienda o compatible con el generador
      this.changed.emit({
        condicionOperacion: v.condicionOperacion,
        pagos: [{
          codigo: v.formaPago,
          montoPago: v.montoPago,
          referencia: v.referencia || null,
          plazo: null,
          periodo: null
        }],
        observaciones: v.observaciones,
        fechaVenta: v.fechaVenta,
        horaVenta: v.horaVenta
      });
    });

    this.dteService.getFormasPago().subscribe((fp: any[]) => {
      this.formasPago = fp.map(x => ({ id: x.id, nombre: x.nombre }));
    });
  }

  escogerFP(f: any) {
    this.form.patchValue({ formaPago: f.id });
    this.openFP = false;
  }

  get formaPagoLabel(): string {
    const found = this.formasPago.find(fp => fp.id === this.form.value.formaPago);
    return found ? found.nombre : 'Selecciona una forma de pago';
  }
}
