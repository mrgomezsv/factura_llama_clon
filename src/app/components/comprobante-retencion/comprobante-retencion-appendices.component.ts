import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-comprobante-retencion-appendices',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './comprobante-retencion-appendices.component.html',
      styleUrl: './comprobante-retencion-appendices.component.scss'
})
export class ComprobanteRetencionAppendicesComponent { collapsed = true; }

