import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { DteService } from '../../../services/dte.service';

@Component({
  selector: 'app-nota-credito-cliente',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './cliente.component.html',
      styleUrl: './cliente.component.scss'
})
export class NotaCreditoClienteComponent {
  @Output() changed = new EventEmitter<any>();
  form: FormGroup;
  collapsed = false;
  mostrarListado = false;
  clientes: any[] = [];
  clientesFiltrados: any[] = [];

  constructor(private fb: FormBuilder, private dteService: DteService) {
    this.form = this.fb.group({
      busqueda: [''],
      nombre: [''],
      correo: ['']
    });
    this.form.valueChanges.subscribe(v => this.changed.emit(v));
    // Cargar clientes desde servicio
    this.dteService.getClientes().subscribe((lista: any[]) => {
      this.clientes = lista;
      this.clientesFiltrados = lista.slice();
    });
  }

  toggleListado(forced?: boolean) { this.mostrarListado = forced ?? !this.mostrarListado; }
  filtrar() {
    const q = (this.form.value.busqueda || '').toLowerCase();
    this.clientesFiltrados = this.clientes.filter(c => c.nombre.toLowerCase().includes(q) || c.correo.toLowerCase().includes(q));
  }
  seleccionarCliente(c: any) {
    this.form.patchValue({ nombre: c.nombre, correo: c.correo, busqueda: '' });
    this.mostrarListado = false;
    this.changed.emit(this.form.value);
  }
}

