import { Component, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { DteService } from '../../services/dte.service';
import { AddButtonDropdownComponent } from '../../components/add-button-dropdown/add-button-dropdown.component';
import { CrearClienteModalComponent } from '../../components/crear-cliente-modal/crear-cliente-modal.component';
import { CrearSucursalModalComponent } from '../../components/crear-sucursal-modal/crear-sucursal-modal.component';
import { CrearProductoModalComponent } from '../../components/crear-producto-modal/crear-producto-modal.component';
import { ConfirmarEliminacionModalComponent } from '../../components/confirmar-eliminacion-modal/confirmar-eliminacion-modal.component';

@Component({
  selector: 'app-clientes-page',
  standalone: true,
  imports: [
    CommonModule, 
    AddButtonDropdownComponent, 
    CrearClienteModalComponent,
    CrearSucursalModalComponent,
    CrearProductoModalComponent,
    ConfirmarEliminacionModalComponent
  ],
  templateUrl: './clientes-page.component.html',
  styleUrl: './clientes-page.component.scss'
})
export class ClientesPageComponent implements OnInit {
  tabActiva: 'clientes' | 'sucursales' | 'productos' = 'clientes';
  clientes: any[] = [];
  sucursales: any[] = [];
  productos: any[] = [];
  clientesFiltrados: any[] = [];
  sucursalesFiltradas: any[] = [];
  productosFiltrados: any[] = [];
  terminoBusqueda: string = '';
  empresaSeleccionada: any = null;
  mostrarModalCrearCliente = false;
  mostrarModalCrearSucursal = false;
  mostrarModalCrearProducto = false;
  mostrarModalConfirmarEliminacion = false;
  productoParaEditar: any = null;
  sucursalParaEditar: any = null;
  clienteParaEditar: any = null;
  itemAEliminar: { tipo: 'cliente' | 'sucursal' | 'producto', item: any } | null = null;
  productoDropdownAbierto: number | null = null;
  clienteDropdownAbierto: number | null = null;
  sucursalDropdownAbierto: number | null = null;
  empresaInfoDropdownAbierto = false;
  filtrosDropdownAbierto = false;
  
  // Flags para evitar recargas innecesarias
  private datosCargados = false;

  constructor(
    private dteService: DteService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.determinarTabDesdeRuta();
    
    // Inicializar arrays filtrados
    this.clientesFiltrados = [];
    this.sucursalesFiltradas = [];
    this.productosFiltrados = [];
    
    // Cargar datos solo si no se han cargado antes
    if (!this.datosCargados) {
      this.cargarEmpresa();
      this.cargarClientes();
      this.cargarSucursales();
      this.cargarProductos();
      this.datosCargados = true;
    }

    // Suscribirse a cambios de ruta
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.determinarTabDesdeRuta();
      });
  }

  determinarTabDesdeRuta(): void {
    const url = this.router.url;
    if (url.includes('/productos')) {
      this.tabActiva = 'productos';
    } else if (url.includes('/sucursales')) {
      this.tabActiva = 'sucursales';
    } else if (url.includes('/clientes')) {
      this.tabActiva = 'clientes';
    }
    // Aplicar filtros según el tab activo
    if (this.tabActiva === 'clientes') {
      this.filtrarClientes();
    } else if (this.tabActiva === 'sucursales') {
      this.filtrarSucursales();
    } else if (this.tabActiva === 'productos') {
      this.filtrarProductos();
    }
  }

  cargarEmpresa(): void {
    this.dteService.getEmpresas().subscribe(empresas => {
      if (empresas.length > 0) {
        // Mock empresa con datos completos
        this.empresaSeleccionada = {
          ...empresas[0],
          id: '6f75b035-498f-4a39-b051-74ffe08487d1',
          nombreLegal: 'MARIO ROBERTO GOMEZ MARTINEZ',
          nrc: '1712106',
          actividadesEconomicas: [
            'Venta al por mayor de otros artículos textiles n.c.p.',
            'Peluquería y otros tratamientos de belleza'
          ],
          nit: '06142403770051',
          direccion: 'Boulevard Sur, CC Pinares de Suiza Local 2',
          complemento: '-',
          departamento: 'La Libertad',
          municipio: 'Santa Tecla',
          codigoMH: 'M001',
          puntosVenta: 1,
          telefono: '77216503',
          email: 'anagladyscordovalopez@gmail.com',
          website: '-'
        };
      }
    });
  }

  cargarClientes(): void {
    this.dteService.getClientes().subscribe(clientes => {
      this.clientes = clientes.map((c: any) => ({
        ...c,
        correo: c.correo || '',
        fechaCreacion: c.fechaCreacion || '27/10/2025 13:23:04'
      }));
      this.filtrarClientes();
    });
  }

  cargarSucursales(): void {
    this.dteService.getSucursales().subscribe(sucursales => {
      this.sucursales = sucursales.map((s: any) => ({
        ...s,
        fechaCreacion: s.fechaCreacion || '25/03/2025 11:16:18'
      }));
      this.filtrarSucursales();
    });
  }

  cargarProductos(): void {
    this.dteService.getProductos().subscribe(productos => {
      this.productos = productos.map((p: any) => ({
        ...p,
        fechaCreacion: p.fechaCreacion || '25/03/2025 11:16:18',
        precioConIva: p.precioConIva || 0,
        unidadMedida: p.unidadMedida || 'UNIDAD'
      }));
      this.filtrarProductos();
    });
  }


  navegarAInicio(): void {
    this.router.navigateByUrl('/dtes');
  }

  manejarOpcionSeleccionada(opcion: string): void {
    if (opcion === 'nuevo-cliente') {
      this.clienteParaEditar = null;
      this.mostrarModalCrearCliente = true;
    } else if (opcion === 'nueva-sucursal') {
      this.sucursalParaEditar = null;
      this.mostrarModalCrearSucursal = true;
    } else if (opcion === 'nuevo-producto') {
      this.productoParaEditar = null;
      this.mostrarModalCrearProducto = true;
    }
  }

  onClienteCreado(cliente: any): void {
    this.dteService.saveCliente({
      nombre: cliente.nombre,
      alias: cliente.alias,
      nombreComercial: cliente.nombreComercial,
      correoElectronico: cliente.correoElectronico,
      telefono: cliente.telefono,
      tipoPersona: cliente.tipoPersona,
      clasificacionTributaria: cliente.clasificacionTributaria,
      esSujetoExcluido: cliente.esSujetoExcluido,
      tipoDocumento: cliente.tipoDocumento,
      numeroDocumento: cliente.numeroDocumento,
      nrc: cliente.nrc,
      actividadEconomica: cliente.actividadEconomica,
      pais: cliente.pais,
      departamento: cliente.departamento,
      municipio: cliente.municipio,
      direccion: cliente.direccion
    }).subscribe(() => {
      this.mostrarModalCrearCliente = false;
      this.clienteParaEditar = null;
      this.cargarClientes();
    });
  }

  onClienteActualizado(cliente: any): void {
    if (cliente.id) {
      this.dteService.updateCliente(cliente.id, {
        nombre: cliente.nombre,
        alias: cliente.alias,
        nombreComercial: cliente.nombreComercial,
        correoElectronico: cliente.correoElectronico,
        telefono: cliente.telefono,
        tipoPersona: cliente.tipoPersona,
        clasificacionTributaria: cliente.clasificacionTributaria,
        esSujetoExcluido: cliente.esSujetoExcluido,
        tipoDocumento: cliente.tipoDocumento,
        numeroDocumento: cliente.numeroDocumento,
        nrc: cliente.nrc,
        actividadEconomica: cliente.actividadEconomica,
        pais: cliente.pais,
        departamento: cliente.departamento,
        municipio: cliente.municipio,
        direccion: cliente.direccion
      }).subscribe(() => {
        this.mostrarModalCrearCliente = false;
        this.clienteParaEditar = null;
        this.cargarClientes();
      });
    }
  }

  onSucursalCreada(sucursal: any): void {
    this.dteService.saveSucursal({
      nombre: sucursal.nombre,
      direccion: sucursal.direccion,
      telefono: sucursal.telefono,
      tipoSucursal: sucursal.tipoSucursal,
      complemento: sucursal.complemento,
      correoElectronico: sucursal.correoElectronico,
      departamento: sucursal.departamento,
      municipio: sucursal.municipio,
      codigoMH: sucursal.codigoMH,
      puntosVenta: sucursal.puntosVenta
    }).subscribe(() => {
      this.mostrarModalCrearSucursal = false;
      this.sucursalParaEditar = null;
      this.cargarSucursales();
    });
  }

  onSucursalActualizada(sucursal: any): void {
    if (sucursal.id) {
      this.dteService.updateSucursal(sucursal.id, {
        nombre: sucursal.nombre,
        direccion: sucursal.direccion,
        telefono: sucursal.telefono,
        tipoSucursal: sucursal.tipoSucursal,
        complemento: sucursal.complemento,
        correoElectronico: sucursal.correoElectronico,
        departamento: sucursal.departamento,
        municipio: sucursal.municipio,
        codigoMH: sucursal.codigoMH,
        puntosVenta: sucursal.puntosVenta
      }).subscribe(() => {
        this.mostrarModalCrearSucursal = false;
        this.sucursalParaEditar = null;
        this.cargarSucursales();
      });
    }
  }

  onProductoCreado(producto: any): void {
    this.dteService.saveProducto({
      nombre: producto.nombre,
      codigo: producto.codigo || producto.codigoInterno,
      descripcion: producto.descripcion,
      precioConIva: producto.precioConIva,
      unidadMedida: producto.unidadMedida || 'Otra'
    }).subscribe(() => {
      this.mostrarModalCrearProducto = false;
      this.productoParaEditar = null;
      this.cargarProductos();
    });
  }

  onProductoActualizado(producto: any): void {
    if (producto.id) {
      this.dteService.updateProducto(producto.id, {
        nombre: producto.nombre,
        codigo: producto.codigo || producto.codigoInterno,
        descripcion: producto.descripcion,
        precioConIva: producto.precioConIva,
        unidadMedida: producto.unidadMedida || 'Otra'
      }).subscribe(() => {
        this.mostrarModalCrearProducto = false;
        this.productoParaEditar = null;
        this.cargarProductos();
      });
    }
  }

  toggleProductoDropdown(index: number, event: Event): void {
    event.stopPropagation();
    this.productoDropdownAbierto = this.productoDropdownAbierto === index ? null : index;
    this.clienteDropdownAbierto = null;
    this.sucursalDropdownAbierto = null;
  }

  cerrarProductoDropdown(): void {
    this.productoDropdownAbierto = null;
  }

  editarProducto(producto: any): void {
    this.cerrarProductoDropdown();
    this.productoParaEditar = producto;
    this.mostrarModalCrearProducto = true;
  }

  eliminarProducto(producto: any): void {
    this.cerrarProductoDropdown();
    this.itemAEliminar = { tipo: 'producto', item: producto };
    this.mostrarModalConfirmarEliminacion = true;
  }

  toggleClienteDropdown(index: number, event: Event): void {
    event.stopPropagation();
    this.clienteDropdownAbierto = this.clienteDropdownAbierto === index ? null : index;
    this.productoDropdownAbierto = null;
    this.sucursalDropdownAbierto = null;
  }

  cerrarClienteDropdown(): void {
    this.clienteDropdownAbierto = null;
  }

  editarCliente(cliente: any): void {
    this.cerrarClienteDropdown();
    this.clienteParaEditar = cliente;
    this.mostrarModalCrearCliente = true;
  }

  eliminarCliente(cliente: any): void {
    this.cerrarClienteDropdown();
    this.itemAEliminar = { tipo: 'cliente', item: cliente };
    this.mostrarModalConfirmarEliminacion = true;
  }

  toggleSucursalDropdown(index: number, event: Event): void {
    event.stopPropagation();
    this.sucursalDropdownAbierto = this.sucursalDropdownAbierto === index ? null : index;
    this.productoDropdownAbierto = null;
    this.clienteDropdownAbierto = null;
  }

  cerrarSucursalDropdown(): void {
    this.sucursalDropdownAbierto = null;
  }

  editarSucursal(sucursal: any): void {
    this.cerrarSucursalDropdown();
    this.sucursalParaEditar = sucursal;
    this.mostrarModalCrearSucursal = true;
  }

  eliminarSucursal(sucursal: any): void {
    this.cerrarSucursalDropdown();
    this.itemAEliminar = { tipo: 'sucursal', item: sucursal };
    this.mostrarModalConfirmarEliminacion = true;
  }

  toggleEmpresaInfoDropdown(event: Event): void {
    event.stopPropagation();
    this.empresaInfoDropdownAbierto = !this.empresaInfoDropdownAbierto;
    this.productoDropdownAbierto = null;
    this.clienteDropdownAbierto = null;
    this.sucursalDropdownAbierto = null;
  }

  cerrarEmpresaInfoDropdown(): void {
    this.empresaInfoDropdownAbierto = false;
  }

  editarEmpresaInfo(): void {
    this.cerrarEmpresaInfoDropdown();
    // TODO: Implementar edición de información de empresa
    console.log('Editar información de empresa:', this.empresaSeleccionada);
  }

  toggleFiltrosDropdown(event: Event): void {
    event.stopPropagation();
    this.filtrosDropdownAbierto = !this.filtrosDropdownAbierto;
    // Cerrar otros dropdowns
    this.productoDropdownAbierto = null;
    this.clienteDropdownAbierto = null;
    this.sucursalDropdownAbierto = null;
    this.empresaInfoDropdownAbierto = false;
  }

  cerrarFiltrosDropdown(): void {
    this.filtrosDropdownAbierto = false;
  }

  @HostListener('document:click', ['$event'])
  clickOutside(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.producto-menu-container') && 
        !target.closest('.cliente-menu-container') && 
        !target.closest('.sucursal-menu-container') &&
        !target.closest('.empresa-info-menu-container') &&
        !target.closest('.filtros-container')) {
      this.cerrarProductoDropdown();
      this.cerrarClienteDropdown();
      this.cerrarSucursalDropdown();
      this.cerrarEmpresaInfoDropdown();
      this.cerrarFiltrosDropdown();
    }
  }

  onBusquedaChange(termino: string): void {
    this.terminoBusqueda = termino.toLowerCase().trim();
    if (this.tabActiva === 'clientes') {
      this.filtrarClientes();
    } else if (this.tabActiva === 'sucursales') {
      this.filtrarSucursales();
    } else if (this.tabActiva === 'productos') {
      this.filtrarProductos();
    }
  }

  filtrarClientes(): void {
    if (!this.terminoBusqueda) {
      this.clientesFiltrados = [...this.clientes];
      return;
    }

    this.clientesFiltrados = this.clientes.filter(cliente => {
      const nombre = (cliente.nombre || '').toLowerCase();
      const correo = (cliente.correo || '').toLowerCase();
      const alias = (cliente.alias || '').toLowerCase();
      const nit = (cliente.nit || '').toLowerCase();
      const nrc = (cliente.nrc || '').toLowerCase();
      
      return nombre.includes(this.terminoBusqueda) ||
             correo.includes(this.terminoBusqueda) ||
             alias.includes(this.terminoBusqueda) ||
             nit.includes(this.terminoBusqueda) ||
             nrc.includes(this.terminoBusqueda);
    });
  }

  filtrarSucursales(): void {
    if (!this.terminoBusqueda) {
      this.sucursalesFiltradas = [...this.sucursales];
      return;
    }

    this.sucursalesFiltradas = this.sucursales.filter(sucursal => {
      const nombre = (sucursal.nombre || '').toLowerCase();
      const direccion = (sucursal.direccion || '').toLowerCase();
      const telefono = (sucursal.telefono || '').toLowerCase();
      const tipoSucursal = (sucursal.tipoSucursal || '').toLowerCase();
      
      return nombre.includes(this.terminoBusqueda) ||
             direccion.includes(this.terminoBusqueda) ||
             telefono.includes(this.terminoBusqueda) ||
             tipoSucursal.includes(this.terminoBusqueda);
    });
  }

  filtrarProductos(): void {
    if (!this.terminoBusqueda) {
      this.productosFiltrados = [...this.productos];
      return;
    }

    this.productosFiltrados = this.productos.filter(producto => {
      const nombre = (producto.nombre || '').toLowerCase();
      const codigo = (producto.codigo || producto.codigoInterno || '').toLowerCase();
      const descripcion = (producto.descripcion || '').toLowerCase();
      
      return nombre.includes(this.terminoBusqueda) ||
             codigo.includes(this.terminoBusqueda) ||
             descripcion.includes(this.terminoBusqueda);
    });
  }

  cambiarTab(tab: 'clientes' | 'sucursales' | 'productos'): void {
    // Cambiar el tab primero sin navegar para evitar flicker
    const tabAnterior = this.tabActiva;
    this.tabActiva = tab;
    
    // Limpiar búsqueda al cambiar de tab
    this.terminoBusqueda = '';
    
    // Aplicar filtros según el tab activo
    if (tab === 'clientes') {
      this.filtrarClientes();
    } else if (tab === 'sucursales') {
      this.filtrarSucursales();
    } else if (tab === 'productos') {
      this.filtrarProductos();
    }
    
    // Navegar a la ruta correspondiente sin refrescar la página
    // La estrategia de reutilización de rutas mantendrá el componente activo
    if (tab === 'productos') {
      this.router.navigateByUrl('/productos', { replaceUrl: false }).catch(() => {
        // Si falla la navegación, revertir el tab
        this.tabActiva = tabAnterior;
      });
    } else if (tab === 'sucursales') {
      this.router.navigateByUrl('/sucursales', { replaceUrl: false }).catch(() => {
        this.tabActiva = tabAnterior;
      });
    } else {
      this.router.navigateByUrl('/clientes', { replaceUrl: false }).catch(() => {
        this.tabActiva = tabAnterior;
      });
    }
  }

  onConfirmarEliminacion(): void {
    if (!this.itemAEliminar) return;

    const { tipo, item } = this.itemAEliminar;

    if (tipo === 'cliente' && item.id) {
      this.dteService.deleteCliente(item.id).subscribe(() => {
        this.cargarClientes();
        this.cerrarModalConfirmarEliminacion();
      });
    } else if (tipo === 'sucursal' && item.id) {
      this.dteService.deleteSucursal(item.id).subscribe(() => {
        this.cargarSucursales();
        this.cerrarModalConfirmarEliminacion();
      });
    } else if (tipo === 'producto' && item.id) {
      this.dteService.deleteProducto(item.id).subscribe(() => {
        this.cargarProductos();
        this.cerrarModalConfirmarEliminacion();
      });
    }
  }

  cerrarModalConfirmarEliminacion(): void {
    this.mostrarModalConfirmarEliminacion = false;
    this.itemAEliminar = null;
  }

  getMensajeEliminacion(): string {
    if (!this.itemAEliminar) return '';
    const { tipo, item } = this.itemAEliminar;
    const nombre = item.nombre || '';
    
    if (tipo === 'cliente') {
      return `¿Estás seguro de que deseas eliminar el cliente "${nombre}"?`;
    } else if (tipo === 'sucursal') {
      return `¿Estás seguro de que deseas eliminar la sucursal "${nombre}"?`;
    } else if (tipo === 'producto') {
      return `¿Estás seguro de que deseas eliminar el producto "${nombre}"?`;
    }
    return '';
  }
}
