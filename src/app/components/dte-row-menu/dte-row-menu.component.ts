import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DTE } from '../../models/dte.model';

@Component({
  selector: 'app-dte-row-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dte-row-menu.component.html',
  styleUrl: './dte-row-menu.component.scss'
})
export class DteRowMenuComponent implements AfterViewInit, OnChanges {
  @Input() dte: DTE | null = null;
  @Input() rowElement: HTMLElement | null = null;
  @Output() eliminar = new EventEmitter<DTE>();
  @Output() exportarPDF = new EventEmitter<DTE>();
  @Output() exportarJSON = new EventEmitter<DTE>();
  @Output() verDetalles = new EventEmitter<DTE>();
  @Output() ocultar = new EventEmitter<void>();

  visible: boolean = false;
  position: { top: number; left: number } = { top: 0, left: 0 };

  ngAfterViewInit(): void {
    if (this.dte && this.rowElement) {
      this.calcularPosicion();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['dte'] || changes['rowElement']) {
      if (this.dte && this.rowElement) {
        setTimeout(() => {
          this.calcularPosicion();
          this.visible = true;
        }, 0);
      } else {
        this.visible = false;
      }
    }
  }

  calcularPosicion(): void {
    if (!this.rowElement) return;
    
    const rect = this.rowElement.getBoundingClientRect();
    const menuWidth = 200;
    const menuHeight = 50;
    
    this.position = {
      top: rect.top + (rect.height / 2) - (menuHeight / 2) + window.scrollY,
      left: rect.right - menuWidth - 10
    };
  }

  onOcultar(): void {
    this.visible = false;
    this.ocultar.emit();
  }

  onEliminar(): void {
    if (this.dte) {
      this.eliminar.emit(this.dte);
      this.onOcultar();
    }
  }

  onExportarPDF(): void {
    if (this.dte) {
      this.exportarPDF.emit(this.dte);
      this.onOcultar();
    }
  }

  onExportarJSON(): void {
    if (this.dte) {
      this.exportarJSON.emit(this.dte);
      this.onOcultar();
    }
  }

  onVerDetalles(): void {
    if (this.dte) {
      this.verDetalles.emit(this.dte);
      this.onOcultar();
    }
  }
}

