import { Component } from '@angular/core';
import { DteService } from '../../../services/dte.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-factura-sujeto-excluido-otros',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './otros.component.html',
      styleUrl: './otros.component.scss'
})
export class FacturaSujetoExcluidoOtrosComponent { 
  collapsed = true; 
  formaPago: string | null = null;
  openFP = false;
  formasPago: string[] = [];
  constructor(private dteService: DteService){
    this.dteService.getFormasPago().subscribe((fp: any[]) => this.formasPago = fp.map(x => x.nombre));
  }
  escogerFP(f: string){ this.formaPago = f; this.openFP = false; }
}

