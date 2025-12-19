import { Component, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NotaCreditoClienteComponent } from '../../components/nota-credito/cliente/cliente.component';
import { NotaCreditoSucursalComponent } from '../../components/nota-credito/sucursal/sucursal.component';
import { NotaCreditoRetencionesComponent } from '../../components/nota-credito/retenciones/retenciones.component';
import { NotaCreditoDescuentosComponent } from '../../components/nota-credito/descuentos/descuentos.component';
import { NotaCreditoResponsablesComponent } from '../../components/nota-credito/responsables/responsables.component';
import { NotaCreditoOtrosComponent } from '../../components/nota-credito/otros/otros.component';
import { NotaCreditoAppendicesComponent } from '../../components/nota-credito/appendices/appendices.component';
import { NotaCreditoItemsComponent } from '../../components/nota-credito/items/items.component';
import { FacturacionCalculationsService } from '../../services/facturacion-calculations.service';
import { DteService } from '../../services/dte.service';
import { ItemFactura, Retenciones, ResultadosCalculoFacturacion } from '../../models/facturacion.model';
import { NotificacionModalComponent } from '../../components/notificacion-modal/notificacion-modal.component';

@Component({
  selector: 'app-nota-credito-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NotaCreditoClienteComponent,
    NotaCreditoSucursalComponent,
    NotaCreditoRetencionesComponent,
    NotaCreditoDescuentosComponent,
    NotaCreditoResponsablesComponent,
    NotaCreditoOtrosComponent,
    NotaCreditoAppendicesComponent,
    NotaCreditoItemsComponent,
    NotificacionModalComponent
  ],
  templateUrl: './nota-credito-page.component.html',
  styleUrl: './nota-credito-page.component.scss'
})
export class NotaCreditoPageComponent {
  @ViewChild(NotaCreditoItemsComponent) itemsComponent!: NotaCreditoItemsComponent;

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

  // Nuevas propiedades para documentos relacionados
  documentosRelacionables: any[] = [];
  documentoSeleccionado: any = null;

  // Propiedades para modal de notificación
  showModal = false;
  modalType: 'exito' | 'error' = 'error';
  modalTitle = '';
  modalMessage = '';

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

    // Cargar documentos relacionados
    if (this.cliente.id) {
      this.dteService.getDocumentosRelacionables(this.cliente.id).subscribe(docs => {
        this.documentosRelacionables = docs;
        this.documentoSeleccionado = null; // Reset selection
      });
    }
  }
  onDescuento(v: number) { this.descuentoGlobal = v || 0; }
  onRetenciones(v: Retenciones) { this.retenciones = v; }
  onItems(items: any[]) {
    this.itemsRaw = items || [];
    this.items = (items || []).map(item => {
      const precio = Number(item.precio || 0);
      const cantidad = Number(item.cantidad || 1);
      const descuento = Number(item.descuento || 0);

      // Para NCR, el precio ingresado es NETO (sin IVA)
      // El servicio de cálculos espera precio neto
      return {
        cantidad: cantidad,
        precio: precio,
        descuento: descuento,
        tipoVenta: item.tipoVenta || 'Gravada',
        descripcion: item.descripcion || item.producto || '',
        unidad: item.unidad || 'Unidad'
      };
    });
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
      tipoDte: 'NCR' // Nota de Crédito - gravada
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
      this.mostrarAlerta('No hay empresa seleccionada', 'Error de Configuración', 'error');
      return;
    }
    if (this.itemsRaw.length === 0) {
      this.mostrarAlerta('Debe agregar al menos un item', 'Falta Información', 'error');
      return;
    }
    if (!this.cliente || !this.cliente.nombre) {
      this.mostrarAlerta('Debe seleccionar un cliente', 'Falta Información', 'error');
      return;
    }
    if (!this.documentoSeleccionado) {
      this.mostrarAlerta('Debe seleccionar un documento a modificar (Factura o CCF)', 'Documento Requerido', 'error');
      return;
    }

    this.generandoDTE = true;
    const datosDTE = {
      tipoDte: 'NCR',
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
      ambiente: this.ambienteProduccion ? 'PRODUCCIÓN' : 'PRUEBAS',
      documentoRelacionado: [{
        tipoDocumento: this.documentoSeleccionado.tipo === 'Factura' ? '01' : (this.documentoSeleccionado.tipoDte || '03'),
        tipoGeneracion: 1,
        numeroDocumento: this.documentoSeleccionado.codigoGeneracion,
        fechaEmision: this.documentoSeleccionado.fechaEmision
      }]
    };

    const token = localStorage.getItem('auth_token');
    if (!token) {
      this.mostrarAlerta('No se encontró sesión activa. Por favor inicie sesión nuevamente.', 'Sesión Expirada', 'error');
      this.generandoDTE = false;
      return;
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.post('http://localhost:3000/api/dtes/generar', datosDTE, {
      headers: headers,
      responseType: 'blob'
    }).subscribe({
      next: (pdfBlob: Blob) => {
        const url = window.URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `DTE-NCR-${new Date().getTime()}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        this.generandoDTE = false;
        this.cerrar();
      },
      error: (error) => {
        console.error('Error al generar DTE:', error);
        const detail = error.error?.error || error.message || 'Error desconocido';
        this.mostrarAlerta('Error al generar el DTE: ' + detail, 'Error de Transmisión', 'error');
        this.generandoDTE = false;
      }
    });
  }

  mostrarAlerta(mensaje: string, titulo: string, tipo: 'exito' | 'error' = 'exito') {
    this.modalMessage = mensaje;
    this.modalTitle = titulo;
    this.modalType = tipo;
    this.showModal = true;
  }
}
