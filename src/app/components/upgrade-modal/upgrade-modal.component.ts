import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-upgrade-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './upgrade-modal.component.html',
  styleUrls: ['./upgrade-modal.component.scss']
})
export class UpgradeModalComponent {
  @Output() close = new EventEmitter<void>();

  onClose(): void {
    this.close.emit();
  }
}


