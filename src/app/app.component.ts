import { Component, OnInit, HostListener } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './components/header/header.component';
import { DteTabsComponent, TipoTab } from './components/dte-tabs/dte-tabs.component';
import { DteTableComponent } from './components/dte-table/dte-table.component';
import { DteService } from './services/dte.service';
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

  constructor(private dteService: DteService, private router: Router) {
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
    this.cargarDTEs();
    this.cargarTiposDTE();
  }

  cargarTiposDTE(): void {
    this.dteService.getTiposDTE().subscribe(tipos => {
      this.tiposDTE = tipos;
    });
  }

  cargarDTEs(): void {
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
}
