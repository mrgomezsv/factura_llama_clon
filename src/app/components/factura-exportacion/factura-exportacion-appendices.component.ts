import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-factura-exportacion-appendices',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './factura-exportacion-appendices.component.html',
      styleUrl: './factura-exportacion-appendices.component.scss'
})
export class FacturaExportacionAppendicesComponent { collapsed = true; }

