import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DTE } from '../../models/dte.model';

@Component({
  selector: 'app-dte-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dte-table.component.html',
  styleUrl: './dte-table.component.scss'
})
export class DteTableComponent implements OnInit, OnChanges {
  @Input() dtes: DTE[] = [];
  @Input() itemsPerPage: number = 15;

  paginaActual: number = 1;
  dtesPaginados: DTE[] = [];
  totalPaginas: number = 1;

  ngOnInit(): void {
    this.actualizarPaginacion();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dtes'] || changes['itemsPerPage']) {
      this.paginaActual = 1;
      this.actualizarPaginacion();
    }
  }

  actualizarPaginacion(): void {
    this.totalPaginas = Math.ceil(this.dtes.length / this.itemsPerPage);
    
    const inicio = (this.paginaActual - 1) * this.itemsPerPage;
    const fin = inicio + this.itemsPerPage;
    this.dtesPaginados = this.dtes.slice(inicio, fin);
  }

  irAPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaActual = pagina;
      this.actualizarPaginacion();
    }
  }

  paginaAnterior(): void {
    if (this.paginaActual > 1) {
      this.irAPagina(this.paginaActual - 1);
    }
  }

  paginaSiguiente(): void {
    if (this.paginaActual < this.totalPaginas) {
      this.irAPagina(this.paginaActual + 1);
    }
  }

  get paginasVisibles(): number[] {
    const paginas: number[] = [];
    const maxVisible = 4;
    let inicio = Math.max(1, this.paginaActual - 1);
    let fin = Math.min(this.totalPaginas, inicio + maxVisible - 1);
    
    if (fin - inicio < maxVisible - 1) {
      inicio = Math.max(1, fin - maxVisible + 1);
    }
    
    for (let i = inicio; i <= fin; i++) {
      paginas.push(i);
    }
    
    return paginas;
  }
}

