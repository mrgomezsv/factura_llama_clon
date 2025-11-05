import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-factura-appendices',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './factura-appendices.component.html',
      styleUrl: './factura-appendices.component.scss'
})
export class FacturaAppendicesComponent { collapsed = true; }


