import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DteService } from '../../services/dte.service';
import { Empresa } from '../../models/empresa.model';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent implements OnInit {
  empresas: Empresa[] = [];
  empresaSeleccionada: Empresa | null = null;
  mostrarSelectorEmpresa: boolean = false;

  constructor(private dteService: DteService, private router: Router) {
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
    if (destino === 'clientes') {
      this.router.navigateByUrl('/clientes');
      return;
    }
  }

  irAInicio(): void {
    this.router.navigateByUrl('/dtes');
  }

  salir(): void {
    this.mostrarSelectorEmpresa = false;
    this.router.navigateByUrl('/login');
  }
}

