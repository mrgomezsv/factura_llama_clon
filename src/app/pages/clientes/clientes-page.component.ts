import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DteService } from '../../services/dte.service';
import { AddButtonDropdownComponent } from '../../components/add-button-dropdown/add-button-dropdown.component';
import { CrearClienteModalComponent } from '../../components/crear-cliente-modal/crear-cliente-modal.component';

@Component({
  selector: 'app-clientes-page',
  standalone: true,
  imports: [CommonModule, AddButtonDropdownComponent, CrearClienteModalComponent],
  templateUrl: './clientes-page.component.html',
  styleUrl: './clientes-page.component.scss'
})
export class ClientesPageComponent implements OnInit {
  tabActiva: 'clientes' | 'sucursales' | 'productos' = 'clientes';
  clientes: any[] = [];
  empresaSeleccionada: any = null;
  mostrarModalCrearCliente = false;

  constructor(
    private dteService: DteService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarEmpresa();
    this.cargarClientes();
  }

  cargarEmpresa(): void {
    this.dteService.getEmpresas().subscribe(empresas => {
      if (empresas.length > 0) {
        // Mock empresa con datos completos
        this.empresaSeleccionada = {
          ...empresas[0],
          id: '6f75b035-498f-4a39-b051-74ffe08487d1',
          nombreLegal: 'ANA GLADYS CORDOVA LOPEZ',
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

  cambiarTab(tab: 'clientes' | 'sucursales' | 'productos'): void {
    this.tabActiva = tab;
  }

  navegarAInicio(): void {
    this.router.navigateByUrl('/');
  }

  manejarOpcionSeleccionada(opcion: string): void {
    if (opcion === 'nuevo-cliente') {
      this.mostrarModalCrearCliente = true;
    } else if (opcion === 'nueva-sucursal') {
      // TODO: Implementar
    } else if (opcion === 'nuevo-producto') {
      // TODO: Implementar
    }
  }

  onClienteCreado(cliente: any): void {
    this.mostrarModalCrearCliente = false;
    // Agregar el nuevo cliente a la lista
    this.clientes = [...this.clientes, {
      id: `c${this.clientes.length + 1}`,
      nombre: cliente.nombre,
      correo: cliente.correoElectronico,
      fechaCreacion: cliente.fechaCreacion
    }];
  }
}

