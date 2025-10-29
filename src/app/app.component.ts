import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './components/header/header.component';
import { DteTabsComponent, TipoTab } from './components/dte-tabs/dte-tabs.component';
import { DteTableComponent } from './components/dte-table/dte-table.component';
import { DteService } from './services/dte.service';
import { DTE } from './models/dte.model';
import { PeriodoTributario } from './models/periodo-tributario.model';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    CommonModule,
    HeaderComponent,
    DteTabsComponent,
    DteTableComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'TecWaveLlama';
  dtes: DTE[] = [];
  tabActiva: TipoTab = 'enviados';
  periodoSeleccionado: PeriodoTributario;

  constructor(private dteService: DteService) {
    this.periodoSeleccionado = PeriodoTributario.ahora();
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
    this.tabActiva = tab;
    this.cargarDTEs();
  }

  onPeriodoCambiado(periodo: PeriodoTributario): void {
    this.periodoSeleccionado = periodo;
    this.cargarDTEs();
  }
}
