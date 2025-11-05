import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PeriodoTributario } from '../../models/periodo-tributario.model';
import { DatePickerComponent } from '../../components/date-picker/date-picker.component';

@Component({
  selector: 'app-reportes-page',
  standalone: true,
  imports: [
    CommonModule,
    DatePickerComponent
  ],
  templateUrl: './reportes-page.component.html',
  styleUrl: './reportes-page.component.scss'
})
export class ReportesPageComponent implements OnInit {
  tabActiva: 'dtes' | 'anexos' | 'libro-iva' | 'reportes' = 'dtes';
  periodoSeleccionado: PeriodoTributario;
  mostrarSelectorPeriodo = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.periodoSeleccionado = PeriodoTributario.ahora();
  }

  ngOnInit(): void {
    // Detectar el tab activo desde query params si existe
    this.route.queryParams.subscribe(params => {
      if (params['activeTab'] && ['dtes', 'anexos', 'libro-iva', 'reportes'].includes(params['activeTab'])) {
        this.tabActiva = params['activeTab'];
      }
    });
  }

  cambiarTab(tab: 'dtes' | 'anexos' | 'libro-iva' | 'reportes'): void {
    this.tabActiva = tab;
    // Actualizar la URL con el query param sin recargar la página
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { activeTab: tab },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  toggleSelectorPeriodo(): void {
    this.mostrarSelectorPeriodo = !this.mostrarSelectorPeriodo;
  }

  onPeriodoSeleccionado(periodo: PeriodoTributario): void {
    this.periodoSeleccionado = periodo;
    this.mostrarSelectorPeriodo = false;
    // Aquí podrías cargar los datos del período seleccionado
    // this.cargarDatos();
  }

  limpiarPeriodo(): void {
    this.periodoSeleccionado = PeriodoTributario.ahora();
    // this.cargarDatos();
  }

  @HostListener('document:click', ['$event'])
  clickOutside(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.periodo-container')) {
      this.mostrarSelectorPeriodo = false;
    }
  }
}

