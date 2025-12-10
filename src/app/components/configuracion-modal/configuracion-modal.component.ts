import { Component, OnInit, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { DteService } from '../../services/dte.service';
import { first, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-configuracion-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './configuracion-modal.component.html',
  styleUrl: './configuracion-modal.component.scss'
})
export class ConfiguracionModalComponent implements OnInit {
  @Input() empresaSeleccionada: any = null;
  @Output() cerrar = new EventEmitter<void>();

  seccionActiva: 'perfil' | 'empresa' | 'suscripcion' = 'perfil';
  
  // Formularios
  perfilForm: FormGroup;
  empresaForm: FormGroup;
  
  // Estados de secciones colapsables
  miCuentaExpandida = true;
  infoPersonalExpandida = false;
  infoProfesionalExpandida = false;
  preferenciasExpandida = false;
  
  identidadLegalExpandida = true;
  casaMatrizExpandida = false;
  infoGeneralExpandida = false;
  integracionHaciendaExpandida = false;

  usuarioActual: any = null;
  loading = false;

  zonasHorarias = [
    'El Salvador (GMT-6)',
    'Guatemala (GMT-6)',
    'Honduras (GMT-6)',
    'Nicaragua (GMT-6)',
    'Costa Rica (GMT-6)',
    'Panamá (GMT-5)',
    'México (GMT-6)',
    'Estados Unidos - Central (GMT-6)'
  ];

  roles = [
    'PROPIETARIO',
    'ADMINISTRADOR',
    'CONTADOR',
    'ENCARGADO',
    'AUDITOR',
    'FACTURADOR'
  ];

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private dteService: DteService
  ) {
    // Formulario de Perfil
    this.perfilForm = this.fb.group({
      nombre: ['', Validators.required],
      correo: ['', [Validators.required, Validators.email]],
      telefono: [''],
      rol: ['PROPIETARIO'],
      zonaHoraria: ['El Salvador (GMT-6)']
    });

    // Formulario de Empresa
    this.empresaForm = this.fb.group({
      nombreLegal: ['', Validators.required],
      nombreComercial: [''],
      nit: ['', Validators.required],
      nrc: [''],
      dui: [''],
      actividadEconomicaPrimaria: [''],
      actividadEconomicaSecundaria: [''],
      actividadEconomicaTerciaria: [''],
      direccion: [''],
      codigoMH: [''],
      puntosVenta: [1, [Validators.required, Validators.min(1)]],
      sitioWeb: [''],
      telefono: [''],
      correo: ['', Validators.email],
      certificadoPrueba: [''],
      passwordAPIPrueba: [''],
      certificadoProduccion: [''],
      passwordAPIProduccion: ['']
    });
  }

  ngOnInit(): void {
    this.cargarUsuarioActual();
    this.cargarDatosEmpresa();
    this.cargarDatosUsuario();
  }

  cargarUsuarioActual(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.usuarioActual = user;
      this.authService.getUserProfile(user.id).subscribe(profile => {
        if (profile) {
          this.perfilForm.patchValue({
            nombre: profile.displayName || '',
            correo: profile.email || ''
          });
        }
      });
    }
  }

  cargarDatosEmpresa(): void {
    if (this.empresaSeleccionada && this.empresaSeleccionada.id) {
      // Cargar datos desde la base de datos
      this.dteService.getEmpresaConfig(this.empresaSeleccionada.id).subscribe(config => {
        if (config) {
          this.empresaForm.patchValue(config);
        } else {
          // Si no hay configuración guardada, usar datos de empresa seleccionada
          this.empresaForm.patchValue({
            nombreLegal: this.empresaSeleccionada.nombreLegal || this.empresaSeleccionada.nombre || '',
            nombreComercial: this.empresaSeleccionada.nombreComercial || '',
            nit: this.empresaSeleccionada.nit || '',
            nrc: this.empresaSeleccionada.nrc || '',
            direccion: this.empresaSeleccionada.direccion || '',
            codigoMH: this.empresaSeleccionada.codigoMH || '',
            puntosVenta: this.empresaSeleccionada.puntosVenta || 1,
            sitioWeb: this.empresaSeleccionada.website || '',
            telefono: this.empresaSeleccionada.telefono || '',
            correo: this.empresaSeleccionada.email || ''
          });
        }
      });
    }
  }

  cargarDatosUsuario(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.dteService.getUserConfig(user.id).subscribe(config => {
        if (config) {
          this.perfilForm.patchValue({
            telefono: config.telefono || '',
            zonaHoraria: config.zonaHoraria || 'El Salvador (GMT-6)',
            rol: config.rol || 'PROPIETARIO'
          });
        }
      });
    }
  }

  cambiarSeccion(seccion: 'perfil' | 'empresa' | 'suscripcion'): void {
    this.seccionActiva = seccion;
  }

  toggleSeccion(seccion: string): void {
    switch(seccion) {
      case 'miCuenta':
        this.miCuentaExpandida = !this.miCuentaExpandida;
        break;
      case 'infoPersonal':
        this.infoPersonalExpandida = !this.infoPersonalExpandida;
        break;
      case 'infoProfesional':
        this.infoProfesionalExpandida = !this.infoProfesionalExpandida;
        break;
      case 'preferencias':
        this.preferenciasExpandida = !this.preferenciasExpandida;
        break;
      case 'identidadLegal':
        this.identidadLegalExpandida = !this.identidadLegalExpandida;
        break;
      case 'casaMatriz':
        this.casaMatrizExpandida = !this.casaMatrizExpandida;
        break;
      case 'infoGeneral':
        this.infoGeneralExpandida = !this.infoGeneralExpandida;
        break;
      case 'integracionHacienda':
        this.integracionHaciendaExpandida = !this.integracionHaciendaExpandida;
        break;
    }
  }

  guardarPerfil(): void {
    if (this.perfilForm.invalid) {
      this.perfilForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    const user = this.authService.getCurrentUser();
    
    if (user) {
      // Actualizar nombre en perfil de usuario
      this.authService.updateProfile(user.id, {
        displayName: this.perfilForm.value.nombre
      }).subscribe({
        next: () => {
          // Guardar configuración adicional
          this.dteService.saveUserConfig(user.id, {
            telefono: this.perfilForm.value.telefono,
            zonaHoraria: this.perfilForm.value.zonaHoraria,
            rol: this.perfilForm.value.rol
          }).subscribe({
            next: () => {
              this.loading = false;
              alert('Perfil actualizado correctamente');
            },
            error: (error) => {
              this.loading = false;
              alert('Error al guardar la configuración: ' + error.message);
            }
          });
        },
        error: (error) => {
          this.loading = false;
          alert('Error al actualizar el perfil: ' + error.message);
        }
      });
    }
  }

  guardarEmpresa(): void {
    if (this.empresaForm.invalid) {
      this.empresaForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    
    if (this.empresaSeleccionada && this.empresaSeleccionada.id) {
      this.dteService.saveEmpresaConfig(this.empresaSeleccionada.id, {
        nombreLegal: this.empresaForm.value.nombreLegal,
        nombreComercial: this.empresaForm.value.nombreComercial,
        nit: this.empresaForm.value.nit,
        nrc: this.empresaForm.value.nrc,
        dui: this.empresaForm.value.dui,
        actividadEconomicaPrimaria: this.empresaForm.value.actividadEconomicaPrimaria,
        actividadEconomicaSecundaria: this.empresaForm.value.actividadEconomicaSecundaria,
        actividadEconomicaTerciaria: this.empresaForm.value.actividadEconomicaTerciaria,
        direccion: this.empresaForm.value.direccion,
        codigoMH: this.empresaForm.value.codigoMH,
        puntosVenta: this.empresaForm.value.puntosVenta,
        sitioWeb: this.empresaForm.value.sitioWeb,
        telefono: this.empresaForm.value.telefono,
        correo: this.empresaForm.value.correo,
        certificadoPrueba: this.empresaForm.value.certificadoPrueba,
        passwordAPIPrueba: this.empresaForm.value.passwordAPIPrueba,
        certificadoProduccion: this.empresaForm.value.certificadoProduccion,
        passwordAPIProduccion: this.empresaForm.value.passwordAPIProduccion
      }).subscribe({
        next: () => {
          this.loading = false;
          alert('Información de empresa guardada correctamente');
        },
        error: (error) => {
          this.loading = false;
          alert('Error al guardar la información: ' + error.message);
        }
      });
    } else {
      this.loading = false;
      alert('No se ha seleccionado una empresa');
    }
  }

  cerrarModal(): void {
    this.cerrar.emit();
  }
}
