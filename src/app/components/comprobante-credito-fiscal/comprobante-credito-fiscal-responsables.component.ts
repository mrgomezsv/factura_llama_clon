import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-comprobante-credito-fiscal-responsables',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './comprobante-credito-fiscal-responsables.component.html',
      styleUrl: './comprobante-credito-fiscal-responsables.component.scss'
})
export class ComprobanteCreditoFiscalResponsablesComponent { collapsed = true; }

