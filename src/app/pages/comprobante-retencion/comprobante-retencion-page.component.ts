import { Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ComprobanteRetencionClienteComponent } from '../../components/comprobante-retencion/cliente/cliente.component';
import { ComprobanteRetencionSucursalComponent } from '../../components/comprobante-retencion/sucursal/sucursal.component';
import { ComprobanteRetencionRetencionesComponent } from '../../components/comprobante-retencion/retenciones/retenciones.component';
import { ComprobanteRetencionDescuentosComponent } from '../../components/comprobante-retencion/descuentos/descuentos.component';
import { ComprobanteRetencionResponsablesComponent } from '../../components/comprobante-retencion/responsables/responsables.component';
import { ComprobanteRetencionOtrosComponent } from '../../components/comprobante-retencion/otros/otros.component';
import { ComprobanteRetencionAppendicesComponent } from '../../components/comprobante-retencion/appendices/appendices.component';
import { ComprobanteRetencionItemsComponent } from '../../components/comprobante-retencion/items/items.component';
import { FacturacionCalculationsService } from '../../services/facturacion-calculations.service';
import { DteService } from '../../services/dte.service';
import { ItemFactura, Retenciones, ResultadosCalculoFacturacion } from '../../models/facturacion.model';

@Component({
  selector: 'app-comprobante-retencion-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ComprobanteRetencionClienteComponent,
    ComprobanteRetencionSucursalComponent,
    ComprobanteRetencionRetencionesComponent,
    ComprobanteRetencionDescuentosComponent,
    ComprobanteRetencionResponsablesComponent,
    ComprobanteRetencionOtrosComponent,
    ComprobanteRetencionAppendicesComponent,
    ComprobanteRetencionItemsComponent
  ],
  templateUrl: './comprobante-retencion-page.component.html',
  styleUrl: './comprobante-retencion-page.component.scss'
})
export class ComprobanteRetencionPageComponent {
  @ViewChild(ComprobanteRetencionItemsComponent) itemsComponent!: ComprobanteRetencionItemsComponent;
  
  cliente: any = {};
  items: ItemFactura[] = [];
  itemsRaw: any[] = [];
  descuentoGlobal = 0;
  retenciones: Retenciones = { renta: 0, iva: 0 };
  otrosMontosNoAfectos = 0;
  ambienteProduccion = true;
  enviarCorreo = true;
  vistaPrevia = true;
  empresaSeleccionada: any = null;
  generandoDTE = false;
  
  constructor(
    private router: Router,
    private facturacionService: FacturacionCalculationsService,
    private dteService: DteService,
    private http: HttpClient
  ) {
    this.dteService.getEmpresas().subscribe(empresas => {
      if (empresas.length > 0) {
        this.empresaSeleccionada = empresas[0];
      }
    });
  }

  onCliente(v: any) { 
    this.cliente = {
      id: v.id,
      nombre: v.nombre,
      correo: v.correo,
      nit: v.nit,
      nrc: v.nrc,
      direccion: v.direccion,
      telefono: v.telefono,
      numeroDocumento: v.nit
    };
  }
  onDescuento(v: number) { this.descuentoGlobal = v || 0; }
  onRetenciones(v: Retenciones) { this.retenciones = v; }
  onItems(items: any[]) { 
    this.itemsRaw = items || [];
    this.items = (items || []).map(item => ({
      cantidad: Number(item.cantidad || 0),
      precio: Number(item.precio || 0),
      descuento: Number(item.descuento || 0),
      tipoVenta: item.tipoVenta || 'Gravada',
      descripcion: item.descripcion || item.producto || '',
      unidad: item.unidad || 'Unidad'
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
      otrosMontosNoAfectos: this.otrosMontosNoAfectos,
      tipoDte: 'CRT' // Comprobante de Retención - gravada
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

  generarDTE(): void {
    if (!this.empresaSeleccionada || !this.empresaSeleccionada.id) {
      alert('Error: No hay empresa seleccionada');
      return;
    }
    if (this.itemsRaw.length === 0) {
      alert('Error: Debe agregar al menos un item');
      return;
    }
    if (!this.cliente || !this.cliente.nombre) {
      alert('Error: Debe seleccionar un cliente');
      return;
    }

    this.generandoDTE = true;
    const datosDTE = {
      tipoDte: 'CRT',
      empresaId: this.empresaSeleccionada.id,
      clienteId: this.cliente.id || null,
      items: this.itemsRaw.map(item => ({
        cantidad: Number(item.cantidad || 0),
        precio: Number(item.precio || 0),
        descuento: Number(item.descuento || 0),
        tipoVenta: item.tipoVenta || 'Gravada',
        descripcion: item.descripcion || item.producto || '',
        unidad: item.unidad || 'Unidad',
        codigo: item.codigo || null
      })),
      totales: {
        sumaVentasGravadas: this.sumaVentasGravadas,
        sumaVentasExentas: this.sumaVentasExentas,
        sumaVentasNoSujetas: this.sumaVentasNoSujetas,
        sumatoriaVentas: this.sumatoriaVentas,
        descuentoGlobalVentasGravadas: this.descuentoGlobalVentasGravadas,
        subTotal: this.subTotal,
        iva: this.iva,
        ivaRetenido: this.ivaRetenido,
        retencionRenta: this.retencionRenta,
        montoTotalOperacion: this.montoTotalOperacion,
        totalOtrosMontosNoAfectos: this.totalOtrosMontosNoAfectos,
        totalPagar: this.totalPagar
      },
      retenciones: this.retenciones,
      descuentoGlobal: this.descuentoGlobal,
      otrosMontosNoAfectos: this.otrosMontosNoAfectos,
      ambiente: this.ambienteProduccion ? 'PRODUCCIÓN' : 'PRUEBAS'
    };

    this.http.post('http://localhost:3000/api/dtes/generar', datosDTE, {
      responseType: 'blob'
    }).subscribe({
      next: (pdfBlob: Blob) => {
        const url = window.URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `DTE-CRT-${new Date().getTime()}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        this.generandoDTE = false;
        this.cerrar();
      },
      error: (error) => {
        console.error('Error al generar DTE:', error);
        alert('Error al generar el DTE: ' + (error.error?.error || error.message || 'Error desconocido'));
        this.generandoDTE = false;
      }
    });
  }
}
