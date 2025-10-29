import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PeriodoTributario } from '../../models/periodo-tributario.model';

@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './date-picker.component.html',
  styleUrl: './date-picker.component.scss'
})
export class DatePickerComponent implements OnInit {
  @Input() periodoActual!: PeriodoTributario;
  @Output() periodoSeleccionado = new EventEmitter<PeriodoTributario>();
  @Output() cerrar = new EventEmitter<void>();

  ano: number = new Date().getFullYear();
  meses: { numero: number; nombre: string; abreviatura: string }[] = [
      { numero: 1, nombre: 'Enero', abreviatura: 'Ene' },
      { numero: 2, nombre: 'Febrero', abreviatura: 'Feb' },
      { numero: 3, nombre: 'Marzo', abreviatura: 'Mar' },
      { numero: 4, nombre: 'Abril', abreviatura: 'Abr' },
      { numero: 5, nombre: 'Mayo', abreviatura: 'May' },
      { numero: 6, nombre: 'Junio', abreviatura: 'Jun' },
      { numero: 7, nombre: 'Julio', abreviatura: 'Jul' },
      { numero: 8, nombre: 'Agosto', abreviatura: 'Ago' },
      { numero: 9, nombre: 'Septiembre', abreviatura: 'Sep' },
      { numero: 10, nombre: 'Octubre', abreviatura: 'Oct' },
      { numero: 11, nombre: 'Noviembre', abreviatura: 'Nov' },
      { numero: 12, nombre: 'Diciembre', abreviatura: 'Dic' }
    ];

  ngOnInit(): void {
    if (this.periodoActual) {
      this.ano = this.periodoActual.año;
    }
  }

  seleccionarMes(mes: number): void {
    const nuevoPeriodo = new PeriodoTributario(mes, this.ano);
    this.periodoSeleccionado.emit(nuevoPeriodo);
  }

  esMesSeleccionado(mes: number): boolean {
    return this.periodoActual?.mes === mes && this.periodoActual?.año === this.ano;
  }

  cambiarAno(delta: number): void {
    this.ano += delta;
  }
}

