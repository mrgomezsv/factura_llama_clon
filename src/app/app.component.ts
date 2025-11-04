import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './components/header/header.component';
import { DteTabsComponent, TipoTab } from './components/dte-tabs/dte-tabs.component';
import { DteTableComponent } from './components/dte-table/dte-table.component';
import { DteService } from './services/dte.service';
import { DTE } from './models/dte.model';
import { PeriodoTributario } from './models/periodo-tributario.model';
import { UpgradeModalComponent } from './components/upgrade-modal/upgrade-modal.component';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    CommonModule,
    HeaderComponent,
    DteTabsComponent,
    DteTableComponent,
    UpgradeModalComponent
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
    const hideRoutes = ['/clientes', '/login', '/forgot-password', '/sign-up', '/terminos-y-condiciones'];
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

  onPeriodoCambiado(periodo: PeriodoTributario): void {
    this.periodoSeleccionado = periodo;
    this.cargarDTEs();
  }
}
