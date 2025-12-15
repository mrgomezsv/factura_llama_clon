import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DteService } from '../../services/dte.service';
import { TipoDTE } from '../../models/tipo-dte.model';
import { AuthService } from '../../services/auth.service';
import { NotificacionModalComponent } from '../notificacion-modal/notificacion-modal.component';

@Component({
  selector: 'app-generate-dte-menu',
  standalone: true,
  imports: [CommonModule, NotificacionModalComponent],
  templateUrl: './generate-dte-menu.component.html',
  styleUrl: './generate-dte-menu.component.scss'
})
export class GenerateDteMenuComponent implements OnInit {
  mostrarMenu: boolean = false;
  tiposDTE: TipoDTE[] = [];
  empresaConfig: any = null;

  // Estado del modal de notificación
  mostrarNotificacion = false;
  tipoNotificacion: 'exito' | 'error' = 'error';
  tituloNotificacion = '';
  mensajeNotificacion = '';

  constructor(
    private dteService: DteService,
    private router: Router,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.cargarTiposDTE();
    this.cargarConfiguracion();
  }

  cargarTiposDTE(): void {
    this.dteService.getTiposDTE().subscribe(tipos => {
      this.tiposDTE = tipos;
    });
  }

  cargarConfiguracion(): void {
    const user = this.authService.getCurrentUser();
    if (user && user.empresaId) {
      this.dteService.getEmpresaConfig(user.empresaId).subscribe(config => {
        this.empresaConfig = config;
      });
    }
  }

  toggleMenu(): void {
    this.mostrarMenu = !this.mostrarMenu;
  }

  cerrarMenu(): void {
    this.mostrarMenu = false;
  }

  seleccionarTipo(tipo: TipoDTE): void {
    if (tipo.habilitado) {
      // Validar configuración de ambiente
      if (this.empresaConfig) {
        const tieneAmbienteActivo = this.empresaConfig.ambientePruebasActivo === 1 ||
          this.empresaConfig.ambienteProduccionActivo === 1;

        if (!tieneAmbienteActivo) {
          this.mostrarNotificacionError(
            'Configuración Incompleta',
            'Aún no ha ingresado los Datos clave para la conexión con el Ministerio de Hacienda. Comuníquese con un Administrador ya que solo administradores pueden editar estos campos.'
          );
          this.cerrarMenu();
          return;
        }
      }

      if (tipo.codigo === 'FAC') {
        this.router.navigateByUrl('/factura/nueva');
      } else if (tipo.codigo === 'CCF') {
        this.router.navigateByUrl('/comprobante-credito-fiscal/nueva');
      } else if (tipo.codigo === 'NCR') {
        this.router.navigateByUrl('/nota-credito/nueva');
      } else if (tipo.codigo === 'NDB') {
        this.router.navigateByUrl('/nota-debito/nueva');
      } else if (tipo.codigo === 'FSE') {
        this.router.navigateByUrl('/factura-sujeto-excluido/nueva');
      } else if (tipo.codigo === 'FEX') {
        this.router.navigateByUrl('/factura-exportacion/nueva');
      } else if (tipo.codigo === 'REM') {
        this.router.navigateByUrl('/nota-remision/nueva');
      } else if (tipo.codigo === 'CRT') {
        this.router.navigateByUrl('/comprobante-retencion/nueva');
      }
      this.cerrarMenu();
    }
  }

  mostrarNotificacionError(titulo: string, mensaje: string): void {
    this.tipoNotificacion = 'error';
    this.tituloNotificacion = titulo;
    this.mensajeNotificacion = mensaje;
    this.mostrarNotificacion = true;
  }

  cerrarNotificacion(): void {
    this.mostrarNotificacion = false;
  }
}

