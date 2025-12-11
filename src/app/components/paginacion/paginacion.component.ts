import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-paginacion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './paginacion.component.html',
  styleUrl: './paginacion.component.scss'
})
export class PaginacionComponent {
  @Input() paginaActual: number = 1;
  @Input() totalPaginas: number = 1;
  @Input() totalItems: number = 0;
  @Output() cambiarPagina = new EventEmitter<number>();

  get paginasVisibles(): number[] {
    const paginas: number[] = [];
    const maxVisible = 5;
    
    if (this.totalPaginas <= maxVisible) {
      // Si hay 5 o menos páginas, mostrar todas
      for (let i = 1; i <= this.totalPaginas; i++) {
        paginas.push(i);
      }
    } else {
      // Lógica para mostrar páginas con elipsis
      if (this.paginaActual <= 3) {
        // Mostrar primeras 5 páginas
        for (let i = 1; i <= 5; i++) {
          paginas.push(i);
        }
      } else if (this.paginaActual >= this.totalPaginas - 2) {
        // Mostrar últimas 5 páginas
        for (let i = this.totalPaginas - 4; i <= this.totalPaginas; i++) {
          paginas.push(i);
        }
      } else {
        // Mostrar páginas alrededor de la actual
        for (let i = this.paginaActual - 2; i <= this.paginaActual + 2; i++) {
          paginas.push(i);
        }
      }
    }
    
    return paginas;
  }

  get mostrarElipsisInicio(): boolean {
    return this.totalPaginas > 5 && this.paginaActual > 3 && this.paginasVisibles[0] > 1;
  }

  get mostrarElipsisFinal(): boolean {
    return this.totalPaginas > 5 && 
           this.paginaActual < this.totalPaginas - 2 && 
           this.paginasVisibles[this.paginasVisibles.length - 1] < this.totalPaginas;
  }

  get mostrarUltimaPagina(): boolean {
    return this.totalPaginas > 5 && 
           this.paginaActual < this.totalPaginas - 2;
  }

  irAPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas && pagina !== this.paginaActual) {
      this.cambiarPagina.emit(pagina);
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
}
