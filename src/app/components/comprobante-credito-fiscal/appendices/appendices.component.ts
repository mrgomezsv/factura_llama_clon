import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-comprobante-credito-fiscal-appendices',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './appendices.component.html',
      styleUrl: './appendices.component.scss'
})
export class ComprobanteCreditoFiscalAppendicesComponent { collapsed = true; }

