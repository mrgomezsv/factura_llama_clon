import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FacturaSujetoExcluidoClienteComponent } from '../../components/factura-sujeto-excluido/cliente/cliente.component';
import { FacturaSujetoExcluidoSucursalComponent } from '../../components/factura-sujeto-excluido/sucursal/sucursal.component';
import { FacturaSujetoExcluidoRetencionesComponent } from '../../components/factura-sujeto-excluido/retenciones/retenciones.component';
import { FacturaSujetoExcluidoDescuentosComponent } from '../../components/factura-sujeto-excluido/descuentos/descuentos.component';
import { FacturaSujetoExcluidoResponsablesComponent } from '../../components/factura-sujeto-excluido/responsables/responsables.component';
import { FacturaSujetoExcluidoOtrosComponent } from '../../components/factura-sujeto-excluido/otros/otros.component';
import { FacturaSujetoExcluidoAppendicesComponent } from '../../components/factura-sujeto-excluido/appendices/appendices.component';
import { FacturaSujetoExcluidoItemsComponent } from '../../components/factura-sujeto-excluido/items/items.component';
import { FacturacionCalculationsService } from '../../services/facturacion-calculations.service';
import { ItemFactura, Retenciones, ResultadosCalculoFacturacion } from '../../models/facturacion.model';

@Component({
  selector: 'app-factura-sujeto-excluido-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FacturaSujetoExcluidoClienteComponent,
    FacturaSujetoExcluidoSucursalComponent,
    FacturaSujetoExcluidoRetencionesComponent,
    FacturaSujetoExcluidoDescuentosComponent,
    FacturaSujetoExcluidoResponsablesComponent,
    FacturaSujetoExcluidoOtrosComponent,
    FacturaSujetoExcluidoAppendicesComponent,
    FacturaSujetoExcluidoItemsComponent
  ],
  templateUrl: './factura-sujeto-excluido-page.component.html',
  styleUrl: './factura-sujeto-excluido-page.component.scss'
})
export class FacturaSujetoExcluidoPageComponent {
  cliente: any = {};
  items: ItemFactura[] = [];
  descuentoGlobal = 0;
  retenciones: Retenciones = { renta: 0, iva: 0 };
  otrosMontosNoAfectos = 0;
  ambienteProduccion = true;
  enviarCorreo = true;
  vistaPrevia = true;
  
  constructor(
    private router: Router,
    private facturacionService: FacturacionCalculationsService
  ) {}

  onCliente(v: any) { this.cliente = v; }
  onDescuento(v: number) { this.descuentoGlobal = v || 0; }
  onRetenciones(v: Retenciones) { this.retenciones = v; }
  onItems(items: any[]) { 
    this.items = (items || []).map(item => ({
      cantidad: Number(item.cantidad || 0),
      precio: Number(item.precio || 0),
      descuento: Number(item.descuento || 0),
      tipoVenta: item.tipoVenta || 'Gravada',
      descripcion: item.descripcion || item.producto || ''
    }));
  }

  /**
   * Obtiene todos los cálculos de facturación usando el servicio centralizado
   */
  get calculos(): ResultadosCalculoFacturacion {
    return this.facturacionService.calcularFacturacion({
      items: this.items,
      descuentoGlobal: this.descuentoGlobal,
      retenciones: this.retenciones,
      otrosMontosNoAfectos: this.otrosMontosNoAfectos
    });
  }

  // Getters que exponen los valores calculados
  get sumaVentasGravadas(): number { return this.calculos.sumaVentasGravadas; }
  get sumaVentasExentas(): number { return this.calculos.sumaVentasExentas; }
  get sumaVentasNoSujetas(): number { return this.calculos.sumaVentasNoSujetas; }
  get sumatoriaVentas(): number { return this.calculos.sumatoriaVentas; }
  get descuentoGlobalVentasGravadas(): number { return this.calculos.descuentoGlobalVentasGravadas; }
  get ventasGravadasNetas(): number { return this.calculos.ventasGravadasNetas; }
  get ventasExentasNetas(): number { return this.calculos.ventasExentasNetas; }
  get ventasNoSujetasNetas(): number { return this.calculos.ventasNoSujetasNetas; }
  get subTotal(): number { return this.calculos.subTotal; }
  get iva(): number { return this.calculos.iva; }
  get ivaRetenido(): number { return this.calculos.ivaRetenido; }
  get retencionRenta(): number { return this.calculos.retencionRenta; }
  get montoTotalOperacion(): number { return this.calculos.montoTotalOperacion; }
  get totalOtrosMontosNoAfectos(): number { return this.calculos.totalOtrosMontosNoAfectos; }
  get totalPagar(): number { return this.calculos.totalPagar; }
  get sumaGravadas(): number { return this.calculos.sumaGravadas; }

  cerrar(): void {
    this.router.navigateByUrl('/dtes');
  }
}
