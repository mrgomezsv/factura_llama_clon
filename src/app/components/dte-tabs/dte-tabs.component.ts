import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type TipoTab = 'enviados' | 'recibidos';

@Component({
  selector: 'app-dte-tabs',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dte-tabs.component.html',
  styleUrl: './dte-tabs.component.scss'
})
export class DteTabsComponent {
  @Input() tabActiva: TipoTab = 'enviados';
  @Output() tabCambiada = new EventEmitter<TipoTab>();

  cambiarTab(tab: TipoTab): void {
    this.tabActiva = tab;
    this.tabCambiada.emit(tab);
  }
}

