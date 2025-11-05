import { Component } from '@angular/core';
import { DteService } from '../../services/dte.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-comprobante-retencion-otros',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './comprobante-retencion-otros.component.html',
      styleUrl: './comprobante-retencion-otros.component.scss'
})
export class ComprobanteRetencionOtrosComponent { 
  collapsed = true; 
  formaPago: string | null = null;
  openFP = false;
  formasPago: string[] = [];
  constructor(private dteService: DteService){
    this.dteService.getFormasPago().subscribe((fp: any[]) => this.formasPago = fp.map(x => x.nombre));
  }
  escogerFP(f: string){ this.formaPago = f; this.openFP = false; }
}

