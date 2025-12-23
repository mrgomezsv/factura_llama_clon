import { Component, ViewChild, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NotaRemisionClienteComponent } from '../../components/nota-remision/cliente/cliente.component';
import { NotaRemisionSucursalComponent } from '../../components/nota-remision/sucursal/sucursal.component';
import { NotaRemisionRetencionesComponent } from '../../components/nota-remision/retenciones/retenciones.component';
import { NotaRemisionDescuentosComponent } from '../../components/nota-remision/descuentos/descuentos.component';
import { NotaRemisionResponsablesComponent } from '../../components/nota-remision/responsables/responsables.component';
import { NotaRemisionOtrosComponent } from '../../components/nota-remision/otros/otros.component';
import { NotaRemisionAppendicesComponent } from '../../components/nota-remision/appendices/appendices.component';
import { NotaRemisionItemsComponent } from '../../components/nota-remision/items/items.component';
import { FacturacionCalculationsService } from '../../services/facturacion-calculations.service';
import { DteService } from '../../services/dte.service';
import { AuthService } from '../../services/auth.service';
import { ItemFactura, Retenciones, ResultadosCalculoFacturacion } from '../../models/facturacion.model';
import { HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-nota-remision-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NotaRemisionClienteComponent,
    NotaRemisionSucursalComponent,
    NotaRemisionRetencionesComponent,
    NotaRemisionDescuentosComponent,
    NotaRemisionResponsablesComponent,
    NotaRemisionOtrosComponent,
    NotaRemisionAppendicesComponent,
    NotaRemisionItemsComponent
  ],
  templateUrl: './nota-remision-page.component.html',
  styleUrl: './nota-remision-page.component.scss'
})
export class NotaRemisionPageComponent {
  @ViewChild(NotaRemisionItemsComponent) itemsComponent!: NotaRemisionItemsComponent;

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
      tipoDte: 'REM' // Nota de Remisión - gravada
    });
  }

  activeMenuIndex: number | null = null;

  eliminarItem(index: number): void {
    if (this.itemsComponent) {
      this.itemsComponent.eliminarItem(index);
      this.activeMenuIndex = null; // Cerrar menu al eliminar
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
      tipoDte: 'REM',
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
      console.error('No hay token de autenticación');
      alert('Error: No ha iniciado sesión o la sesión ha expirado');
      this.generandoDTE = false;
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token} `
    });

    this.http.post('http://localhost:3000/api/dtes/generar', datosDTE, {
      headers: headers,
      responseType: 'blob'
    }).subscribe({
      next: (pdfBlob: Blob) => {
        const url = window.URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `DTE - REM - ${new Date().getTime()}.pdf`;
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
