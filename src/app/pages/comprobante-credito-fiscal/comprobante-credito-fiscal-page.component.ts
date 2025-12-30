import { Component, ViewChild, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ComprobanteCreditoFiscalClienteComponent } from '../../components/comprobante-credito-fiscal/cliente/cliente.component';
import { ComprobanteCreditoFiscalSucursalComponent } from '../../components/comprobante-credito-fiscal/sucursal/sucursal.component';
import { ComprobanteCreditoFiscalRetencionesComponent } from '../../components/comprobante-credito-fiscal/retenciones/retenciones.component';
import { ComprobanteCreditoFiscalDescuentosComponent } from '../../components/comprobante-credito-fiscal/descuentos/descuentos.component';
import { ComprobanteCreditoFiscalResponsablesComponent } from '../../components/comprobante-credito-fiscal/responsables/responsables.component';
import { ComprobanteCreditoFiscalOtrosComponent } from '../../components/comprobante-credito-fiscal/otros/otros.component';
import { ComprobanteCreditoFiscalAppendicesComponent } from '../../components/comprobante-credito-fiscal/appendices/appendices.component';
import { ComprobanteCreditoFiscalItemsComponent } from '../../components/comprobante-credito-fiscal/items/items.component';
import { FacturacionCalculationsService } from '../../services/facturacion-calculations.service';
import { DteService } from '../../services/dte.service';
import { ItemFactura, Retenciones, ResultadosCalculoFacturacion } from '../../models/facturacion.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-comprobante-credito-fiscal-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ComprobanteCreditoFiscalClienteComponent,
    ComprobanteCreditoFiscalSucursalComponent,
    ComprobanteCreditoFiscalRetencionesComponent,
    ComprobanteCreditoFiscalDescuentosComponent,
    ComprobanteCreditoFiscalResponsablesComponent,
    ComprobanteCreditoFiscalOtrosComponent,
    ComprobanteCreditoFiscalAppendicesComponent,
    ComprobanteCreditoFiscalItemsComponent
  ],
  templateUrl: './comprobante-credito-fiscal-page.component.html',
  styleUrl: './comprobante-credito-fiscal-page.component.scss'
})
export class ComprobanteCreditoFiscalPageComponent {
  @ViewChild(ComprobanteCreditoFiscalItemsComponent) itemsComponent!: ComprobanteCreditoFiscalItemsComponent;

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
    this.items = (items || []).map(item => {
      const precio = Number(item.precio || 0);
      const cantidad = Number(item.cantidad || 1);
      const descuento = Number(item.descuento || 0);

      // Para CCF, el precio ingresado es NETO (sin IVA)
      // El servicio de cálculos espera precio neto
      // El descuento del item se aplica al subtotal (cantidad * precio)
      return {
        cantidad: cantidad,
        precio: precio,
        descuento: descuento, // Descuento total del item, no unitario
        tipoVenta: item.tipoVenta || 'Gravada',
        descripcion: item.descripcion || item.producto || '',
        unidad: item.unidad || 'Unidad'
      };
    });

    // Debug: verificar que los items se estén mapeando correctamente
    if (this.items.length > 0) {
      console.log('Items mapeados para cálculos:', this.items);
      console.log('Items raw:', this.itemsRaw);
    }
  }

  activeMenuIndex: number | null = null;

  eliminarItem(index: number): void {
    if (this.itemsComponent && this.itemsComponent.items) {
      this.itemsComponent.eliminarItem(index);
      this.activeMenuIndex = null;
    }
  }

  toggleMenu(index: number, event: Event): void {
    event.stopPropagation();
    this.activeMenuIndex = this.activeMenuIndex === index ? null : index;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    this.activeMenuIndex = null;
  }

  /**
   * Obtiene todos los cálculos de facturación usando el servicio centralizado
   */
  get calculos(): ResultadosCalculoFacturacion {
    // Asegurar que los items tengan los datos correctos
    const itemsParaCalculo = this.items.map(item => ({
      cantidad: Number(item.cantidad || 0),
      precio: Number(item.precio || 0),
      descuento: Number(item.descuento || 0),
      tipoVenta: item.tipoVenta || 'Gravada',
      descripcion: item.descripcion || ''
    }));

    const resultado = this.facturacionService.calcularFacturacion({
      items: itemsParaCalculo,
      descuentoGlobal: this.descuentoGlobal,
      retenciones: this.retenciones,
      otrosMontosNoAfectos: this.otrosMontosNoAfectos,
      tipoDte: 'CCF' // Comprobante Crédito Fiscal - gravada
    });

    // Debug: verificar que los cálculos se estén ejecutando
    if (itemsParaCalculo.length > 0 && resultado.sumaVentasGravadas === 0) {
      console.warn('⚠️ Items presentes pero sumaVentasGravadas es 0', {
        itemsParaCalculo,
        items: this.items,
        itemsRaw: this.itemsRaw,
        resultado
      });
    }

    return resultado;
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
      tipoDte: 'CCF',
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

    const token = localStorage.getItem('auth_token');
    if (!token) {
      alert('Error: No se encontró sesión activa. Por favor inicie sesión nuevamente.');
      return;
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.post(`${environment.apiUrl}/dtes/generar`, datosDTE, {
      headers: headers,
      responseType: 'blob'
    }).subscribe({
      next: (pdfBlob: Blob) => {
        const url = window.URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `DTE-CCF-${new Date().getTime()}.pdf`;
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
