import { Component, EventEmitter, Input, OnInit, OnChanges, Output, SimpleChanges, HostListener } from '@angular/core';
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
  filaMenuAbierto: DTE | null = null;
  filaMenuAbiertoElement: HTMLElement | null = null;

  get totalItems(): number {
    return this.dtes.length;
  }

  get startItemIndex(): number {
    if (this.totalItems === 0) return 0;
    return (this.paginaActual - 1) * this.itemsPerPage + 1;
  }

  get endItemIndex(): number {
    return Math.min(this.paginaActual * this.itemsPerPage, this.totalItems);
  }

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

  /**
   * Convierte el nombre completo del tipo de documento a su abreviatura
   */
  getTipoAbreviado(tipo: string): string {
    const mapeoTipos: { [key: string]: string } = {
      'Factura': 'FC',
      'Comprobante de Crédito Fiscal': 'CCF',
      'Nota de Crédito': 'NC',
      'Nota de Débito': 'ND',
      'Factura de Sujeto Excluido': 'FSE',
      'Factura de Exportación': 'FEX',
      'Nota de Remisión': 'NR',
      'Comprobante de Retención': 'CRT',
      'Documento': 'DOC'
    };

    return mapeoTipos[tipo] || tipo;
  }

  /**
   * Alterna el menú de acciones para una fila específica
   */
  toggleMenuAcciones(dte: DTE, event: MouseEvent): void {
    event.stopPropagation();
    
    if (this.filaMenuAbierto === dte) {
      // Si el menú ya está abierto para esta fila, cerrarlo
      this.filaMenuAbierto = null;
      this.filaMenuAbiertoElement = null;
    } else {
      // Abrir el menú para esta fila
      this.filaMenuAbierto = dte;
      this.filaMenuAbiertoElement = (event.currentTarget as HTMLElement).closest('tr') as HTMLElement;
    }
  }

  /**
   * Cierra el menú de acciones
   */
  cerrarMenuAcciones(): void {
    this.filaMenuAbierto = null;
    this.filaMenuAbiertoElement = null;
  }

  /**
   * Cierra el menú cuando se hace clic fuera de él
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.filaMenuAbiertoElement) {
      const target = event.target as HTMLElement;
      const menu = document.querySelector('.row-menu');
      const button = target.closest('.btn-acciones');
      
      // Si el clic no fue en el menú ni en un botón de acciones, cerrar el menú
      if (!menu?.contains(target) && !button) {
        this.cerrarMenuAcciones();
      }
    }
  }
}
