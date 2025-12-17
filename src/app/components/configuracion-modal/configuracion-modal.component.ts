import { Component, OnInit, EventEmitter, Output, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { DteService } from '../../services/dte.service';
import { Observable, of } from 'rxjs';
import { first, switchMap } from 'rxjs/operators';
import { NotificacionModalComponent } from '../notificacion-modal/notificacion-modal.component';

@Component({
  selector: 'app-configuracion-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NotificacionModalComponent],
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
  loadingRecuperacion = false;

  // Estado del modal de notificación
  mostrarNotificacion = false;
  tipoNotificacion: 'exito' | 'error' = 'exito';
  tituloNotificacion = '';
  mensajeNotificacion = '';

  // Estado de imagen de empresa
  empresaImagenPreview: string | null = null;
  empresaImagenArchivo: File | null = null;

  // Estado de certificados
  certPruebasFile: File | null = null;
  certProduccionFile: File | null = null;

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
      rol: ['PROPIETARIO', Validators.required],
      zonaHoraria: ['El Salvador (GMT-6)']
    });

    // Formulario de Empresa
    this.empresaForm = this.fb.group({
      nombreLegal: ['', Validators.required],
      nombreComercial: [''],
      nit: ['', Validators.required],
      nrc: ['', Validators.required],
      dui: [''],
      actividadEconomicaPrimaria: ['', Validators.required],
      actividadEconomicaSecundaria: [''],
      actividadEconomicaTerciaria: [''],
      direccion: ['', Validators.required],
      codigoMH: ['', Validators.required],
      puntosVenta: [1, [Validators.required, Validators.min(1)]],
      sitioWeb: [''],
      telefono: ['', Validators.required],
      correo: ['', [Validators.required, Validators.email]],
      certificadoPrueba: [''],
      passwordPriPrueba: [''],
      passwordPubPrueba: [''],
      certificadoProduccion: [''],
      passwordPriProduccion: [''],
      passwordPubProduccion: [''],
      ambientePruebasActivo: [true],
      ambienteProduccionActivo: [false]
    });
  }

  ngOnInit(): void {
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
          this.empresaForm.patchValue({
            ...config,
            ambientePruebasActivo: config.ambientePruebasActivo === 1,
            ambienteProduccionActivo: config.ambienteProduccionActivo === 1
          });
          // Cargar imagen desde la base de datos
          if (config.logoUrl) {
            this.empresaImagenPreview = config.logoUrl;
          } else if (this.empresaSeleccionada.logo) {
            // Fallback a logo en objeto empresa si no hay en DB
            this.empresaImagenPreview = this.empresaSeleccionada.logo;
          }
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
          // Cargar imagen si existe en objeto empresa
          if (this.empresaSeleccionada.logo) {
            this.empresaImagenPreview = this.empresaSeleccionada.logo;
          }
        }
      });
    }
  }

  onImagenEmpresaSeleccionada(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        this.mostrarNotificacionError('Error', 'Por favor, selecciona un archivo de imagen válido.');
        return;
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.mostrarNotificacionError('Error', 'La imagen no debe superar los 5MB.');
        return;
      }

      this.empresaImagenArchivo = file;

      // Crear preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.empresaImagenPreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  onCertificadoPruebasSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.certPruebasFile = input.files[0];
      // Actualizar validez del formulario (opcional, si se quiere validar que haya archivo)
      this.empresaForm.patchValue({ certificadoPrueba: this.certPruebasFile.name });
    }
  }

  onCertificadoProduccionSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.certProduccionFile = input.files[0];
      this.empresaForm.patchValue({ certificadoProduccion: this.certProduccionFile.name });
    }
  }

  abrirSelectorImagen(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: Event) => this.onImagenEmpresaSeleccionada(e);
    input.click();
  }

  eliminarImagen(): void {
    this.empresaImagenPreview = null;
    this.empresaImagenArchivo = null;
  }

  cargarDatosUsuario(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      // Primero asegurar nombre y correo del usuario actual
      if (!this.perfilForm.get('nombre')?.value) {
        this.perfilForm.patchValue({
          nombre: user.displayName || user.email || '',
          correo: user.email || ''
        });
      }

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
    switch (seccion) {
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
              this.mostrarNotificacionExito('Perfil actualizado correctamente');
            },
            error: (error) => {
              this.loading = false;
              this.mostrarNotificacionError('Error al guardar la configuración', error.message);
            }
          });
        },
        error: (error) => {
          this.loading = false;
          this.mostrarNotificacionError('Error al actualizar el perfil', error.message);
        }
      });
    }
  }

  guardarEmpresa(): void {
    if (this.empresaForm.invalid) {
      this.empresaForm.markAllAsTouched();
      return;
    }

    if (!this.empresaImagenPreview) {
      this.mostrarNotificacionError('Error', 'El logo de la empresa es obligatorio.');
      return;
    }

    this.loading = true;

    // Función auxiliar para subir certificados
    const uploadCertificates = (empresaId: string): Observable<any> => {
      const uploads: Observable<any>[] = [];

      if (this.certPruebasFile) {
        uploads.push(this.dteService.uploadCertificado(
          empresaId,
          this.certPruebasFile,
          'PRUEBAS',
          {
            passwordPriPrueba: this.empresaForm.value.passwordPriPrueba || '',
            passwordPubPrueba: this.empresaForm.value.passwordPubPrueba || ''
          }
        ));
      }

      if (this.certProduccionFile) {
        uploads.push(this.dteService.uploadCertificado(
          empresaId,
          this.certProduccionFile,
          'PRODUCCION',
          {
            passwordPriProduccion: this.empresaForm.value.passwordPriProduccion || '',
            passwordPubProduccion: this.empresaForm.value.passwordPubProduccion || ''
          }
        ));
      }

      if (uploads.length === 0) {
        return of(null);
      }

      // Ejecutar subidas en serie o paralelo (forkJoin para paralelo)
      // Importante: forkJoin requiere que todos los observables completen. http.post completa.
      // Usamos import { forkJoin } from 'rxjs'; que debe ser importado.
      // Como no puedo agregar imports facilmente aqui sin ver el top, usaré concatenación simple o asumiremos forkJoin disponible?
      // Mejor usamos una cadena de promesas o switchMap si fuera simple, pero son multiples.
      // Si no tengo forkJoin importado, puedo usar reduce.
      // Pero DteService ya usa RxJS. Asumiré que puedo encadenar.
      // Para simplificar y evitar errores de import, haré las llamadas una por una si existen, o simplemente
      // asumiré éxito y las lanzaré. Pero necesito esperar a que terminen.

      // Hack: Si no tengo forkJoin a mano, anidamos. Pero es feo.
      // Voy a asumir que puedo usar promesas convertidas ot simplemente devolver un observable combinado.
      // Re-ver imports: Observable, of, map, switchMap, first. Faltaba forkJoin.
      // Modificaré el archivo para incluir forkJoin en los imports primero si es necesario, 
      // pero `replace_file_content` es para un bloque.
      // Usaré una promesa convertida para manejar esto sin forkJoin o haré un "hack" de conteo.

      // Mejor estrategia: Hacer el save config PRIMERO (que es lo critico), y luego los ceritifcados en background 
      // y notificar al final.
      return new Observable(observer => {
        let completed = 0;
        let total = uploads.length;
        if (total === 0) {
          observer.next(null);
          observer.complete();
          return;
        }

        uploads.forEach(obs => {
          obs.subscribe({
            next: () => {
              completed++;
              if (completed === total) {
                observer.next(null);
                observer.complete();
              }
            },
            error: (err) => {
              console.error("Error subiendo certificado", err);
              // No bloqueamos el flujo principal por error en cert, pero notificamos?
              // Mejor fallar aqui.
              observer.error(err);
            }
          })
        });
      });
    };

    // Si no hay empresa seleccionada, crear una nueva
    if (!this.empresaSeleccionada || !this.empresaSeleccionada.id) {
      // Crear empresa primero
      this.dteService.saveEmpresa({
        nombre: this.empresaForm.value.nombreLegal || 'Mi Empresa',
        nit: this.empresaForm.value.nit || '',
        direccion: this.empresaForm.value.direccion || ''
      }).pipe(
        switchMap((empresaId: string) => {
          // Guardar configuración
          return this.dteService.saveEmpresaConfig(empresaId, this.getEmpresaConfigObj())
            .pipe(switchMap(() => uploadCertificates(empresaId)));
        })
      ).subscribe({
        next: () => {
          this.loading = false;
          this.mostrarNotificacionExito('Empresa creada y certificados guardados correctamente');
        },
        error: (error: any) => {
          this.loading = false;
          this.mostrarNotificacionError('Error al crear la empresa', error.message || error);
        }
      });
    } else {
      // Si hay empresa seleccionada
      const empresaId = this.empresaSeleccionada.id;
      this.dteService.saveEmpresaConfig(empresaId, this.getEmpresaConfigObj())
        .pipe(
          switchMap(() => uploadCertificates(empresaId))
        ).subscribe({
          next: () => {
            // Actualizar logo local
            if (this.empresaSeleccionada) {
              this.empresaSeleccionada.logo = this.empresaImagenPreview;
            }
            this.loading = false;
            this.mostrarNotificacionExito('Información y certificados guardados correctamente');
          },
          error: (error: any) => {
            this.loading = false;
            this.mostrarNotificacionError('Error al guardar', error.message || error);
          }
        });
    }
  }

  // Helper para construir el objeto de configuración
  private getEmpresaConfigObj(): any {
    return {
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
      logoUrl: this.empresaImagenPreview || undefined,
      // Enviamos el nombre del archivo como referencia, pero el archivo real se sube aparte
      certificadoPrueba: this.empresaForm.value.certificadoPrueba,
      passwordPriPrueba: this.empresaForm.value.passwordPriPrueba,
      passwordPubPrueba: this.empresaForm.value.passwordPubPrueba,
      certificadoProduccion: this.empresaForm.value.certificadoProduccion,
      passwordPriProduccion: this.empresaForm.value.passwordPriProduccion,
      passwordPubProduccion: this.empresaForm.value.passwordPubProduccion,
      ambientePruebasActivo: this.empresaForm.value.ambientePruebasActivo ? 1 : 0,
      ambienteProduccionActivo: this.empresaForm.value.ambienteProduccionActivo ? 1 : 0
    };
  }

  cerrarModal(): void {
    this.cerrar.emit();
  }

  mostrarNotificacionExito(mensaje: string, titulo: string = 'Éxito'): void {
    this.tipoNotificacion = 'exito';
    this.tituloNotificacion = titulo;
    this.mensajeNotificacion = mensaje;
    this.mostrarNotificacion = true;
  }

  mostrarNotificacionError(mensaje: string, detalle?: string, titulo: string = 'Error'): void {
    this.tipoNotificacion = 'error';
    this.tituloNotificacion = titulo;
    this.mensajeNotificacion = detalle ? `${mensaje}: ${detalle}` : mensaje;
    this.mostrarNotificacion = true;
  }

  cerrarNotificacion(): void {
    this.mostrarNotificacion = false;
    // Si es una notificación de éxito sobre empresa creada, cerrar también el modal de configuración
    if (this.tipoNotificacion === 'exito' &&
      (this.mensajeNotificacion.includes('Empresa creada') ||
        this.mensajeNotificacion.includes('guardada correctamente') ||
        this.mensajeNotificacion.includes('Información y certificados guardados correctamente'))) {
      this.cerrarModal();
    }
  }

  recuperarContrasena(): void {
    const user = this.authService.getCurrentUser();
    if (!user || !user.email) {
      this.mostrarNotificacionError('Error', 'No se pudo obtener el correo electrónico del usuario');
      return;
    }

    const email = user.email;
    this.loadingRecuperacion = true;

    this.authService.sendPasswordReset(email).subscribe({
      next: () => {
        this.loadingRecuperacion = false;
        this.mostrarNotificacionExito(
          `Se ha enviado un correo a ${email} con las instrucciones para restablecer tu contraseña.`,
          'Correo enviado'
        );
      },
      error: (error) => {
        this.loadingRecuperacion = false;
        this.mostrarNotificacionError(
          'Error al enviar el correo de recuperación',
          error.message || 'Ocurrió un error al enviar el correo'
        );
      }
    });
  }
}
