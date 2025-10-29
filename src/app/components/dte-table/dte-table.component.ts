import { Component, EventEmitter, Input, OnInit, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DTE } from '../../models/dte.model';
import { DteFiltersComponent, FiltrosDTE } from '../dte-filters/dte-filters.component';
import { DteRowMenuComponent } from '../dte-row-menu/dte-row-menu.component';

@Component({
  selector: 'app-dte-table',
  standalone: true,
  imports: [CommonModule, DteFiltersComponent, DteRowMenuComponent],
  templateUrl: './dte-table.component.html',
  styleUrl: './dte-table.component.scss'
})
export class DteTableComponent implements OnInit, OnChanges {
  @Input() dtes: DTE[] = [];
  @Input() itemsPerPage: number = 15;
  @Output() eliminarDTE = new EventEmitter<DTE>();
  @Output() exportarPDF = new EventEmitter<DTE>();
  @Output() exportarJSON = new EventEmitter<DTE>();
  @Output() verDetalles = new EventEmitter<DTE>();
  @Output() filtrosAplicados = new EventEmitter<FiltrosDTE>();

  paginaActual: number = 1;
  dtesPaginados: DTE[] = [];
  totalPaginas: number = 1;
  mostrarFiltros: boolean = false;
  filtros: FiltrosDTE = {};
  filaHover: DTE | null = null;
  filaHoverElement: HTMLElement | null = null;

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

  toggleFiltros(): void {
    this.mostrarFiltros = !this.mostrarFiltros;
  }

  cerrarFiltros(): void {
    this.mostrarFiltros = false;
  }

  aplicarFiltros(filtros: FiltrosDTE): void {
    this.filtros = filtros;
    this.filtrosAplicados.emit(filtros);
  }

  cancelarFiltros(): void {
    this.filtros = {};
  }

  onMouseEnter(dte: DTE, event: MouseEvent): void {
    this.filaHover = dte;
    this.filaHoverElement = (event.currentTarget as HTMLElement);
  }

  onMouseLeave(): void {
    // El menú se ocultará automáticamente cuando el mouse salga
    setTimeout(() => {
      if (this.filaHoverElement) {
        const menu = document.querySelector('.row-menu');
        if (!menu || !menu.matches(':hover')) {
          this.filaHover = null;
          this.filaHoverElement = null;
        }
      }
    }, 100);
  }
}
