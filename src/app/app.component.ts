import { Component, OnInit, HostListener } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { HeaderComponent } from './components/header/header.component';
import { DteTabsComponent, TipoTab } from './components/dte-tabs/dte-tabs.component';
import { DteTableComponent } from './components/dte-table/dte-table.component';
import { DteService } from './services/dte.service';
import { AuthService } from './services/auth.service';
import { DTE } from './models/dte.model';
import { PeriodoTributario } from './models/periodo-tributario.model';
import { UpgradeModalComponent } from './components/upgrade-modal/upgrade-modal.component';
import { DatePickerComponent } from './components/date-picker/date-picker.component';
import { TipoDTE } from './models/tipo-dte.model';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    CommonModule,
    HeaderComponent,
    DteTabsComponent,
    DteTableComponent,
    UpgradeModalComponent,
    DatePickerComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'WaveDTE-v2';
  dtes: DTE[] = [];
  tabActiva: TipoTab = 'enviados';
  periodoSeleccionado: PeriodoTributario;
  mostrarUpgrade = false;
  isLoginRoute = false;
  showMainLayout = true;
  showDTEsContent = true;
  mostrarSelectorPeriodo = false;
  mostrarMenuDTE = false;
  tiposDTE: TipoDTE[] = [];

  constructor(
    private dteService: DteService,
    private authService: AuthService,
    private router: Router,
    private http: HttpClient
  ) {
    this.periodoSeleccionado = PeriodoTributario.ahora();
    this.isLoginRoute = this.isAuthRoute(this.router.url);
    this.showMainLayout = this.shouldShowMainLayout(this.router.url);
    this.showDTEsContent = this.shouldShowDTEsContent(this.router.url);
    this.router.events.subscribe(evt => {
      if (evt instanceof NavigationEnd) {
        this.isLoginRoute = this.isAuthRoute(evt.urlAfterRedirects);
        this.showMainLayout = this.shouldShowMainLayout(evt.urlAfterRedirects);
        this.showDTEsContent = this.shouldShowDTEsContent(evt.urlAfterRedirects);
      }
    });
  }

  private isAuthRoute(url: string): boolean {
    return url.startsWith('/login') || url.startsWith('/forgot-password') || url.startsWith('/sign-up') || url.startsWith('/terminos-y-condiciones');
  }

  private shouldShowMainLayout(url: string): boolean {
    // Ocultar layout principal solo en rutas de autenticación
    const hideRoutes = ['/login', '/forgot-password', '/sign-up', '/terminos-y-condiciones'];
    return !hideRoutes.some(route => url.startsWith(route));
  }

  private shouldShowDTEsContent(url: string): boolean {
    // Mostrar tabs y tabla de DTEs solo cuando NO estamos en rutas específicas
    const hideRoutes = ['/clientes', '/sucursales', '/productos', '/reports', '/login', '/forgot-password', '/sign-up', '/terminos-y-condiciones'];
    // También ocultar en rutas de creación de DTEs
    const hideDTEsRoutes = ['/factura', '/comprobante-credito-fiscal', '/nota-credito', '/nota-debito', '/factura-sujeto-excluido', '/factura-exportacion', '/nota-remision', '/comprobante-retencion'];
    // Si la URL es solo '/' o '/dtes' o '/home', mostrar el contenido de DTEs
    if (url === '/' || url === '/dtes' || url === '/home') {
      return true;
    }
    return !hideRoutes.some(route => url.startsWith(route)) && !hideDTEsRoutes.some(route => url.startsWith(route));
  }

  ngOnInit(): void {
    // Suscribirse al estado de autenticación para cargar datos solo cuando el usuario esté logueado
    this.authService.isAuthenticated().subscribe(isAuth => {
      if (isAuth) {
        this.cargarDTEs();
        this.cargarTiposDTE();
      }
    });

    // Escuchar cambios de ruta para actualizar UI (isLoginRoute, layout, etc)
    this.router.events.subscribe(evt => {
      if (evt instanceof NavigationEnd) {
        this.isLoginRoute = this.isAuthRoute(evt.urlAfterRedirects);
        this.showMainLayout = this.shouldShowMainLayout(evt.urlAfterRedirects);
        this.showDTEsContent = this.shouldShowDTEsContent(evt.urlAfterRedirects);

        // Recargar DTEs si estamos en la vista principal y no en login/auth
        if (!this.isLoginRoute && this.showDTEsContent) {
          this.cargarDTEs();
        }
      }
    });
  }

  cargarTiposDTE(): void {
    // Evitar cargar si estamos en login
    if (this.isLoginRoute) return;

    this.dteService.getTiposDTE().subscribe(tipos => {
      this.dtes = []; // Limpiar si es necesario, aunque mejor no
      this.tiposDTE = tipos;
    });
  }

  cargarDTEs(): void {
    // Evitar cargar si estamos en login
    if (this.isLoginRoute) return;

    this.dteService.getDTEs({
      tipoTab: this.tabActiva,
      periodo: this.periodoSeleccionado
    }).subscribe(dtes => {
      this.dtes = dtes;
    });
  }

  onTabCambiada(tab: TipoTab): void {
    if (tab === 'recibidos') {
      // Mostrar modal de upgrade y mantener la vista en "Enviados"
      this.mostrarUpgrade = true;
      return;
    }
    this.tabActiva = tab;
    this.cargarDTEs();
  }

  cerrarUpgrade(): void {
    this.mostrarUpgrade = false;
    // Reafirmar la pestaña activa como enviados para el hijo
    this.tabActiva = 'enviados';
  }

  toggleSelectorPeriodo(): void {
    this.mostrarSelectorPeriodo = !this.mostrarSelectorPeriodo;
    this.mostrarMenuDTE = false;
  }

  onPeriodoSeleccionado(periodo: PeriodoTributario): void {
    this.periodoSeleccionado = periodo;
    this.mostrarSelectorPeriodo = false;
    this.cargarDTEs();
  }

  toggleMenuDTE(): void {
    this.mostrarMenuDTE = !this.mostrarMenuDTE;
    this.mostrarSelectorPeriodo = false;
  }

  cerrarMenuDTE(): void {
    this.mostrarMenuDTE = false;
  }

  seleccionarTipoDTE(tipo: TipoDTE): void {
    if (tipo.habilitado) {
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
      this.cerrarMenuDTE();
    }
  }

  @HostListener('document:click', ['$event'])
  clickOutside(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.periodo-container')) {
      this.mostrarSelectorPeriodo = false;
    }
    if (!target.closest('.generate-menu-container')) {
      this.mostrarMenuDTE = false;
    }
  }

  onExportarPDF(dte: DTE): void {
    if (!dte.id) {
      alert('Error: DTE no tiene ID');
      return;
    }

    this.http.get(`http://localhost:3000/api/dtes/${dte.id}/pdf`, {
      responseType: 'blob'
    }).subscribe({
      next: (pdfBlob: Blob) => {
        const url = window.URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `DTE-${dte.numeroControl || dte.controlNumber || dte.id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error al descargar PDF:', error);
        alert('Error al descargar el PDF: ' + (error.error?.error || error.message || 'Error desconocido'));
      }
    });
  }

  onExportarJSON(dte: DTE): void {
    if (!dte.id) {
      alert('Error: DTE no tiene ID');
      return;
    }

    this.dteService.getDTEJSON(dte.id).subscribe({
      next: (dteJson: any) => {
        const jsonStr = JSON.stringify(dteJson, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `DTE-${dte.numeroControl || dte.controlNumber || dte.id}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        console.error('Error al descargar JSON:', error);
        alert('Error al descargar el JSON: ' + (error.error?.error || error.message || 'Error desconocido'));
      }
    });
  }

  onEliminarDTE(dte: DTE): void {
    if (confirm(`¿Está seguro de eliminar el DTE ${dte.controlNumber || dte.numeroControl}?`)) {
      // TODO: Implementar eliminación
      console.log('Eliminar DTE:', dte);
      alert('Funcionalidad de eliminación pendiente de implementar');
    }
  }

  onVerDetalles(dte: DTE): void {
    // TODO: Implementar vista de detalles
    console.log('Ver detalles DTE:', dte);
    alert('Funcionalidad de detalles pendiente de implementar');
  }
}
