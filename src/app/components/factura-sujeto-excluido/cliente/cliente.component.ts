import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { DteService } from '../../../services/dte.service';

@Component({
  selector: 'app-factura-sujeto-excluido-cliente',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './cliente.component.html',
  styleUrl: './cliente.component.scss'
})
export class FacturaSujetoExcluidoClienteComponent {
  @Output() changed = new EventEmitter<any>();
  form: FormGroup;
  collapsed = false;
  mostrarListado = false;
  clientes: any[] = [];
  clientesFiltrados: any[] = [];

  documentTypes = [
    { label: 'DUI', value: '13' },
    { label: 'NIT', value: '36' },
    { label: 'Pasaporte', value: '02' },
    { label: 'Carnet de Residente', value: '03' },
    { label: 'Otro', value: '37' }
  ];

  constructor(private fb: FormBuilder, private dteService: DteService) {
    this.form = this.fb.group({
      busqueda: [''],
      nombre: [''],
      correo: [''],
      tipoDocumento: ['13'], // Default DUI
      numeroDocumento: [''],
      codActividad: [''],
      direccion: [''],
      telefono: ['']
    });

    this.form.valueChanges.subscribe(v => this.changed.emit(v));

    this.dteService.getClientes().subscribe((lista: any[]) => {
      this.clientes = lista;
      this.clientesFiltrados = lista.slice();
    });
  }

  toggleListado(forced?: boolean) {
    this.mostrarListado = forced ?? !this.mostrarListado;
  }

  filtrar() {
    const q = (this.form.value.busqueda || '').toLowerCase();
    this.clientesFiltrados = this.clientes.filter(c =>
      (c.nombre || '').toLowerCase().includes(q) ||
      (c.correo || '').toLowerCase().includes(q)
    );
  }

  seleccionarCliente(c: any) {
    this.form.patchValue({
      nombre: c.nombre,
      correo: c.correo || '',
      busqueda: '',
      tipoDocumento: c.tipoDocumento || '13',
      numeroDocumento: c.numeroDocumento || c.nit || '',
      codActividad: c.actividadEconomica || '',
      direccion: c.direccion || '',
      telefono: c.telefono || ''
    });
    this.mostrarListado = false;
    this.changed.emit({
      ...this.form.value,
      id: c.id,
      nit: c.nit,
      nrc: c.nrc,
      direccion: c.direccion,
      telefono: c.telefono
    });
  }
}
