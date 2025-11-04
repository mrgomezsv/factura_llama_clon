import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DteService } from '../../services/dte.service';
import { TipoDTE } from '../../models/tipo-dte.model';

@Component({
  selector: 'app-generate-dte-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './generate-dte-menu.component.html',
  styleUrl: './generate-dte-menu.component.scss'
})
export class GenerateDteMenuComponent implements OnInit {
  mostrarMenu: boolean = false;
  tiposDTE: TipoDTE[] = [];

  constructor(private dteService: DteService, private router: Router) {}

  ngOnInit(): void {
    this.cargarTiposDTE();
  }

  cargarTiposDTE(): void {
    this.dteService.getTiposDTE().subscribe(tipos => {
      this.tiposDTE = tipos;
    });
  }

  toggleMenu(): void {
    this.mostrarMenu = !this.mostrarMenu;
  }

  cerrarMenu(): void {
    this.mostrarMenu = false;
  }

  seleccionarTipo(tipo: TipoDTE): void {
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
      this.cerrarMenu();
    }
  }
}

