import { Component } from '@angular/core';
import { DteService } from '../../services/dte.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-factura-sujeto-excluido-sucursal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './factura-sujeto-excluido-sucursal.component.html',
      styleUrl: './factura-sujeto-excluido-sucursal.component.scss'
})
export class FacturaSujetoExcluidoSucursalComponent { 
  collapsed = true; 
  sucursal: string | null = null;
  open = false;
  sucursales: string[] = [];
  constructor(private dteService: DteService){
    this.dteService.getSucursales().subscribe((s: any[]) => this.sucursales = s.map(x => x.nombre));
  }
  seleccionar(s: string){ this.sucursal = s; this.open = false; }
}

