import { Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { FacturaClienteComponent } from '../../components/factura/cliente/cliente.component';
import { FacturaSucursalComponent } from '../../components/factura/sucursal/sucursal.component';
import { FacturaRetencionesComponent } from '../../components/factura/retenciones/retenciones.component';
import { FacturaDescuentosComponent } from '../../components/factura/descuentos/descuentos.component';
import { FacturaResponsablesComponent } from '../../components/factura/responsables/responsables.component';
import { FacturaOtrosComponent } from '../../components/factura/otros/otros.component';
import { FacturaAppendicesComponent } from '../../components/factura/appendices/appendices.component';
import { FacturaItemsComponent } from '../../components/factura/items/items.component';
import { FacturacionCalculationsService } from '../../services/facturacion-calculations.service';
import { DteService } from '../../services/dte.service';
import { ItemFactura, Retenciones, ResultadosCalculoFacturacion } from '../../models/facturacion.model';

@Component({
  selector: 'app-factura-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    FacturaClienteComponent,
    FacturaSucursalComponent,
    FacturaRetencionesComponent,
    FacturaDescuentosComponent,
    FacturaResponsablesComponent,
    FacturaOtrosComponent,
    FacturaAppendicesComponent,
    FacturaItemsComponent
  ],
  templateUrl: './factura-page.component.html',
  styleUrl: './factura-page.component.scss'
})
export class FacturaPageComponent {
  @ViewChild(FacturaItemsComponent) itemsComponent!: FacturaItemsComponent;
  
  cliente: any = {};
  items: ItemFactura[] = [];
  itemsRaw: any[] = []; // Almacenar los items completos con unidad
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
    // Cargar empresa seleccionada
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

  eliminarItem(index: number): void {
    if (this.itemsComponent && this.itemsComponent.items) {
      this.itemsComponent.eliminarItem(index);
    }
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
      tipoDte: 'FAC' // Factura consumidor final - gravada
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
    // Validar datos requeridos
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

    // Preparar datos para enviar al servidor
    const datosDTE = {
      tipoDte: 'FAC',
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

    // Llamar al endpoint para generar DTE
    this.http.post('http://localhost:3000/api/dtes/generar', datosDTE, {
      responseType: 'blob'
    }).subscribe({
      next: (pdfBlob: Blob) => {
        // Crear URL del blob y descargar
        const url = window.URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `DTE-FAC-${new Date().getTime()}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        this.generandoDTE = false;
        
        // Cerrar el modal y navegar a la lista de DTEs
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
