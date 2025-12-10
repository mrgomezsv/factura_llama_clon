import { Component, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { DteService } from '../../services/dte.service';
import { AddButtonDropdownComponent } from '../../components/add-button-dropdown/add-button-dropdown.component';
import { CrearClienteModalComponent } from '../../components/crear-cliente-modal/crear-cliente-modal.component';
import { CrearSucursalModalComponent } from '../../components/crear-sucursal-modal/crear-sucursal-modal.component';
import { CrearProductoModalComponent } from '../../components/crear-producto-modal/crear-producto-modal.component';

@Component({
  selector: 'app-clientes-page',
  standalone: true,
  imports: [
    CommonModule, 
    AddButtonDropdownComponent, 
    CrearClienteModalComponent,
    CrearSucursalModalComponent,
    CrearProductoModalComponent
  ],
  templateUrl: './clientes-page.component.html',
  styleUrl: './clientes-page.component.scss'
})
export class ClientesPageComponent implements OnInit {
  tabActiva: 'clientes' | 'sucursales' | 'productos' = 'clientes';
  clientes: any[] = [];
  sucursales: any[] = [];
  productos: any[] = [];
  empresaSeleccionada: any = null;
  mostrarModalCrearCliente = false;
  mostrarModalCrearSucursal = false;
  mostrarModalCrearProducto = false;
  productoParaEditar: any = null;
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
        fechaCreacion: c.fechaCreacion || '27/10/2025 13:23:04'
      }));
    });
  }

  cargarSucursales(): void {
    this.dteService.getSucursales().subscribe(sucursales => {
      this.sucursales = sucursales.map((s: any) => ({
        ...s,
        fechaCreacion: s.fechaCreacion || '25/03/2025 11:16:18'
      }));
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
    });
  }

  cambiarTab(tab: 'clientes' | 'sucursales' | 'productos'): void {
    // Cambiar el tab primero sin navegar para evitar flicker
    const tabAnterior = this.tabActiva;
    this.tabActiva = tab;
    
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

  navegarAInicio(): void {
    this.router.navigateByUrl('/dtes');
  }

  manejarOpcionSeleccionada(opcion: string): void {
    if (opcion === 'nuevo-cliente') {
      this.mostrarModalCrearCliente = true;
    } else if (opcion === 'nueva-sucursal') {
      this.mostrarModalCrearSucursal = true;
    } else if (opcion === 'nuevo-producto') {
      this.productoParaEditar = null;
      this.mostrarModalCrearProducto = true;
    }
  }

  onClienteCreado(cliente: any): void {
    this.mostrarModalCrearCliente = false;
    this.clientes = [...this.clientes, {
      id: `c${this.clientes.length + 1}`,
      nombre: cliente.nombre,
      correo: cliente.correoElectronico,
      fechaCreacion: cliente.fechaCreacion
    }];
  }

  onSucursalCreada(sucursal: any): void {
    this.mostrarModalCrearSucursal = false;
    this.sucursales = [...this.sucursales, {
      id: `s${this.sucursales.length + 1}`,
      nombre: sucursal.nombre,
      tipoSucursal: sucursal.tipoSucursal,
      direccion: sucursal.direccion,
      fechaCreacion: sucursal.fechaCreacion
    }];
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
    if (confirm(`¿Estás seguro de que deseas eliminar el producto "${producto.nombre}"?`)) {
      if (producto.id) {
        this.dteService.deleteProducto(producto.id).subscribe(() => {
          this.cargarProductos();
        });
      }
    }
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
    // TODO: Implementar edición de cliente
    console.log('Editar cliente:', cliente);
  }

  eliminarCliente(cliente: any): void {
    this.cerrarClienteDropdown();
    // TODO: Implementar eliminación de cliente
    console.log('Eliminar cliente:', cliente);
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
    // TODO: Implementar edición de sucursal
    console.log('Editar sucursal:', sucursal);
  }

  eliminarSucursal(sucursal: any): void {
    this.cerrarSucursalDropdown();
    // TODO: Implementar eliminación de sucursal
    console.log('Eliminar sucursal:', sucursal);
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
}
