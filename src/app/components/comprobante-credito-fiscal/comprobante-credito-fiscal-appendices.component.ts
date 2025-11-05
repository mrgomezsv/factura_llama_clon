import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-comprobante-credito-fiscal-appendices',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './comprobante-credito-fiscal-appendices.component.html',
      styleUrl: './comprobante-credito-fiscal-appendices.component.scss'
})
export class ComprobanteCreditoFiscalAppendicesComponent { collapsed = true; }

