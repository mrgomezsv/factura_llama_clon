import { Component, ViewChild, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FacturaSujetoExcluidoClienteComponent } from '../../components/factura-sujeto-excluido/cliente/cliente.component';
import { FacturaSujetoExcluidoSucursalComponent } from '../../components/factura-sujeto-excluido/sucursal/sucursal.component';
import { FacturaSujetoExcluidoRetencionesComponent } from '../../components/factura-sujeto-excluido/retenciones/retenciones.component';
import { FacturaSujetoExcluidoDescuentosComponent } from '../../components/factura-sujeto-excluido/descuentos/descuentos.component';
import { FacturaSujetoExcluidoResponsablesComponent } from '../../components/factura-sujeto-excluido/responsables/responsables.component';
import { FacturaSujetoExcluidoOtrosComponent } from '../../components/factura-sujeto-excluido/otros/otros.component';
import { FacturaSujetoExcluidoAppendicesComponent } from '../../components/factura-sujeto-excluido/appendices/appendices.component';
import { FacturaSujetoExcluidoItemsComponent } from '../../components/factura-sujeto-excluido/items/items.component';
import { FacturacionCalculationsService } from '../../services/facturacion-calculations.service';
import { DteService } from '../../services/dte.service';
import { AuthService } from '../../services/auth.service';
import { ItemFactura, Retenciones, ResultadosCalculoFacturacion, Pago } from '../../models/facturacion.model';
import { environment } from '../../../environments/environment';

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
export class FacturaSujetoExcluidoPageComponent implements OnInit {
  @ViewChild(FacturaSujetoExcluidoItemsComponent) itemsComponent!: FacturaSujetoExcluidoItemsComponent;

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
  codigoGeneracion: string = '';
  emisor: any = {};
  usuario: any = {};

  // Nuevos campos para FSE
  condicionOperacion: number = 1;
  pagos: Pago[] = [];
  observaciones: string = '';

  constructor(
    private router: Router,
    private facturacionService: FacturacionCalculationsService,
    private dteService: DteService,
    private http: HttpClient,
    private authService: AuthService
  ) {
    this.dteService.getEmpresas().subscribe(empresas => {
      if (empresas.length > 0) {
        this.empresaSeleccionada = empresas[0];
      }
    });
  }

  ngOnInit(): void {
    this.codigoGeneracion = this.generateUUID();

    this.authService.user$.subscribe(usuario => {
      this.usuario = usuario;
      if (usuario && usuario.empresaId) {
        this.dteService.getEmpresas().subscribe(empresas => {
          const empresa = empresas.find(e => e.id === usuario.empresaId);
          if (empresa) {
            this.emisor = empresa;
            if (!this.empresaSeleccionada) {
              this.empresaSeleccionada = empresa;
            }
          }
        });

        this.dteService.getEmpresaConfig(usuario.empresaId).subscribe(config => {
          if (config) {
            if (config.ambientePruebasActivo) {
              this.ambienteProduccion = false;
            } else if (config.ambienteProduccionActivo) {
              this.ambienteProduccion = true;
            }
          }
        });
      }
    });
  }

  generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
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
      tipoDocumento: v.tipoDocumento,
      numDocumento: v.numeroDocumento,
      codActividad: v.codActividad || null
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
      unidad: item.unidad || 'Unidad',
      tipoItem: item.tipoProducto === 'Bienes' ? 1 : 2
    }));
  }

  onOtros(v: any) {
    this.condicionOperacion = v.condicionOperacion;
    this.pagos = v.pagos;
    this.observaciones = v.observaciones;
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
    return this.facturacionService.calcularFacturacion({
      items: this.items,
      descuentoGlobal: this.descuentoGlobal,
      retenciones: this.retenciones,
      otrosMontosNoAfectos: this.otrosMontosNoAfectos,
      tipoDte: 'FSE'
    });
  }

  // Getters que exponen los valores calculados
  get sumaVentasGravadas(): number { return this.calculos.sumaVentasGravadas; }
  get sumaVentasExentas(): number { return this.calculos.sumaVentasExentas; }
  get sumaVentasNoSujetas(): number { return this.calculos.sumaVentasNoSujetas; }
  get sumatoriaVentas(): number { return this.calculos.sumatoriaVentas; }
  get descuentoGlobalVentasGravadas(): number { return this.calculos.descuentoGlobalVentasGravadas; }
  get subTotal(): number { return this.calculos.subTotal; }
  get iva(): number { return this.calculos.iva; }
  get ivaRetenido(): number { return this.calculos.ivaRetenido; }
  get retencionRenta(): number { return this.calculos.retencionRenta; }
  get montoTotalOperacion(): number { return this.calculos.montoTotalOperacion; }
  get totalOtrosMontosNoAfectos(): number { return this.calculos.totalOtrosMontosNoAfectos; }
  get totalPagar(): number { return this.calculos.totalPagar; }

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
      alert('Error: Debe seleccionar un sujeto excluido');
      return;
    }

    this.generandoDTE = true;

    const datosDTE = {
      tipoDte: 'FSE', // Backend maps this to '14'
      empresaId: this.empresaSeleccionada.id,
      clienteId: this.cliente.id || null,
      sujetoExcluido: this.cliente,
      items: this.itemsRaw.map(item => ({
        cantidad: Number(item.cantidad || 0),
        precio: Number(item.precio || 0),
        descuento: Number(item.descuento || 0),
        descripcion: item.descripcion || item.producto || '',
        unidad: item.unidad || 'Unidad',
        codigo: item.codigo || null,
        tipoItem: item.tipoProducto === 'Bienes' ? 1 : 2
      })),
      totales: {
        totalCompra: this.calculos.totalCompra,
        descu: this.calculos.sumatoriaDescuentosItems || 0, // Suma de descuentos por ítem
        totalDescu: this.calculos.totalDescu,
        subTotal: this.subTotal,
        ivaRete1: this.ivaRetenido,
        reteRenta: this.retencionRenta,
        totalPagar: this.totalPagar,
        condicionOperacion: this.condicionOperacion,
        pagos: this.pagos.map(p => ({
          ...p,
          montoPago: p.montoPago || this.totalPagar // Fallback to total if 0
        })),
        observaciones: this.observaciones
      },
      retenciones: this.retenciones,
      descuentoGlobal: this.descuentoGlobal,
      ambiente: this.ambienteProduccion ? 'PRODUCCIÓN' : 'PRUEBAS'
    };

    const token = localStorage.getItem('auth_token');
    if (!token) {
      alert('Error: No ha iniciado sesión');
      this.generandoDTE = false;
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    this.http.post(`${environment.apiUrl}/dtes/generar`, datosDTE, {
      headers: headers,
      responseType: 'blob'
    }).subscribe({
      next: (pdfBlob: Blob) => {
        const url = window.URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `DTE-FSE-${new Date().getTime()}.pdf`;
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
