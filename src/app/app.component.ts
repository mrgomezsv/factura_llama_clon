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

  constructor(private dteService: DteService, private router: Router) {
    this.periodoSeleccionado = PeriodoTributario.ahora();
    this.isLoginRoute = this.isAuthRoute(this.router.url);
    this.router.events.subscribe(evt => {
      if (evt instanceof NavigationEnd) {
        this.isLoginRoute = this.isAuthRoute(evt.urlAfterRedirects);
      }
    });
  }

  private isAuthRoute(url: string): boolean {
    return url.startsWith('/login') || url.startsWith('/forgot-password') || url.startsWith('/sign-up');
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
