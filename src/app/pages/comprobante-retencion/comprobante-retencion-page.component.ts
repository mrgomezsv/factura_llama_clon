import { Component, ViewChild, OnInit, HostListener } from '@angular/core';
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
import { environment } from '../../../environments/environment';

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
  @ViewChild(ComprobanteRetencionItemsComponent) itemsComponent!: ComprobanteRetencionItemsComponent;

  cliente: any = {};
  items: any[] = []; // Changed to any[] to support CR fields
  itemsRaw: any[] = [];
  descuentoGlobal = 0;
  retenciones: Retenciones = { renta: 0, iva: 0 };
  otrosMontosNoAfectos = 0;
  ambienteProduccion = true;
  enviarCorreo = true;
  vistaPrevia = true;
  empresaSeleccionada: any = null;
  generandoDTE = false;

  // CR Totals
  totalSujetoRetencion = 0;
  totalIVAretenido = 0;

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
    this.items = this.itemsRaw;
    this.calcularTotalesCR();
  }

  calcularTotalesCR() {
    this.totalSujetoRetencion = 0;
    this.totalIVAretenido = 0;

    this.items.forEach(item => {
      const sujeto = parseFloat(item.montoSujetoGrav || item.montoSujeto || 0);
      const retenido = parseFloat(item.ivaRetenido || item.retencion || 0);
      this.totalSujetoRetencion += sujeto;
      this.totalIVAretenido += retenido;
    });
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
      alert('Error: Debe agregar al menos un documento');
      return;
    }
    if (!this.cliente || !this.cliente.nombre) {
      alert('Error: Debe seleccionar un cliente (Agente de Retención)');
      return;
    }

    this.generandoDTE = true;

    // Construct CR (07) Payload
    const datosDTE = {
      tipoDte: '07', // Code for Comprobante de Retención
      empresaId: this.empresaSeleccionada.id,
      clienteId: this.cliente.id || null,
      emisor: this.empresaSeleccionada, // Ensure emisor info is passed if needed generally, but usually backend fetches it
      cliente: this.cliente, // Pass full client object
      secuencial: null, // Backend handles current control number
      fechaEmision: new Date(),
      items: this.itemsRaw.map(item => ({
        tipoDteRelacionado: item.tipoDteRelacionado || '03',
        tipoGeneracion: item.tipoGeneracion || 1,
        numDocumento: item.numeroDocumento || item.numDocumento,
        fechaEmision: item.fechaEmision || new Date().toISOString().split('T')[0],
        montoSujetoGrav: parseFloat(item.montoSujetoGrav || item.montoSujeto || 0),
        codigoRetencionMH: item.codigoRetencion || '22',
        ivaRetenido: parseFloat(item.ivaRetenido || item.retencion || 0),
        descripcion: item.descripcion || 'Retención IVA'
      })),
      totales: {
        totalSujetoRetencion: this.totalSujetoRetencion,
        totalIVAretenido: this.totalIVAretenido
      },
      observaciones: null,
      ambiente: this.ambienteProduccion ? 'PRODUCCIÓN' : 'PRUEBAS'
    };

    this.http.post(`${environment.apiUrl}/dtes/generar`, datosDTE, {
      responseType: 'blob'
    }).subscribe({
      next: (pdfBlob: Blob) => {
        const url = window.URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `DTE-CR-${new Date().getTime()}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        this.generandoDTE = false;
        this.cerrar();
      },
      error: (error) => {
        console.error('Error al generar DTE:', error);
        // Try to parse blob error if json
        if (error.error instanceof Blob) {
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const errObj = JSON.parse(reader.result as string);
              alert('Error: ' + (errObj.error || errObj.message || 'Error desconocido'));
            } catch (e) {
              alert('Error desconocido al generar DTE');
            }
          };
          reader.readAsText(error.error);
        } else {
          alert('Error al generar el DTE: ' + (error.error?.error || error.message || 'Error desconocido'));
        }
        this.generandoDTE = false;
      }
    });
  }
}
