import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DteService } from '../../services/dte.service';
import { Empresa } from '../../models/empresa.model';
import { PeriodoTributario } from '../../models/periodo-tributario.model';
import { DatePickerComponent } from '../date-picker/date-picker.component';
import { GenerateDteMenuComponent } from '../generate-dte-menu/generate-dte-menu.component';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, DatePickerComponent, GenerateDteMenuComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {
  @Output() periodoCambiado = new EventEmitter<PeriodoTributario>();
  
  empresas: Empresa[] = [];
  empresaSeleccionada: Empresa | null = null;
  periodoSeleccionado: PeriodoTributario;
  mostrarSelectorEmpresa: boolean = false;
  mostrarSelectorPeriodo: boolean = false;

  constructor(private dteService: DteService, private router: Router) {
    this.periodoSeleccionado = PeriodoTributario.ahora();
  }

  ngOnInit(): void {
    this.cargarEmpresas();
  }

  cargarEmpresas(): void {
    this.dteService.getEmpresas().subscribe(empresas => {
      this.empresas = empresas;
      if (empresas.length > 0) {
        this.empresaSeleccionada = empresas[0];
      }
    });
  }

  seleccionarEmpresa(empresa: Empresa): void {
    this.empresaSeleccionada = empresa;
    this.mostrarSelectorEmpresa = false;
  }

  toggleSelectorEmpresa(): void {
    this.mostrarSelectorEmpresa = !this.mostrarSelectorEmpresa;
    this.mostrarSelectorPeriodo = false;
  }

  toggleSelectorPeriodo(): void {
    this.mostrarSelectorPeriodo = !this.mostrarSelectorPeriodo;
    this.mostrarSelectorEmpresa = false;
  }

  onPeriodoSeleccionado(periodo: PeriodoTributario): void {
    this.periodoSeleccionado = periodo;
    this.mostrarSelectorPeriodo = false;
    this.periodoCambiado.emit(periodo);
  }

  navegar(destino: string): void {
    this.mostrarSelectorEmpresa = false;
    if (destino === 'login') {
      this.router.navigateByUrl('/login');
      return;
    }
    if (destino === 'factura') {
      this.router.navigateByUrl('/factura/nueva');
      return;
    }
  }

  salir(): void {
    this.mostrarSelectorEmpresa = false;
    this.router.navigateByUrl('/login');
  }
}

