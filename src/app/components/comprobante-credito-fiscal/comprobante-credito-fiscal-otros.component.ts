import { Component } from '@angular/core';
import { DteService } from '../../services/dte.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-comprobante-credito-fiscal-otros',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './comprobante-credito-fiscal-otros.component.html',
      styleUrl: './comprobante-credito-fiscal-otros.component.scss'
})
export class ComprobanteCreditoFiscalOtrosComponent { 
  collapsed = true; 
  formaPago: string | null = null;
  openFP = false;
  formasPago: string[] = [];
  constructor(private dteService: DteService){
    this.dteService.getFormasPago().subscribe((fp: any[]) => this.formasPago = fp.map(x => x.nombre));
  }
  escogerFP(f: string){ this.formaPago = f; this.openFP = false; }
}

