import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirmar-eliminacion-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirmar-eliminacion-modal.component.html',
  styleUrl: './confirmar-eliminacion-modal.component.scss'
})
export class ConfirmarEliminacionModalComponent {
  @Input() titulo: string = 'Confirmar Eliminación';
  @Input() mensaje: string = '';
  @Input() nombreItem: string = '';
  @Output() confirmar = new EventEmitter<void>();
  @Output() cancelar = new EventEmitter<void>();

  onConfirmar(): void {
    this.confirmar.emit();
  }

  onCancelar(): void {
    this.cancelar.emit();
  }
}
