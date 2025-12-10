import { Component, EventEmitter, HostListener, OnInit, Output, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-crear-producto-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './crear-producto-modal.component.html',
  styleUrl: './crear-producto-modal.component.scss'
})
export class CrearProductoModalComponent implements OnInit, OnChanges {
  @Input() productoParaEditar: any = null;
  @Output() cerrar = new EventEmitter<void>();
  @Output() productoCreado = new EventEmitter<any>();
  @Output() productoActualizado = new EventEmitter<any>();

  form: FormGroup;
  mostrarUnidadDropdown = false;
  unidadSeleccionada: string = 'Otra';
  esModoEdicion = false;

  tiposProducto = ['Bienes', 'Servicios', 'Bienes y Servicios'];
  unidadesMedida = ['Unidad', 'Caja', 'Docena', 'Kg', 'Lt', 'Otra'];

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      tipoProducto: [''],
      precioConIva: [0, [Validators.required, Validators.min(0)]],
      descripcion: [''],
      codigoInterno: [''],
      descuento: [0, [Validators.min(0)]],
      unidadMedida: ['Otra']
    });
  }

  ngOnInit(): void {
    this.form.get('unidadMedida')?.setValue('Otra');
    this.cargarDatosProducto();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['productoParaEditar'] && !changes['productoParaEditar'].firstChange) {
      this.cargarDatosProducto();
    }
  }

  cargarDatosProducto(): void {
    if (this.productoParaEditar) {
      this.esModoEdicion = true;
      this.form.patchValue({
        nombre: this.productoParaEditar.nombre || '',
        tipoProducto: this.productoParaEditar.tipoProducto || '',
        precioConIva: this.productoParaEditar.precioConIva || 0,
        descripcion: this.productoParaEditar.descripcion || '',
        codigoInterno: this.productoParaEditar.codigo || this.productoParaEditar.codigoInterno || '',
        descuento: this.productoParaEditar.descuento || 0,
        unidadMedida: this.productoParaEditar.unidadMedida || 'Otra'
      });
      this.unidadSeleccionada = this.productoParaEditar.unidadMedida || 'Otra';
    } else {
      this.esModoEdicion = false;
      this.form.reset({
        nombre: '',
        tipoProducto: '',
        precioConIva: 0,
        descripcion: '',
        codigoInterno: '',
        descuento: 0,
        unidadMedida: 'Otra'
      });
      this.unidadSeleccionada = 'Otra';
    }
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
        codigo: this.form.value.codigoInterno,
        fechaCreacion: new Date().toLocaleString('es-SV')
      };
      
      if (this.esModoEdicion && this.productoParaEditar) {
        producto.id = this.productoParaEditar.id;
        this.productoActualizado.emit(producto);
      } else {
        this.productoCreado.emit(producto);
      }
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

