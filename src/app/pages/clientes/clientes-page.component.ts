import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
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

  constructor(
    private dteService: DteService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarEmpresa();
    this.cargarClientes();
    this.cargarSucursales();
    this.cargarProductos();
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
        precioConIva: p.precioConIva || p.precio || 0,
        unidadMedida: p.unidadMedida || 'UNIDAD'
      }));
    });
  }

  cambiarTab(tab: 'clientes' | 'sucursales' | 'productos'): void {
    this.tabActiva = tab;
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
    this.mostrarModalCrearProducto = false;
    this.productos = [...this.productos, {
      id: `p${this.productos.length + 1}`,
      nombre: producto.nombre,
      precioConIva: producto.precioConIva,
      unidadMedida: producto.unidadMedida || 'UNIDAD',
      fechaCreacion: producto.fechaCreacion
    }];
  }
}
