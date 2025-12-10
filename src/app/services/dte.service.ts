import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, switchMap, first } from 'rxjs/operators';
import { DTE } from '../models/dte.model';
import { Empresa } from '../models/empresa.model';
import { PeriodoTributario } from '../models/periodo-tributario.model';
import { TipoDTE } from '../models/tipo-dte.model';
import { DatabaseService } from './database.service';

@Injectable({
  providedIn: 'root'
})
export class DteService {
  constructor(private database: DatabaseService) {}

  /**
   * Obtiene todos los DTEs
   */
  getDTEs(filtro?: { tipoTab?: 'enviados' | 'recibidos', periodo?: PeriodoTributario }): Observable<DTE[]> {
    return this.database.isReady$.pipe(
      first(ready => ready),
      switchMap(() => {
        let sql = 'SELECT control_number, tipo, receptor, total, ambiente, fecha_creacion FROM dtes WHERE 1=1';
        const params: any[] = [];

        // Filtrar por período si se proporciona
        if (filtro?.periodo) {
          const mes = filtro.periodo.mes;
          const año = filtro.periodo.año;
          sql += ' AND strftime("%m", fecha_creacion) = ? AND strftime("%Y", fecha_creacion) = ?';
          params.push(String(mes).padStart(2, '0'), String(año));
        }

        sql += ' ORDER BY fecha_creacion DESC';

        return this.database.query<{
          control_number: string;
          tipo: string;
          receptor: string;
          total: number;
          ambiente: string;
          fecha_creacion: string;
        }>(sql, params);
      }),
      map(rows => {
        return rows.map(row => {
          return DTE.fromJson({
            controlNumber: row.control_number,
            tipo: row.tipo,
            receptor: row.receptor,
            total: row.total,
            ambiente: row.ambiente,
            fechaCreacion: row.fecha_creacion
          });
        });
      })
    );
  }

  /**
   * Obtiene un DTE por número de control
   */
  getDTEByControlNumber(controlNumber: string): Observable<DTE | null> {
    return this.database.isReady$.pipe(
      first(ready => ready),
      switchMap(() => {
        return this.database.query<{
          control_number: string;
          tipo: string;
          receptor: string;
          total: number;
          ambiente: string;
          fecha_creacion: string;
        }>(
          'SELECT control_number, tipo, receptor, total, ambiente, fecha_creacion FROM dtes WHERE control_number = ?',
          [controlNumber]
        );
      }),
      map(rows => {
        if (rows.length === 0) return null;
        const row = rows[0];
        return DTE.fromJson({
          controlNumber: row.control_number,
          tipo: row.tipo,
          receptor: row.receptor,
          total: row.total,
          ambiente: row.ambiente,
          fechaCreacion: row.fecha_creacion
        });
      })
    );
  }

  /**
   * Guarda un nuevo DTE
   */
  saveDTE(dte: {
    controlNumber: string;
    tipo: string;
    receptor: string;
    total: number;
    ambiente: 'PRODUCCIÓN' | 'PRUEBAS';
    fechaCreacion: Date | string;
    empresaId?: string;
    clienteId?: string;
    estado?: string;
  }): Observable<number> {
    return this.database.isReady$.pipe(
      first(ready => ready),
      switchMap(() => {
        const fechaCreacion = dte.fechaCreacion instanceof Date 
          ? dte.fechaCreacion.toISOString() 
          : dte.fechaCreacion;

        return this.database.execute(
          `INSERT INTO dtes (control_number, tipo, receptor, total, ambiente, fecha_creacion, empresa_id, cliente_id, estado)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            dte.controlNumber,
            dte.tipo,
            dte.receptor,
            dte.total,
            dte.ambiente,
            fechaCreacion,
            dte.empresaId || null,
            dte.clienteId || null,
            dte.estado || 'BORRADOR'
          ]
        );
      })
    );
  }

  /**
   * Obtiene todos los clientes
   */
  getClientes(): Observable<{ id: string; nombre: string; correo: string }[]> {
    return this.database.isReady$.pipe(
      first(ready => ready),
      switchMap(() => {
        return this.database.query<{ id: string; nombre: string; correo: string | null }>(
          'SELECT id, nombre, correo FROM clientes WHERE active = 1 ORDER BY nombre'
        );
      }),
      map(rows => {
        return rows.map(row => ({
          id: row.id,
          nombre: row.nombre,
          correo: row.correo || ''
        }));
      })
    );
  }

  /**
   * Guarda un nuevo cliente
   */
  saveCliente(cliente: {
    nombre: string;
    correo?: string;
    nit?: string;
    nrc?: string;
    direccion?: string;
    telefono?: string;
  }): Observable<string> {
    return this.database.isReady$.pipe(
      first(ready => ready),
      switchMap(() => {
        const id = 'c' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        return this.database.execute(
          'INSERT INTO clientes (id, nombre, correo, nit, nrc, direccion, telefono) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [id, cliente.nombre, cliente.correo || null, cliente.nit || null, cliente.nrc || null, cliente.direccion || null, cliente.telefono || null]
        ).pipe(
          map(() => id)
        );
      })
    );
  }

  /**
   * Obtiene todas las sucursales
   */
  getSucursales(): Observable<{ id: string; nombre: string }[]> {
    return this.database.isReady$.pipe(
      first(ready => ready),
      switchMap(() => {
        return this.database.query<{ id: string; nombre: string }>(
          'SELECT id, nombre FROM sucursales WHERE active = 1 ORDER BY nombre'
        );
      })
    );
  }

  /**
   * Guarda una nueva sucursal
   */
  saveSucursal(sucursal: {
    nombre: string;
    direccion?: string;
    telefono?: string;
    empresaId?: string;
  }): Observable<string> {
    return this.database.isReady$.pipe(
      first(ready => ready),
      switchMap(() => {
        const id = 's' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        return this.database.execute(
          'INSERT INTO sucursales (id, nombre, direccion, telefono, empresa_id) VALUES (?, ?, ?, ?, ?)',
          [id, sucursal.nombre, sucursal.direccion || null, sucursal.telefono || null, sucursal.empresaId || null]
        ).pipe(
          map(() => id)
        );
      })
    );
  }

  /**
   * Obtiene todos los productos
   */
  getProductos(): Observable<{ 
    id: string; 
    nombre: string; 
    codigo?: string;
    descripcion?: string;
    precioConIva?: number;
    unidadMedida?: string;
    fechaCreacion?: string;
  }[]> {
    return this.database.isReady$.pipe(
      first(ready => ready),
      switchMap(() => {
        return this.database.query<{ 
          id: string; 
          nombre: string; 
          codigo: string | null;
          descripcion: string | null;
          precio_unitario: number;
          unidad_medida: string | null;
          created_at: string;
        }>(
          'SELECT id, nombre, codigo, descripcion, precio_unitario, unidad_medida, created_at FROM productos WHERE active = 1 ORDER BY created_at DESC'
        );
      }),
      map(rows => {
        return rows.map(row => ({
          id: row.id,
          nombre: row.nombre,
          codigo: row.codigo || undefined,
          descripcion: row.descripcion || undefined,
          precioConIva: row.precio_unitario || 0,
          unidadMedida: row.unidad_medida || 'UNIDAD',
          fechaCreacion: row.created_at ? new Date(row.created_at).toLocaleString('es-SV') : undefined
        }));
      })
    );
  }

  /**
   * Guarda un nuevo producto
   */
  saveProducto(producto: {
    nombre: string;
    codigo?: string;
    descripcion?: string;
    precioUnitario?: number;
    precioConIva?: number;
    unidadMedida?: string;
  }): Observable<string> {
    return this.database.isReady$.pipe(
      first(ready => ready),
      switchMap(() => {
        const id = 'p' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const precio = producto.precioConIva !== undefined ? producto.precioConIva : (producto.precioUnitario || 0);
        return this.database.execute(
          'INSERT INTO productos (id, nombre, codigo, descripcion, precio_unitario, unidad_medida) VALUES (?, ?, ?, ?, ?, ?)',
          [
            id,
            producto.nombre,
            producto.codigo || null,
            producto.descripcion || null,
            precio,
            producto.unidadMedida || null
          ]
        ).pipe(
          map(() => id)
        );
      })
    );
  }

  /**
   * Obtiene todas las formas de pago
   */
  getFormasPago(): Observable<{ id: string; nombre: string }[]> {
    return this.database.isReady$.pipe(
      first(ready => ready),
      switchMap(() => {
        return this.database.query<{ id: string; nombre: string }>(
          'SELECT id, nombre FROM formas_pago ORDER BY nombre'
        );
      })
    );
  }

  /**
   * Obtiene todas las empresas
   */
  getEmpresas(): Observable<Empresa[]> {
    return this.database.isReady$.pipe(
      first(ready => ready),
      switchMap(() => {
        return this.database.query<{ id: string; nombre: string; nit: string | null; direccion: string | null }>(
          'SELECT id, nombre, nit, direccion FROM empresas ORDER BY nombre'
        );
      }),
      map(rows => {
        return rows.map(row => new Empresa(
          row.id,
          row.nombre,
          row.nit || undefined,
          row.direccion || undefined
        ));
      })
    );
  }

  /**
   * Guarda una nueva empresa
   */
  saveEmpresa(empresa: {
    nombre: string;
    nit?: string;
    direccion?: string;
  }): Observable<string> {
    return this.database.isReady$.pipe(
      first(ready => ready),
      switchMap(() => {
        const id = 'e' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        return this.database.execute(
          'INSERT INTO empresas (id, nombre, nit, direccion) VALUES (?, ?, ?, ?)',
          [id, empresa.nombre, empresa.nit || null, empresa.direccion || null]
        ).pipe(
          map(() => id)
        );
      })
    );
  }

  /**
   * Obtiene todos los tipos de DTE
   */
  getTiposDTE(): Observable<TipoDTE[]> {
    return this.database.isReady$.pipe(
      first(ready => ready),
      switchMap(() => {
        return this.database.query<{ codigo: string; nombre: string; habilitado: number }>(
          'SELECT codigo, nombre, habilitado FROM tipos_dte WHERE habilitado = 1 ORDER BY nombre'
        );
      }),
      map(rows => {
        return rows.map(row => new TipoDTE(
          row.codigo,
          row.nombre,
          row.habilitado === 1
        ));
      })
    );
  }

  /**
   * Actualiza un cliente
   */
  updateCliente(id: string, cliente: {
    nombre?: string;
    correo?: string;
    nit?: string;
    nrc?: string;
    direccion?: string;
    telefono?: string;
  }): Observable<number> {
    return this.database.isReady$.pipe(
      first(ready => ready),
      switchMap(() => {
        const updates: string[] = [];
        const params: any[] = [];

        if (cliente.nombre !== undefined) {
          updates.push('nombre = ?');
          params.push(cliente.nombre);
        }
        if (cliente.correo !== undefined) {
          updates.push('correo = ?');
          params.push(cliente.correo);
        }
        if (cliente.nit !== undefined) {
          updates.push('nit = ?');
          params.push(cliente.nit);
        }
        if (cliente.nrc !== undefined) {
          updates.push('nrc = ?');
          params.push(cliente.nrc);
        }
        if (cliente.direccion !== undefined) {
          updates.push('direccion = ?');
          params.push(cliente.direccion);
        }
        if (cliente.telefono !== undefined) {
          updates.push('telefono = ?');
          params.push(cliente.telefono);
        }

        if (updates.length === 0) {
          return of(0);
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        params.push(id);

        return this.database.execute(
          `UPDATE clientes SET ${updates.join(', ')} WHERE id = ?`,
          params
        );
      })
    );
  }

  /**
   * Elimina un cliente (soft delete)
   */
  deleteCliente(id: string): Observable<number> {
    return this.database.isReady$.pipe(
      first(ready => ready),
      switchMap(() => {
        return this.database.execute(
          'UPDATE clientes SET active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [id]
        );
      })
    );
  }

  /**
   * Actualiza un producto
   */
  updateProducto(id: string, producto: {
    nombre?: string;
    codigo?: string;
    descripcion?: string;
    precioUnitario?: number;
    precioConIva?: number;
    unidadMedida?: string;
  }): Observable<number> {
    return this.database.isReady$.pipe(
      first(ready => ready),
      switchMap(() => {
        const updates: string[] = [];
        const params: any[] = [];

        if (producto.nombre !== undefined) {
          updates.push('nombre = ?');
          params.push(producto.nombre);
        }
        if (producto.codigo !== undefined) {
          updates.push('codigo = ?');
          params.push(producto.codigo);
        }
        if (producto.descripcion !== undefined) {
          updates.push('descripcion = ?');
          params.push(producto.descripcion);
        }
        if (producto.precioConIva !== undefined) {
          updates.push('precio_unitario = ?');
          params.push(producto.precioConIva);
        } else if (producto.precioUnitario !== undefined) {
          updates.push('precio_unitario = ?');
          params.push(producto.precioUnitario);
        }
        if (producto.unidadMedida !== undefined) {
          updates.push('unidad_medida = ?');
          params.push(producto.unidadMedida);
        }

        if (updates.length === 0) {
          return of(0);
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        params.push(id);

        return this.database.execute(
          `UPDATE productos SET ${updates.join(', ')} WHERE id = ?`,
          params
        );
      })
    );
  }

  /**
   * Elimina un producto (soft delete)
   */
  deleteProducto(id: string): Observable<number> {
    return this.database.isReady$.pipe(
      first(ready => ready),
      switchMap(() => {
        return this.database.execute(
          'UPDATE productos SET active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [id]
        );
      })
    );
  }

  /**
   * Actualiza una sucursal
   */
  updateSucursal(id: string, sucursal: {
    nombre?: string;
    direccion?: string;
    telefono?: string;
    empresaId?: string;
  }): Observable<number> {
    return this.database.isReady$.pipe(
      first(ready => ready),
      switchMap(() => {
        const updates: string[] = [];
        const params: any[] = [];

        if (sucursal.nombre !== undefined) {
          updates.push('nombre = ?');
          params.push(sucursal.nombre);
        }
        if (sucursal.direccion !== undefined) {
          updates.push('direccion = ?');
          params.push(sucursal.direccion);
        }
        if (sucursal.telefono !== undefined) {
          updates.push('telefono = ?');
          params.push(sucursal.telefono);
        }
        if (sucursal.empresaId !== undefined) {
          updates.push('empresa_id = ?');
          params.push(sucursal.empresaId);
        }

        if (updates.length === 0) {
          return of(0);
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        params.push(id);

        return this.database.execute(
          `UPDATE sucursales SET ${updates.join(', ')} WHERE id = ?`,
          params
        );
      })
    );
  }

  /**
   * Elimina una sucursal (soft delete)
   */
  deleteSucursal(id: string): Observable<number> {
    return this.database.isReady$.pipe(
      first(ready => ready),
      switchMap(() => {
        return this.database.execute(
          'UPDATE sucursales SET active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [id]
        );
      })
    );
  }
}
