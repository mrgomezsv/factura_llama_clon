import { Component, EventEmitter, HostListener, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import paisesData from '../../data/paises-mock.json';
import departamentosMunicipiosData from '../../data/departamentos-municipios-mock.json';
import actividadesEconomicasData from '../../data/actividades-economicas-mock.json';

@Component({
  selector: 'app-crear-cliente-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './crear-cliente-modal.component.html',
  styleUrl: './crear-cliente-modal.component.scss'
})
export class CrearClienteModalComponent implements OnInit {
  @Output() cerrar = new EventEmitter<void>();
  @Output() clienteCreado = new EventEmitter<any>();

  form: FormGroup;
  paises: string[] = [];
  departamentos: string[] = [];
  municipios: string[] = [];
  actividadesEconomicas: string[] = [];
  actividadesEconomicasFiltradas: string[] = [];
  paisSeleccionado: string = '';
  departamentoSeleccionado: string = '';
  mostrarActividadesDropdown = false;

  tiposPersona = ['NATURAL', 'JURIDICA'];
  clasificacionesTributarias = ['OTROS', 'MEDIANO', 'GRANDE'];
  tiposDocumento = ['DUI', 'NIT', 'Pasaporte', 'Carnet de Residente', 'Otro'];

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      nombre: ['', Validators.required],
      alias: [''],
      nombreComercial: [''],
      correoElectronico: ['', [Validators.required, Validators.email]],
      telefono: [''],
      tipoPersona: ['NATURAL', Validators.required],
      clasificacionTributaria: ['OTROS', Validators.required],
      esSujetoExcluido: [false],
      tipoDocumento: ['', Validators.required],
      numeroDocumento: ['', Validators.required],
      nrc: [''],
      actividadEconomica: [''],
      pais: ['El Salvador', Validators.required],
      departamento: ['', Validators.required],
      municipio: ['', Validators.required],
      direccion: ['']
    });

    this.paises = paisesData.sort();
    this.actividadesEconomicas = actividadesEconomicasData.sort();
    this.actividadesEconomicasFiltradas = this.actividadesEconomicas.slice();
  }

  ngOnInit(): void {
    this.form.get('pais')?.valueChanges.subscribe(pais => {
      this.paisSeleccionado = pais;
      this.cargarDepartamentos(pais);
      this.form.get('departamento')?.setValue('');
      this.form.get('municipio')?.setValue('');
    });

    this.form.get('departamento')?.valueChanges.subscribe(depto => {
      this.departamentoSeleccionado = depto;
      this.cargarMunicipios(this.paisSeleccionado, depto);
      this.form.get('municipio')?.setValue('');
    });

    // Cargar departamentos iniciales para El Salvador
    this.cargarDepartamentos('El Salvador');
  }

  @HostListener('document:click', ['$event'])
  clickOutside(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown-actividad-container')) {
      this.mostrarActividadesDropdown = false;
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

  filtrarActividadesEconomicas(busqueda: string): void {
    const q = busqueda.toLowerCase();
    this.actividadesEconomicasFiltradas = this.actividadesEconomicas.filter(actividad =>
      actividad.toLowerCase().includes(q)
    );
    this.mostrarActividadesDropdown = true;
  }

  seleccionarActividadEconomica(actividad: string): void {
    this.form.get('actividadEconomica')?.setValue(actividad);
    this.mostrarActividadesDropdown = false;
  }

  cerrarModal(): void {
    this.cerrar.emit();
  }

  crearCliente(): void {
    if (this.form.valid) {
      const cliente = {
        ...this.form.value,
        fechaCreacion: new Date().toLocaleString('es-SV')
      };
      this.clienteCreado.emit(cliente);
    }
  }
}

