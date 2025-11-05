import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-comprobante-retencion-responsables',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './comprobante-retencion-responsables.component.html',
      styleUrl: './comprobante-retencion-responsables.component.scss'
})
export class ComprobanteRetencionResponsablesComponent { collapsed = true; }

