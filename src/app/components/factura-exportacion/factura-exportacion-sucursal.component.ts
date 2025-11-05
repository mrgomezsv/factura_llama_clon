import { Component } from '@angular/core';
import { DteService } from '../../services/dte.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-factura-exportacion-sucursal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './factura-exportacion-sucursal.component.html',
      styleUrl: './factura-exportacion-sucursal.component.scss'
})
export class FacturaExportacionSucursalComponent { 
  collapsed = true; 
  sucursal: string | null = null;
  open = false;
  sucursales: string[] = [];
  constructor(private dteService: DteService){
    this.dteService.getSucursales().subscribe((s: any[]) => this.sucursales = s.map(x => x.nombre));
  }
  seleccionar(s: string){ this.sucursal = s; this.open = false; }
}

