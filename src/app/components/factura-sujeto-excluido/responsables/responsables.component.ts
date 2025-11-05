import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-factura-sujeto-excluido-responsables',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './responsables.component.html',
      styleUrl: './responsables.component.scss'
})
export class FacturaSujetoExcluidoResponsablesComponent { collapsed = true; }

