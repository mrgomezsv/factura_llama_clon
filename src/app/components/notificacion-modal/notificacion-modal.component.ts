import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-notificacion-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notificacion-modal.component.html',
  styleUrl: './notificacion-modal.component.scss'
})
export class NotificacionModalComponent {
  @Input() tipo: 'exito' | 'error' = 'exito';
  @Input() titulo: string = '';
  @Input() mensaje: string = '';
  @Output() cerrar = new EventEmitter<void>();

  onCerrar(): void {
    this.cerrar.emit();
  }
}
