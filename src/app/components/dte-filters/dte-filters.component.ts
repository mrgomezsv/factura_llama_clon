import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface FiltrosDTE {
  ambiente?: string;
  estado?: string;
  tipo?: string;
}

@Component({
  selector: 'app-dte-filters',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dte-filters.component.html',
  styleUrl: './dte-filters.component.scss'
})
export class DteFiltersComponent implements OnChanges {
  @Input() mostrar: boolean = false;
  @Input() filtros: FiltrosDTE = {};
  @Output() cerrar = new EventEmitter<void>();
  @Output() aplicarFiltros = new EventEmitter<FiltrosDTE>();
  @Output() cancelar = new EventEmitter<void>();

  filtrosLocales: FiltrosDTE = {};
  mostrarDropdownAmbiente: boolean = false;
  mostrarDropdownEstado: boolean = false;
  mostrarDropdownTipo: boolean = false;

  ambientes: { valor: string; label: string }[] = [
    { valor: 'PRODUCCIÓN', label: 'PRODUCCIÓN' },
    { valor: 'PRUEBAS', label: 'PRUEBAS' }
  ];

  estados: { valor: string; label: string; color: string }[] = [
    { valor: 'CREADO', label: 'CREADO', color: 'orange' },
    { valor: 'APROBADO', label: 'APROBADO', color: 'blue' },
    { valor: 'RECHAZADO', label: 'RECHAZADO', color: 'red' },
    { valor: 'PROCESANDO', label: 'PROCESANDO', color: 'orange' }
  ];

  tipos: { valor: string; label: string }[] = [
    { valor: 'FAC', label: 'Factura' },
    { valor: 'CCF', label: 'Comprobante Crédito Fiscal' },
    { valor: 'NCR', label: 'Nota de Crédito' },
    { valor: 'NDB', label: 'Nota de Débito' },
    { valor: 'FSE', label: 'Factura de Sujeto Excluido' },
    { valor: 'FEX', label: 'Factura de Exportación' },
    { valor: 'REM', label: 'Nota de Remisión' }
  ];

  ngOnChanges(): void {
    if (this.mostrar) {
      this.filtrosLocales = { ...this.filtros };
    }
  }

  toggleDropdownAmbiente(): void {
    this.mostrarDropdownAmbiente = !this.mostrarDropdownAmbiente;
    this.mostrarDropdownEstado = false;
    this.mostrarDropdownTipo = false;
  }

  toggleDropdownEstado(): void {
    this.mostrarDropdownEstado = !this.mostrarDropdownEstado;
    this.mostrarDropdownAmbiente = false;
    this.mostrarDropdownTipo = false;
  }

  toggleDropdownTipo(): void {
    this.mostrarDropdownTipo = !this.mostrarDropdownTipo;
    this.mostrarDropdownAmbiente = false;
    this.mostrarDropdownEstado = false;
  }

  seleccionarAmbiente(ambiente: string): void {
    this.filtrosLocales.ambiente = ambiente;
    this.mostrarDropdownAmbiente = false;
  }

  seleccionarEstado(estado: string): void {
    this.filtrosLocales.estado = estado;
    this.mostrarDropdownEstado = false;
  }

  seleccionarTipo(tipo: string): void {
    this.filtrosLocales.tipo = tipo;
    this.mostrarDropdownTipo = false;
  }

  onAplicar(): void {
    this.aplicarFiltros.emit(this.filtrosLocales);
    this.cerrar.emit();
  }

  onCancelar(): void {
    this.cancelar.emit();
    this.cerrar.emit();
  }

  obtenerLabelAmbiente(): string {
    return this.filtrosLocales.ambiente || 'Selecciona el ambiente';
  }

  obtenerLabelEstado(): string {
    return this.filtrosLocales.estado || 'Selecciona el estado';
  }

  obtenerLabelTipo(): string {
    return this.filtrosLocales.tipo || 'Selecciona el tipo';
  }

  obtenerColorEstado(estado: string): string {
    const estadoEncontrado = this.estados.find(e => e.valor === estado);
    return estadoEncontrado?.color || 'gray';
  }
}

