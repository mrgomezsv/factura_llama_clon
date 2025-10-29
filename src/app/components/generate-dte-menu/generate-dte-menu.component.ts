import { Component, OnInit } from '@angular/core';
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

  constructor(private dteService: DteService) {}

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
      // TODO: Navegar a formulario de creación de DTE
      console.log('Generar DTE:', tipo);
      this.cerrarMenu();
    }
  }
}

