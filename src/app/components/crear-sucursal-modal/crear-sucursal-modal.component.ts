import { Component, EventEmitter, OnInit, Output } from '@angular/core';
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
export class CrearSucursalModalComponent implements OnInit {
  @Output() cerrar = new EventEmitter<void>();
  @Output() sucursalCreada = new EventEmitter<any>();

  form: FormGroup;
  departamentos: string[] = [];
  municipios: string[] = [];
  paisSeleccionado: string = 'El Salvador';
  departamentoSeleccionado: string = '';

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
      this.form.get('municipio')?.setValue('');
    });
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
      this.sucursalCreada.emit(sucursal);
    }
  }
}

