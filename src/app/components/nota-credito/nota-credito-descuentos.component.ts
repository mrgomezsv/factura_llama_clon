import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-nota-credito-descuentos',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './nota-credito-descuentos.component.html',
      styleUrl: './nota-credito-descuentos.component.scss'
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

