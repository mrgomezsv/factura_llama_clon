import { Component, EventEmitter, HostListener, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-crear-producto-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './crear-producto-modal.component.html',
  styleUrl: './crear-producto-modal.component.scss'
})
export class CrearProductoModalComponent implements OnInit {
  @Output() cerrar = new EventEmitter<void>();
  @Output() productoCreado = new EventEmitter<any>();

  form: FormGroup;
  mostrarUnidadDropdown = false;
  unidadSeleccionada: string = 'Otra';

  tiposProducto = ['Bienes', 'Servicios', 'Bienes y Servicios'];
  unidadesMedida = ['Unidad', 'Caja', 'Docena', 'Kg', 'Lt', 'Otra'];

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      tipoProducto: ['', Validators.required],
      precioConIva: [0, [Validators.required, Validators.min(0)]],
      descripcion: [''],
      codigoInterno: [''],
      descuento: [0, [Validators.min(0)]],
      unidadMedida: ['Otra']
    });
  }

  ngOnInit(): void {
    this.form.get('unidadMedida')?.setValue('Otra');
  }

  @HostListener('document:click', ['$event'])
  clickOutside(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.unidad-medida-container')) {
      this.mostrarUnidadDropdown = false;
    }
  }

  cerrarModal(): void {
    this.cerrar.emit();
  }

  crearProducto(): void {
    if (this.form.valid) {
      const producto = {
        ...this.form.value,
        fechaCreacion: new Date().toLocaleString('es-SV')
      };
      this.productoCreado.emit(producto);
    }
  }

  seleccionarUnidad(unidad: string): void {
    this.unidadSeleccionada = unidad;
    this.form.get('unidadMedida')?.setValue(unidad);
    this.mostrarUnidadDropdown = false;
  }

  limpiarUnidad(): void {
    this.unidadSeleccionada = 'Otra';
    this.form.get('unidadMedida')?.setValue('Otra');
  }
}

