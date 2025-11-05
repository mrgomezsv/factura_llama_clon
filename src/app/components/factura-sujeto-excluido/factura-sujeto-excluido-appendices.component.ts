import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-factura-sujeto-excluido-appendices',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './factura-sujeto-excluido-appendices.component.html',
      styleUrl: './factura-sujeto-excluido-appendices.component.scss'
})
export class FacturaSujetoExcluidoAppendicesComponent { collapsed = true; }

