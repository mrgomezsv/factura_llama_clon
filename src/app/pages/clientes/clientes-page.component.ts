import { Component, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { DteService } from '../../services/dte.service';
import { AddButtonDropdownComponent } from '../../components/add-button-dropdown/add-button-dropdown.component';
import { CrearClienteModalComponent } from '../../components/crear-cliente-modal/crear-cliente-modal.component';
import { CrearSucursalModalComponent } from '../../components/crear-sucursal-modal/crear-sucursal-modal.component';
import { CrearProductoModalComponent } from '../../components/crear-producto-modal/crear-producto-modal.component';
import { ConfirmarEliminacionModalComponent } from '../../components/confirmar-eliminacion-modal/confirmar-eliminacion-modal.component';
import { PaginacionComponent } from '../../components/paginacion/paginacion.component';

@Component({
  selector: 'app-clientes-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    AddButtonDropdownComponent, 
    CrearClienteModalComponent,
    CrearSucursalModalComponent,
    CrearProductoModalComponent,
    ConfirmarEliminacionModalComponent,
    PaginacionComponent
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
  
  // Paginación
  paginaActualClientes: number = 1;
  paginaActualProductos: number = 1;
  itemsPorPagina: number = 10;
  clientesPaginados: any[] = [];
  productosPaginados: any[] = [];
  
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
  productoDropdownAbierto: string | null = null; // Cambiar a ID en lugar de índice
  clienteDropdownAbierto: string | null = null; // Cambiar a ID en lugar de índice
  sucursalDropdownAbierto: number | null = null;
  empresaInfoDropdownAbierto = false;
  filtrosDropdownAbierto = false;
  
  // Estado de edición de empresa
  modoEdicionEmpresa = false;
  empresaForm: FormGroup;
  empresaImagenPreview: string | null = null;
  empresaImagenArchivo: File | null = null;
  
  // Flags para evitar recargas innecesarias
  private datosCargados = false;

  constructor(
    private dteService: DteService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder
  ) {
    this.empresaForm = this.fb.group({
      nombreLegal: [''],
      nombreComercial: [''],
      nrc: [''],
      nit: [''],
      direccion: [''],
      complemento: [''],
      departamento: [''],
      municipio: [''],
      codigoMH: [''],
      puntosVenta: [1],
      website: [''],
      telefono: [''],
      email: ['']
    });
  }

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
        this.empresaSeleccionada = empresas[0];
        // Cargar configuración de empresa (incluyendo logo)
        if (this.empresaSeleccionada.id) {
          this.dteService.getEmpresaConfig(this.empresaSeleccionada.id).subscribe(config => {
            if (config && config.logoUrl) {
              this.empresaSeleccionada.logo = config.logoUrl;
              // Si estamos en modo edición, actualizar el preview
              if (this.modoEdicionEmpresa) {
                this.empresaImagenPreview = config.logoUrl;
              }
            }
          });
        }
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
    const producto = this.productosPaginados[index];
    if (!producto) return;
    // Usar el ID del producto en lugar del índice
    this.productoDropdownAbierto = this.productoDropdownAbierto === producto.id ? null : producto.id;
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
    const cliente = this.clientesPaginados[index];
    if (!cliente) return;
    // Usar el ID del cliente en lugar del índice
    this.clienteDropdownAbierto = this.clienteDropdownAbierto === cliente.id ? null : cliente.id;
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
    this.modoEdicionEmpresa = true;
    
    // Cargar datos actuales en el formulario
    if (this.empresaSeleccionada && this.empresaSeleccionada.id) {
      // Cargar configuración completa desde la base de datos
      this.dteService.getEmpresaConfig(this.empresaSeleccionada.id).subscribe(config => {
        if (config) {
          this.empresaForm.patchValue({
            nombreLegal: config.nombreLegal || this.empresaSeleccionada.nombreLegal || '',
            nombreComercial: config.nombreComercial || this.empresaSeleccionada.nombre || '',
            nrc: config.nrc || this.empresaSeleccionada.nrc || '',
            nit: config.nit || this.empresaSeleccionada.nit || '',
            direccion: config.direccion || this.empresaSeleccionada.direccion || '',
            complemento: this.empresaSeleccionada.complemento || '',
            departamento: this.empresaSeleccionada.departamento || '',
            municipio: this.empresaSeleccionada.municipio || '',
            codigoMH: config.codigoMH || this.empresaSeleccionada.codigoMH || '',
            puntosVenta: config.puntosVenta || this.empresaSeleccionada.puntosVenta || 1,
            website: config.sitioWeb || this.empresaSeleccionada.website || '',
            telefono: config.telefono || this.empresaSeleccionada.telefono || '',
            email: config.correo || this.empresaSeleccionada.email || ''
          });
          
          // Cargar imagen desde la base de datos
          if (config.logoUrl) {
            this.empresaImagenPreview = config.logoUrl;
          } else if (this.empresaSeleccionada.logo) {
            this.empresaImagenPreview = this.empresaSeleccionada.logo;
          }
        } else {
          // Si no hay configuración, usar datos del objeto empresa
          this.empresaForm.patchValue({
            nombreLegal: this.empresaSeleccionada.nombreLegal || '',
            nombreComercial: this.empresaSeleccionada.nombre || '',
            nrc: this.empresaSeleccionada.nrc || '',
            nit: this.empresaSeleccionada.nit || '',
            direccion: this.empresaSeleccionada.direccion || '',
            complemento: this.empresaSeleccionada.complemento || '',
            departamento: this.empresaSeleccionada.departamento || '',
            municipio: this.empresaSeleccionada.municipio || '',
            codigoMH: this.empresaSeleccionada.codigoMH || '',
            puntosVenta: this.empresaSeleccionada.puntosVenta || 1,
            website: this.empresaSeleccionada.website || '',
            telefono: this.empresaSeleccionada.telefono || '',
            email: this.empresaSeleccionada.email || ''
          });
          
          // Si hay imagen, cargar preview
          if (this.empresaSeleccionada.logo) {
            this.empresaImagenPreview = this.empresaSeleccionada.logo;
          }
        }
      });
    }
  }

  cancelarEdicionEmpresa(): void {
    this.modoEdicionEmpresa = false;
    // Restaurar el logo original si existe
    if (this.empresaSeleccionada && this.empresaSeleccionada.logo) {
      // El logo ya está en empresaSeleccionada.logo, no necesitamos hacer nada
    }
    this.empresaImagenPreview = null;
    this.empresaImagenArchivo = null;
    this.empresaForm.reset();
  }

  guardarEmpresaInfo(): void {
    if (!this.empresaSeleccionada || !this.empresaSeleccionada.id) {
      return;
    }

    const formValue = this.empresaForm.value;
    
    // Guardar configuración de empresa (incluyendo logo)
    this.dteService.saveEmpresaConfig(this.empresaSeleccionada.id, {
      nombreLegal: formValue.nombreLegal,
      nombreComercial: formValue.nombreComercial,
      nit: formValue.nit,
      nrc: formValue.nrc,
      direccion: formValue.direccion,
      codigoMH: formValue.codigoMH,
      puntosVenta: formValue.puntosVenta,
      sitioWeb: formValue.website,
      telefono: formValue.telefono,
      correo: formValue.email,
      logoUrl: this.empresaImagenPreview || undefined
    }).subscribe({
      next: () => {
        // Actualizar datos locales (incluyendo logo)
        if (this.empresaSeleccionada) {
          this.empresaSeleccionada.nombreLegal = formValue.nombreLegal;
          this.empresaSeleccionada.nombre = formValue.nombreComercial;
          this.empresaSeleccionada.nrc = formValue.nrc;
          this.empresaSeleccionada.nit = formValue.nit;
          this.empresaSeleccionada.direccion = formValue.direccion;
          this.empresaSeleccionada.complemento = formValue.complemento;
          this.empresaSeleccionada.departamento = formValue.departamento;
          this.empresaSeleccionada.municipio = formValue.municipio;
          this.empresaSeleccionada.codigoMH = formValue.codigoMH;
          this.empresaSeleccionada.puntosVenta = formValue.puntosVenta;
          this.empresaSeleccionada.website = formValue.website;
          this.empresaSeleccionada.telefono = formValue.telefono;
          this.empresaSeleccionada.email = formValue.email;
          // Guardar el logo en el objeto empresa antes de limpiar el preview
          if (this.empresaImagenPreview) {
            this.empresaSeleccionada.logo = this.empresaImagenPreview;
          }
        }
        
        // Salir del modo edición y limpiar variables temporales
        this.modoEdicionEmpresa = false;
        this.empresaImagenPreview = null;
        this.empresaImagenArchivo = null;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al guardar información de empresa:', error);
        alert('Error al guardar la información. Por favor, intenta nuevamente.');
      }
    });
  }

  onImagenEmpresaSeleccionada(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecciona un archivo de imagen válido.');
        return;
      }
      
      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('La imagen no debe superar los 5MB.');
        return;
      }
      
      this.empresaImagenArchivo = file;
      
      // Crear preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.empresaImagenPreview = e.target.result;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    }
  }

  abrirSelectorImagen(): void {
    // Solo permitir editar imagen si estamos en modo edición
    if (!this.modoEdicionEmpresa) {
      return;
    }
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: Event) => this.onImagenEmpresaSeleccionada(e);
    input.click();
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
    } else {
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
    // Resetear a página 1 cuando se filtra
    this.paginaActualClientes = 1;
    this.actualizarClientesPaginados();
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
    } else {
      this.productosFiltrados = this.productos.filter(producto => {
        const nombre = (producto.nombre || '').toLowerCase();
        const codigo = (producto.codigo || producto.codigoInterno || '').toLowerCase();
        const descripcion = (producto.descripcion || '').toLowerCase();
        
        return nombre.includes(this.terminoBusqueda) ||
               codigo.includes(this.terminoBusqueda) ||
               descripcion.includes(this.terminoBusqueda);
      });
    }
    // Resetear a página 1 cuando se filtra
    this.paginaActualProductos = 1;
    this.actualizarProductosPaginados();
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

  // Métodos de paginación
  actualizarClientesPaginados(): void {
    const inicio = (this.paginaActualClientes - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    this.clientesPaginados = this.clientesFiltrados.slice(inicio, fin);
  }

  actualizarProductosPaginados(): void {
    const inicio = (this.paginaActualProductos - 1) * this.itemsPorPagina;
    const fin = inicio + this.itemsPorPagina;
    this.productosPaginados = this.productosFiltrados.slice(inicio, fin);
  }

  cambiarPaginaClientes(pagina: number): void {
    this.paginaActualClientes = pagina;
    this.actualizarClientesPaginados();
  }

  cambiarPaginaProductos(pagina: number): void {
    this.paginaActualProductos = pagina;
    this.actualizarProductosPaginados();
  }

  get totalPaginasClientes(): number {
    return Math.ceil(this.clientesFiltrados.length / this.itemsPorPagina);
  }

  get totalPaginasProductos(): number {
    return Math.ceil(this.productosFiltrados.length / this.itemsPorPagina);
  }

}
