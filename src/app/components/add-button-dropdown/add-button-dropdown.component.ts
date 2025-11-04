import { Component, EventEmitter, HostListener, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-add-button-dropdown',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="add-button-container">
      <button 
        class="btn-add"
        (click)="toggleDropdown()"
        type="button"
        [class.active]="mostrarDropdown"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 4V16M4 10H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>

      @if (mostrarDropdown) {
        <div class="dropdown-menu">
          <button 
            class="dropdown-item"
            (click)="seleccionarOpcion('nuevo-cliente')"
            type="button"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" stroke-width="1.5"/>
              <path d="M12 13C8.68629 13 6 15.6863 6 19H18C18 15.6863 15.3137 13 12 13Z" stroke="currentColor" stroke-width="1.5"/>
            </svg>
            <span>Nuevo Cliente</span>
          </button>
          <button 
            class="dropdown-item"
            (click)="seleccionarOpcion('nueva-sucursal')"
            type="button"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 17H17M5 5H15V15H5V5Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span>Nueva Sucursal</span>
          </button>
          <button 
            class="dropdown-item"
            (click)="seleccionarOpcion('nuevo-producto')"
            type="button"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 7H17L15 15H5L3 7Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M7 4V7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            <span>Nuevo Producto</span>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .add-button-container {
      position: relative;
    }

    .btn-add {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      background: #3b82f6;
      color: #fff;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;

      &:hover {
        background: #2563eb;
      }

      &.active {
        background: #2563eb;
      }
    }

    .dropdown-menu {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      min-width: 200px;
      z-index: 1000;
      overflow: hidden;
    }

    .dropdown-item {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border: none;
      background: transparent;
      color: #1e293b;
      font-size: 14px;
      cursor: pointer;
      text-align: left;
      transition: background 0.2s;

      &:hover {
        background: #f8fafc;
      }

      svg {
        color: #64748b;
        flex-shrink: 0;
      }

      span {
        flex: 1;
      }
    }
  `]
})
export class AddButtonDropdownComponent {
  @Output() opcionSeleccionada = new EventEmitter<string>();
  mostrarDropdown = false;

  @HostListener('document:click', ['$event'])
  clickOutside(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.add-button-container')) {
      this.mostrarDropdown = false;
    }
  }

  toggleDropdown(): void {
    this.mostrarDropdown = !this.mostrarDropdown;
  }

  seleccionarOpcion(opcion: string): void {
    this.opcionSeleccionada.emit(opcion);
    this.mostrarDropdown = false;
  }
}

