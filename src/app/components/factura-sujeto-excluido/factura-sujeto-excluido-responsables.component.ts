import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-factura-sujeto-excluido-responsables',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './factura-sujeto-excluido-responsables.component.html',
      styleUrl: './factura-sujeto-excluido-responsables.component.scss'
})
export class FacturaSujetoExcluidoResponsablesComponent { collapsed = true; }

