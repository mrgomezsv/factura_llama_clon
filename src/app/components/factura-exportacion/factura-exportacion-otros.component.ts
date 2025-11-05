import { Component } from '@angular/core';
import { DteService } from '../../services/dte.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-factura-exportacion-otros',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './factura-exportacion-otros.component.html',
      styleUrl: './factura-exportacion-otros.component.scss'
})
export class FacturaExportacionOtrosComponent { 
  collapsed = true; 
  formaPago: string | null = null;
  openFP = false;
  formasPago: string[] = [];
  constructor(private dteService: DteService){
    this.dteService.getFormasPago().subscribe((fp: any[]) => this.formasPago = fp.map(x => x.nombre));
  }
  escogerFP(f: string){ this.formaPago = f; this.openFP = false; }
}

