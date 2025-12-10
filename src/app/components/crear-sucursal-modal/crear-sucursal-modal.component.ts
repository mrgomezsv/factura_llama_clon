import { Component, EventEmitter, OnInit, Output, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import departamentosMunicipiosData from '../../data/departamentos-municipios-mock.json';

@Component({
  selector: 'app-crear-sucursal-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './crear-sucursal-modal.component.html',
  styleUrl: './crear-sucursal-modal.component.scss'
})
export class CrearSucursalModalComponent implements OnInit, OnChanges {
  @Input() sucursalParaEditar: any = null;
  @Output() cerrar = new EventEmitter<void>();
  @Output() sucursalCreada = new EventEmitter<any>();
  @Output() sucursalActualizada = new EventEmitter<any>();

  form: FormGroup;
  departamentos: string[] = [];
  municipios: string[] = [];
  paisSeleccionado: string = 'El Salvador';
  departamentoSeleccionado: string = '';
  esModoEdicion = false;

  tiposSucursal = ['Principal', 'Secundaria', 'Almacén', 'Punto de Venta'];

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      tipoSucursal: ['', Validators.required],
      direccion: ['', Validators.required],
      complemento: [''],
      correoElectronico: ['', [Validators.required, Validators.email]],
      telefono: ['', Validators.required],
      departamento: ['', Validators.required],
      municipio: ['', Validators.required],
      codigoMH: ['M001', Validators.required],
      puntosVenta: [1]
    });
  }

  ngOnInit(): void {
    this.cargarDepartamentos(this.paisSeleccionado);

    this.form.get('departamento')?.valueChanges.subscribe(depto => {
      this.departamentoSeleccionado = depto;
      this.cargarMunicipios(this.paisSeleccionado, depto);
      if (!this.esModoEdicion) {
        this.form.get('municipio')?.setValue('');
      }
    });

    this.cargarDatosSucursal();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['sucursalParaEditar'] && !changes['sucursalParaEditar'].firstChange) {
      this.cargarDatosSucursal();
    }
  }

  cargarDatosSucursal(): void {
    if (this.sucursalParaEditar) {
      this.esModoEdicion = true;
      this.form.patchValue({
        nombre: this.sucursalParaEditar.nombre || '',
        tipoSucursal: this.sucursalParaEditar.tipoSucursal || '',
        direccion: this.sucursalParaEditar.direccion || '',
        complemento: this.sucursalParaEditar.complemento || '',
        correoElectronico: this.sucursalParaEditar.correoElectronico || '',
        telefono: this.sucursalParaEditar.telefono || '',
        departamento: this.sucursalParaEditar.departamento || '',
        municipio: this.sucursalParaEditar.municipio || '',
        codigoMH: this.sucursalParaEditar.codigoMH || 'M001',
        puntosVenta: this.sucursalParaEditar.puntosVenta || 1
      });
      this.departamentoSeleccionado = this.sucursalParaEditar.departamento || '';
      if (this.departamentoSeleccionado) {
        this.cargarMunicipios(this.paisSeleccionado, this.departamentoSeleccionado);
      }
    } else {
      this.esModoEdicion = false;
      this.form.reset({
        nombre: '',
        tipoSucursal: '',
        direccion: '',
        complemento: '',
        correoElectronico: '',
        telefono: '',
        departamento: '',
        municipio: '',
        codigoMH: 'M001',
        puntosVenta: 1
      });
      this.departamentoSeleccionado = '';
    }
  }

  cargarDepartamentos(pais: string): void {
    const data = departamentosMunicipiosData as any;
    if (data[pais]) {
      this.departamentos = Object.keys(data[pais]).sort();
    } else {
      this.departamentos = [];
    }
  }

  cargarMunicipios(pais: string, departamento: string): void {
    const data = departamentosMunicipiosData as any;
    if (data[pais] && data[pais][departamento]) {
      this.municipios = data[pais][departamento].sort();
    } else {
      this.municipios = [];
    }
  }

  cerrarModal(): void {
    this.cerrar.emit();
  }

  crearSucursal(): void {
    if (this.form.valid) {
      const sucursal = {
        ...this.form.value,
        fechaCreacion: new Date().toLocaleString('es-SV')
      };
      
      if (this.esModoEdicion && this.sucursalParaEditar) {
        sucursal.id = this.sucursalParaEditar.id;
        this.sucursalActualizada.emit(sucursal);
      } else {
        this.sucursalCreada.emit(sucursal);
      }
    }
  }
}

