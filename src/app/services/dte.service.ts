import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, Subject, from, throwError } from 'rxjs';
import { map, switchMap, first, tap, concatMap, toArray, catchError } from 'rxjs/operators';
import { DTE } from '../models/dte.model';
import { Empresa } from '../models/empresa.model';
import { PeriodoTributario } from '../models/periodo-tributario.model';
import { TipoDTE } from '../models/tipo-dte.model';
import { DatabaseService } from './database.service';

@Injectable({
  providedIn: 'root'
})
export class DteService {
  private readonly API_URL = 'http://localhost:3000/api';
  private companyUpdated = new Subject<void>();

  get onCompanyUpdated$() {
    return this.companyUpdated.asObservable();
  }

  constructor(
    private database: DatabaseService,
    private http: HttpClient
  ) { }

  /**
   * Obtiene todos los DTEs
   */
  getDTEs(filtro?: { tipoTab?: 'enviados' | 'recibidos', periodo?: PeriodoTributario }): Observable<DTE[]> {
    return this.database.isReady$.pipe(
      first(ready => ready),
      switchMap(() => {
        // Consultar todas las tablas de documentos usando UNION ALL
        // Mapear tipo_dte a tipo de texto para compatibilidad
        const baseSelect = `
          id,
          control_number, 
          CASE 
            WHEN tipo_dte = '01' THEN 'Factura'
            WHEN tipo_dte = '03' THEN 'Comprobante de Crédito Fiscal'
            WHEN tipo_dte = '04' THEN 'Nota de Remisión'
            WHEN tipo_dte = '05' THEN 'Nota de Crédito'
            WHEN tipo_dte = '06' THEN 'Nota de Débito'
            WHEN tipo_dte = '11' THEN 'Factura de Sujeto Excluido'
            WHEN tipo_dte = '14' THEN 'Factura de Exportación'
            WHEN tipo_dte = '15' THEN 'Nota de Remisión'
            WHEN tipo_dte = '16' THEN 'Comprobante de Retención'
            ELSE 'Documento'
          END as tipo,
          tipo_dte,
          codigo_generacion,
          numero_control,
          numero_documento,
          receptor, 
          total, 
          ambiente, 
          fecha_creacion,
          fecha_emision,
          fecha_envio,
          fecha_autorizacion,
          empresa_id,
          cliente_id,
          estado,
          sello_recibido,
          codigo_mensaje,
          descripcion_mensaje
        `;

        // Lista de todas las tablas de documentos
        const tablas = [
          'documento_factura',
          'documento_credito_fiscal',
          'documento_nota_credito',
          'documento_nota_debito',
          'documento_factura_sujeto_excluido',
          'documento_factura_exportacion',
          'documento_nota_remision',
          'documento_comprobante_retencion'
        ];

        // Construir consulta con UNION ALL para todas las tablas
        const unionQueries: string[] = [];

        // Agregar consultas de cada tabla
        tablas.forEach(tabla => {
          unionQueries.push(`SELECT ${baseSelect} FROM ${tabla}`);
        });

        // Agregar también la tabla dtes para compatibilidad con datos antiguos
        // La tabla dtes puede tener un campo 'tipo' además de 'tipo_dte'
        unionQueries.push(`SELECT 
          id,
          control_number, 
          COALESCE(tipo, CASE 
            WHEN tipo_dte = '01' THEN 'Factura'
            WHEN tipo_dte = '03' THEN 'Comprobante de Crédito Fiscal'
            WHEN tipo_dte = '04' THEN 'Nota de Remisión'
            WHEN tipo_dte = '05' THEN 'Nota de Crédito'
            WHEN tipo_dte = '06' THEN 'Nota de Débito'
            WHEN tipo_dte = '11' THEN 'Factura de Sujeto Excluido'
            WHEN tipo_dte = '14' THEN 'Factura de Exportación'
            WHEN tipo_dte = '15' THEN 'Nota de Remisión'
            WHEN tipo_dte = '16' THEN 'Comprobante de Retención'
            ELSE 'Documento'
          END) as tipo,
          tipo_dte,
          codigo_generacion,
          numero_control,
          numero_documento,
          receptor, 
          total, 
          ambiente, 
          fecha_creacion,
          fecha_emision,
          fecha_envio,
          fecha_autorizacion,
          empresa_id,
          cliente_id,
          estado,
          sello_recibido,
          codigo_mensaje,
          descripcion_mensaje
        FROM dtes`);

        // Construir la consulta UNION ALL completa
        let unionSql = unionQueries.join(' UNION ALL ');

        // Construir WHERE común para todos los UNION
        const whereConditions: string[] = [];
        const params: any[] = [];

        // Filtrar por período si se proporciona
        if (filtro?.periodo) {
          const mes = filtro.periodo.mes;
          const año = filtro.periodo.año;
          // Usar COALESCE para manejar fechas NULL, usar fecha_emision como fallback
          whereConditions.push('EXTRACT(MONTH FROM COALESCE(fecha_creacion, fecha_emision, CURRENT_DATE)) = ? AND EXTRACT(YEAR FROM COALESCE(fecha_creacion, fecha_emision, CURRENT_DATE)) = ?');
          params.push(mes, año);
        }

        // Filtrar por estado según el tipo de tab
        if (filtro?.tipoTab === 'enviados') {
          // Mostrar todos los DTEs generados/enviados (no borradores)
          whereConditions.push('(estado IS NULL OR estado != ?)');
          params.push('BORRADOR');
        }

        // Aplicar condiciones WHERE si existen
        let sql: string;
        if (whereConditions.length > 0) {
          sql = `SELECT * FROM (${unionSql}) AS all_dtes WHERE ${whereConditions.join(' AND ')} ORDER BY fecha_creacion DESC, fecha_emision DESC NULLS LAST`;
        } else {
          sql = `SELECT * FROM (${unionSql}) AS all_dtes ORDER BY fecha_creacion DESC, fecha_emision DESC NULLS LAST`;
        }

        return this.database.query<{
          id: number;
          control_number: string;
          tipo: string;
          tipo_dte: string | null;
          codigo_generacion: string | null;
          numero_control: string | null;
          numero_documento: number | null;
          receptor: string;
          total: number;
          ambiente: string;
          fecha_creacion: string;
          fecha_emision: string | null;
          fecha_envio: string | null;
          fecha_autorizacion: string | null;
          empresa_id: string | null;
          cliente_id: string | null;
          estado: string | null;
          sello_recibido: string | null;
          codigo_mensaje: string | null;
          descripcion_mensaje: string | null;
        }>(sql, params);
      }),
      map(rows => {
        if (!rows || rows.length === 0) {
          console.log('No se encontraron DTEs en la consulta');
          return [];
        }
        console.log(`Se encontraron ${rows.length} DTEs`);
        return rows.map(row => {
          return DTE.fromJson({
            id: row.id,
            controlNumber: row.control_number || row.numero_control || '',
            tipo: row.tipo,
            tipoDte: row.tipo_dte,
            codigoGeneracion: row.codigo_generacion,
            numeroControl: row.numero_control,
            numeroDocumento: row.numero_documento,
            receptor: row.receptor,
            total: row.total,
            ambiente: row.ambiente,
            fechaCreacion: row.fecha_creacion,
            fechaEmision: row.fecha_emision,
            fechaEnvio: row.fecha_envio,
            fechaAutorizacion: row.fecha_autorizacion,
            estado: row.estado || 'BORRADOR',
            selloRecibido: row.sello_recibido,
            codigoMensaje: row.codigo_mensaje,
            descripcionMensaje: row.descripcion_mensaje
          });
        });
      }),
      catchError(error => {
        console.error('Error al obtener DTEs:', error);
        return of([]); // Retornar array vacío en caso de error
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
   * Obtiene documentos relacionables (Facturas y CCF) para un cliente
   */
  getDocumentosRelacionables(clienteId: string): Observable<{
    codigoGeneracion: string;
    numeroControl: string;
    tipoDte: string;
    total: number;
    fechaEmision: string;
    tipo: string;
  }[]> {
    return this.database.isReady$.pipe(
      first(ready => ready),
      switchMap(() => {
        const sql = `
          SELECT 
            codigo_generacion, 
            tipo_dte, 
            numero_control, 
            total, 
            fecha_emision,
            'Factura' as tipo_nombre
          FROM documento_factura 
          WHERE cliente_id = ?
          UNION ALL
          SELECT 
            codigo_generacion, 
            tipo_dte, 
            numero_control, 
            total, 
            fecha_emision,
            'Crédito Fiscal' as tipo_nombre
          FROM documento_credito_fiscal 
          WHERE cliente_id = ?
          ORDER BY fecha_emision DESC
        `;
        return this.database.query<{
          codigo_generacion: string;
          tipo_dte: string;
          numero_control: string;
          total: number;
          fecha_emision: string;
          tipo_nombre: string;
        }>(sql, [clienteId, clienteId]);
      }),
      map(rows => {
        return rows.map(row => ({
          codigoGeneracion: row.codigo_generacion,
          numeroControl: row.numero_control,
          tipoDte: row.tipo_dte,
          total: row.total,
          fechaEmision: row.fecha_emision ? new Date(row.fecha_emision).toISOString().split('T')[0] : '',
          fechaEmisionFormateada: row.fecha_emision ? new Date(row.fecha_emision).toLocaleDateString('es-SV') : '',
          tipo: row.tipo_nombre
        }));
      }),
      catchError(error => {
        console.error('Error al obtener documentos relacionables:', error);
        return of([]);
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
          `INSERT INTO dtes(control_number, tipo, receptor, total, ambiente, fecha_creacion, empresa_id, cliente_id, estado)
        VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
  getClientes(): Observable<{
    id: string;
    nombre: string;
    correo?: string;
    nit?: string;
    nrc?: string;
    direccion?: string;
    telefono?: string;
    fechaCreacion?: string;
  }[]> {
    return this.database.isReady$.pipe(
      first(ready => ready),
      switchMap(() => {
        return this.database.query<{
          id: string;
          nombre: string;
          correo: string | null;
          nit: string | null;
          nrc: string | null;
          direccion: string | null;
          telefono: string | null;
          created_at: string;
          actividad_economica: string | null;
          tipo_persona: string | null;
          numero_documento: string | null;
          tipo_documento: string | null;
          alias: string | null;
          nombre_comercial: string | null;
          clasificacion_tributaria: string | null;
          es_sujeto_excluido: number;
          pais: string | null;
          departamento: string | null;
          municipio: string | null;
        }>(
          'SELECT * FROM clientes WHERE active = 1 ORDER BY created_at DESC'
        );
      }),
      map(rows => {
        return rows.map(row => ({
          id: row.id,
          nombre: row.nombre,
          correo: row.correo || undefined,
          nit: row.nit || undefined,
          nrc: row.nrc || undefined,
          direccion: row.direccion || undefined,
          telefono: row.telefono || undefined,
          fechaCreacion: row.created_at ? new Date(row.created_at).toLocaleString('es-SV') : undefined,
          // Nuevos campos
          actividadEconomica: row.actividad_economica || undefined,
          tipoPersona: row.tipo_persona || undefined,
          numeroDocumento: row.numero_documento || undefined,
          tipoDocumento: row.tipo_documento || undefined,
          alias: row.alias || undefined,
          nombreComercial: row.nombre_comercial || undefined,
          clasificacionTributaria: row.clasificacion_tributaria || undefined,
          esSujetoExcluido: row.es_sujeto_excluido === 1,
          pais: row.pais || undefined,
          departamento: row.departamento || undefined,
          municipio: row.municipio || undefined
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
    correoElectronico?: string;
    nit?: string;
    numeroDocumento?: string;
    tipoDocumento?: string;
    nrc?: string;
    direccion?: string;
    telefono?: string;
    alias?: string;
    nombreComercial?: string;
    tipoPersona?: string;
    clasificacionTributaria?: string;
    esSujetoExcluido?: boolean;
    actividadEconomica?: string;
    pais?: string;
    departamento?: string;
    municipio?: string;
  }): Observable<string> {
    return this.database.isReady$.pipe(
      first(ready => ready),
      switchMap(() => {
        const id = 'c' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        // Mapear campos del formulario a campos de la base de datos
        const correo = cliente.correoElectronico || cliente.correo || null;
        // Si el tipo de documento es NIT, usar numeroDocumento como nit
        const nit = (cliente.tipoDocumento === 'NIT' && cliente.numeroDocumento)
          ? cliente.numeroDocumento
          : (cliente.nit || null);
        return this.database.execute(
          'INSERT INTO clientes (id, nombre, correo, nit, nrc, direccion, telefono, actividad_economica, tipo_persona, numero_documento, tipo_documento, alias, nombre_comercial, clasificacion_tributaria, es_sujeto_excluido, pais, departamento, municipio) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            id,
            cliente.nombre,
            correo,
            nit,
            cliente.nrc || null,
            cliente.direccion || null,
            cliente.telefono || null,
            cliente.actividadEconomica || null,
            cliente.tipoPersona || null,
            cliente.numeroDocumento || null,
            cliente.tipoDocumento || null,
            cliente.alias || null,
            cliente.nombreComercial || null,
            cliente.clasificacionTributaria || null,
            cliente.esSujetoExcluido ? 1 : 0,
            cliente.pais || null,
            cliente.departamento || null,
            cliente.municipio || null
          ]
        ).pipe(
          map(() => id)
        );
      })
    );
  }

  /**
   * Obtiene todas las sucursales
   */
  getSucursales(): Observable<{
    id: string;
    nombre: string;
    direccion?: string;
    telefono?: string;
    fechaCreacion?: string;
    tipoSucursal?: string;
    complemento?: string;
    correoElectronico?: string;
    departamento?: string;
    municipio?: string;
    codigoMH?: string;
    puntosVenta?: number;
  }[]> {
    return this.database.isReady$.pipe(
      first(ready => ready),
      switchMap(() => {
        return this.database.query<{
          id: string;
          nombre: string;
          direccion: string | null;
          telefono: string | null;
          created_at: string;
          tipo_sucursal: string | null;
          complemento: string | null;
          correo_electronico: string | null;
          departamento: string | null;
          municipio: string | null;
          codigo_mh: string | null;
          puntos_venta: number | null;
        }>(
          'SELECT id, nombre, direccion, telefono, created_at, tipo_sucursal, complemento, correo_electronico, departamento, municipio, codigo_mh, puntos_venta FROM sucursales WHERE active = 1 ORDER BY created_at DESC'
        );
      }),
      map(rows => {
        return rows.map(row => ({
          id: row.id,
          nombre: row.nombre,
          direccion: row.direccion || undefined,
          telefono: row.telefono || undefined,
          fechaCreacion: row.created_at ? new Date(row.created_at).toLocaleString('es-SV') : undefined,
          tipoSucursal: row.tipo_sucursal || undefined,
          complemento: row.complemento || undefined,
          correoElectronico: row.correo_electronico || undefined,
          departamento: row.departamento || undefined,
          municipio: row.municipio || undefined,
          codigoMH: row.codigo_mh || undefined,
          puntosVenta: row.puntos_venta || undefined
        }));
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
    tipoSucursal?: string;
    complemento?: string;
    correoElectronico?: string;
    departamento?: string;
    municipio?: string;
    codigoMH?: string;
    puntosVenta?: number;
  }): Observable<string> {
    return this.database.isReady$.pipe(
      first(ready => ready),
      switchMap(() => {
        const id = 's' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        // Por ahora solo guardamos los campos que están en la tabla de la base de datos
        // Los demás campos (tipoSucursal, complemento, etc.) se pueden agregar después si se extiende la tabla
        return this.database.execute(
          'INSERT INTO sucursales (id, nombre, direccion, telefono, empresa_id, tipo_sucursal, complemento, correo_electronico, departamento, municipio, codigo_mh, puntos_venta) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            id,
            sucursal.nombre,
            sucursal.direccion || null,
            sucursal.telefono || null,
            sucursal.empresaId || null,
            sucursal.tipoSucursal || null,
            sucursal.complemento || null,
            sucursal.correoElectronico || null,
            sucursal.departamento || null,
            sucursal.municipio || null,
            sucursal.codigoMH || null,
            sucursal.puntosVenta || 1
          ]
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
        // Verificar si ya existe una empresa con el mismo nombre
        return this.database.query<{ id: string }>(
          'SELECT id FROM empresas WHERE LOWER(nombre) = LOWER(?)',
          [empresa.nombre]
        );
      }),
      switchMap(existing => {
        if (existing.length > 0) {
          throw new Error('Ya existe una empresa con este nombre');
        }

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
    correoElectronico?: string;
    nit?: string;
    numeroDocumento?: string;
    tipoDocumento?: string;
    nrc?: string;
    direccion?: string;
    telefono?: string;
    alias?: string;
    nombreComercial?: string;
    tipoPersona?: string;
    clasificacionTributaria?: string;
    esSujetoExcluido?: boolean;
    actividadEconomica?: string;
    pais?: string;
    departamento?: string;
    municipio?: string;
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
        if (cliente.correoElectronico !== undefined || cliente.correo !== undefined) {
          updates.push('correo = ?');
          params.push(cliente.correoElectronico || cliente.correo);
        }
        if (cliente.numeroDocumento !== undefined && cliente.tipoDocumento === 'NIT') {
          updates.push('nit = ?');
          params.push(cliente.numeroDocumento);
        } else if (cliente.nit !== undefined) {
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
        if (cliente.actividadEconomica !== undefined) {
          updates.push('actividad_economica = ?');
          params.push(cliente.actividadEconomica);
        }
        if (cliente.tipoPersona !== undefined) {
          updates.push('tipo_persona = ?');
          params.push(cliente.tipoPersona);
        }
        if (cliente.numeroDocumento !== undefined) {
          updates.push('numero_documento = ?');
          params.push(cliente.numeroDocumento);
        }
        if (cliente.tipoDocumento !== undefined) {
          updates.push('tipo_documento = ?');
          params.push(cliente.tipoDocumento);
        }
        if (cliente.departamento !== undefined) {
          updates.push('departamento = ?');
          params.push(cliente.departamento);
        }
        if (cliente.municipio !== undefined) {
          updates.push('municipio = ?');
          params.push(cliente.municipio);
        }

        if (updates.length === 0) {
          return of(0);
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        params.push(id);

        return this.database.execute(
          `UPDATE clientes SET ${updates.join(', ')} WHERE id = ? `,
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

        // Priorizar precioConIva si existe, sino usar precioUnitario
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
          `UPDATE productos SET ${updates.join(', ')} WHERE id = ? `,
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
    tipoSucursal?: string;
    complemento?: string;
    correoElectronico?: string;
    departamento?: string;
    municipio?: string;
    codigoMH?: string;
    puntosVenta?: number;
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
        if (sucursal.tipoSucursal !== undefined) {
          updates.push('tipo_sucursal = ?');
          params.push(sucursal.tipoSucursal);
        }
        if (sucursal.complemento !== undefined) {
          updates.push('complemento = ?');
          params.push(sucursal.complemento);
        }
        if (sucursal.correoElectronico !== undefined) {
          updates.push('correo_electronico = ?');
          params.push(sucursal.correoElectronico);
        }
        if (sucursal.departamento !== undefined) {
          updates.push('departamento = ?');
          params.push(sucursal.departamento);
        }
        if (sucursal.municipio !== undefined) {
          updates.push('municipio = ?');
          params.push(sucursal.municipio);
        }
        if (sucursal.codigoMH !== undefined) {
          updates.push('codigo_mh = ?');
          params.push(sucursal.codigoMH);
        }
        if (sucursal.puntosVenta !== undefined) {
          updates.push('puntos_venta = ?');
          params.push(sucursal.puntosVenta);
        }

        if (updates.length === 0) {
          return of(0);
        }

        updates.push('updated_at = CURRENT_TIMESTAMP');
        params.push(id);

        return this.database.execute(
          `UPDATE sucursales SET ${updates.join(', ')} WHERE id = ? `,
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

  /**
   * Guarda o actualiza la configuración de usuario
   */
  saveUserConfig(userId: string, config: {
    telefono?: string;
    zonaHoraria?: string;
    rol?: string;
  }): Observable<void> {
    return this.database.isReady$.pipe(
      first(ready => ready),
      switchMap(() => {
        // Verificar si existe configuración
        return this.database.query<{ id: string }>(
          'SELECT id FROM user_config WHERE user_id = ?',
          [userId]
        );
      }),
      switchMap(existing => {
        if (existing.length > 0) {
          // Actualizar
          return this.database.execute(
            `UPDATE user_config 
             SET telefono = ?, zona_horaria = ?, rol = ?, updated_at = CURRENT_TIMESTAMP 
             WHERE user_id = ? `,
            [config.telefono || null, config.zonaHoraria || 'El Salvador (GMT-6)', config.rol || 'PROPIETARIO', userId]
          );
        } else {
          // Crear nuevo
          const id = 'uc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
          return this.database.execute(
            'INSERT INTO user_config (id, user_id, telefono, zona_horaria, rol) VALUES (?, ?, ?, ?, ?)',
            [id, userId, config.telefono || null, config.zonaHoraria || 'El Salvador (GMT-6)', config.rol || 'PROPIETARIO']
          );
        }
      }),
      map(() => undefined)
    );
  }

  /**
   * Guarda o actualiza la configuración de empresa
   */
  /**
   * Guarda o actualiza la configuración de empresa
   */
  saveEmpresaConfig(empresaId: string, config: {
    nombreLegal?: string;
    nombreComercial?: string;
    nit?: string;
    nrc?: string;
    dui?: string;
    actividadEconomicaPrimaria?: string;
    actividadEconomicaSecundaria?: string;
    actividadEconomicaTerciaria?: string;
    direccion?: string;
    codigoMH?: string;
    puntosVenta?: number;
    sitioWeb?: string;
    telefono?: string;
    departamento?: string;
    municipio?: string;
    correo?: string;
    logoUrl?: string;
    certificadoPrueba?: string;
    passwordAPIPrueba?: string;
    certificadoProduccion?: string;
    passwordAPIProduccion?: string;
    passwordPriPrueba?: string;
    passwordPubPrueba?: string;
    passwordPriProduccion?: string;
    passwordPubProduccion?: string;
    ambientePruebasActivo?: number;
    ambienteProduccionActivo?: number;
  }): Observable<void> {
    return this.database.isReady$.pipe(
      first(ready => ready),
      switchMap(() => {
        // Verificar si existe configuración
        return this.database.query<{ id: string }>(
          'SELECT id FROM empresa_config WHERE empresa_id = ?',
          [empresaId]
        );
      }),
      switchMap(existing => {
        const queries: Observable<any>[] = [];

        if (existing.length > 0) {
          // Actualizar empresa_config
          queries.push(this.database.execute(
            `UPDATE empresa_config 
             SET nombre_legal = ?, nombre_comercial = ?, nit = ?, nrc = ?, dui = ?,
          actividad_economica_primaria = ?, actividad_economica_secundaria = ?, actividad_economica_terciaria = ?,
          direccion = ?, departamento = ?, municipio = ?, codigo_mh = ?, puntos_venta = ?, sitio_web = ?, telefono = ?, correo = ?, logo_url = ?,
          certificado_prueba = ?, password_api_prueba = ?, certificado_produccion = ?, password_api_produccion = ?,
          ambiente_pruebas_activo = ?, ambiente_produccion_activo = ?,
          updated_at = CURRENT_TIMESTAMP 
             WHERE empresa_id = ? `,
            [
              config.nombreLegal || null,
              config.nombreComercial || null,
              config.nit || null,
              config.nrc || null,
              config.dui || null,
              config.actividadEconomicaPrimaria || null,
              config.actividadEconomicaSecundaria || null,
              config.actividadEconomicaTerciaria || null,
              config.direccion || null,
              config.departamento || null,
              config.municipio || null,
              config.codigoMH || null,
              config.puntosVenta || 1,
              config.sitioWeb || null,
              config.telefono || null,
              config.correo || null,
              config.logoUrl || null,
              config.certificadoPrueba || null,
              config.passwordAPIPrueba || null,
              config.certificadoProduccion || null,
              config.passwordAPIProduccion || null,
              config.ambientePruebasActivo !== undefined ? config.ambientePruebasActivo : 1,
              config.ambienteProduccionActivo !== undefined ? config.ambienteProduccionActivo : 0,
              empresaId
            ]
          ));
        } else {
          // Crear nuevo en empresa_config
          const id = 'ec_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
          queries.push(this.database.execute(
            `INSERT INTO empresa_config
          (id, empresa_id, nombre_legal, nombre_comercial, nit, nrc, dui,
            actividad_economica_primaria, actividad_economica_secundaria, actividad_economica_terciaria,
            direccion, departamento, municipio, codigo_mh, puntos_venta, sitio_web, telefono, correo, logo_url,
            certificado_prueba, password_api_prueba, certificado_produccion, password_api_produccion,
            ambiente_pruebas_activo, ambiente_produccion_activo)
        VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              id,
              empresaId,
              config.nombreLegal || null,
              config.nombreComercial || null,
              config.nit || null,
              config.nrc || null,
              config.dui || null,
              config.actividadEconomicaPrimaria || null,
              config.actividadEconomicaSecundaria || null,
              config.actividadEconomicaTerciaria || null,
              config.direccion || null,
              config.departamento || null,
              config.municipio || null,
              config.codigoMH || null,
              config.puntosVenta || 1,
              config.sitioWeb || null,
              config.telefono || null,
              config.correo || null,
              config.logoUrl || null,
              config.certificadoPrueba || null,
              config.passwordAPIPrueba || null,
              config.certificadoProduccion || null,
              config.passwordAPIProduccion || null,
              config.ambientePruebasActivo !== undefined ? config.ambientePruebasActivo : 1,
              config.ambienteProduccionActivo !== undefined ? config.ambienteProduccionActivo : 0
            ]
          ));
        }

        // Sincronizar también la tabla 'empresas' (nombre comercial, nit, direccion)
        // Esto asegura que el header y títulos se actualicen también
        if (config.nombreComercial) {
          queries.push(this.database.execute(
            'UPDATE empresas SET nombre = ?, nit = ?, direccion = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [
              config.nombreComercial,
              config.nit || null,
              config.direccion || null,
              empresaId
            ]
          ));
        }

        // Actualizar/Insertar en empresa_certificados si hay passwords
        // Usamos ON CONFLICT para simplificar (asumiendo PostgreSQL 9.5+)
        // O verificamos existencia primero. Para consistencia con arriba, hagamos upsert manual o query.
        // Pero forkJoin requiere observables.
        // Haremos la query de certificados adentro.

        const certQuery = `
          INSERT INTO empresa_certificados(empresa_id, password_pri_prueba, password_pub_prueba, password_pri_produccion, password_pub_produccion)
        VALUES(?, ?, ?, ?, ?)
          ON CONFLICT(empresa_id) DO UPDATE SET
        password_pri_prueba = EXCLUDED.password_pri_prueba,
          password_pub_prueba = EXCLUDED.password_pub_prueba,
          password_pri_produccion = EXCLUDED.password_pri_produccion,
          password_pub_produccion = EXCLUDED.password_pub_produccion,
          updated_at = CURRENT_TIMESTAMP
            `;

        // Ejecutar query de certificados solo si hay cambios relevantes o siempre para asegurar sincronía
        // Ejecutamos siempre que tengamos datos en config
        if (config.passwordPriPrueba !== undefined || config.passwordPubPrueba !== undefined ||
          config.passwordPriProduccion !== undefined || config.passwordPubProduccion !== undefined) {

          // Buscar valores actuales si alguno es undefined? No, asumimos que config trae todo o nulls.
          // Pero ClientesPage manda formValue.passwordPriPrueba cual puede estar vacio si no se tocó?
          // Si patchValue funcionó, tiene el valor actual.

          queries.push(this.database.execute(certQuery, [
            empresaId,
            config.passwordPriPrueba || null,
            config.passwordPubPrueba || null,
            config.passwordPriProduccion || null,
            config.passwordPubProduccion || null
          ]));
        }

        // Ejecutar todas las queries
        // Necesitamos 'forkJoin' importado. Si no está, usamos concat.
        // Como no puedo ver imports, asumiré que puedo encadenar.
        // Pero `queries` es un array.
        // Mejor usar reduce para encadenar

        return from(queries).pipe(
          concatMap(obs => obs), // Ejecutar en serie
          toArray() // Esperar a que terminen todas
        );
      }),
      tap(() => this.companyUpdated.next()),
      map(() => undefined)
    );
  }

  /**
   * Obtiene la configuración de usuario
   */
  getUserConfig(userId: string): Observable<any> {
    return this.database.isReady$.pipe(
      first(ready => ready),
      switchMap(() => {
        return this.database.query<{
          telefono: string | null;
          zona_horaria: string;
          rol: string;
        }>(
          'SELECT telefono, zona_horaria, rol FROM user_config WHERE user_id = ?',
          [userId]
        );
      }),
      map(rows => {
        if (rows.length > 0) {
          return {
            telefono: rows[0].telefono || '',
            zonaHoraria: rows[0].zona_horaria || 'El Salvador (GMT-6)',
            rol: rows[0].rol || 'PROPIETARIO'
          };
        }
        return null;
      })
    );
  }


  /**
    * Obtiene actividades económicas del catálogo
    */
  getActividadesEconomicas(): Observable<any[]> {
    return this.database.query<any>('SELECT * FROM cat_019_actividad_economica ORDER BY descripcion ASC');
  }

  /**
   * Obtiene la configuración de empresa
   */
  getEmpresaConfig(empresaId: string): Observable<any> {
    return this.database.isReady$.pipe(
      first(ready => ready),
      switchMap(() => {
        return this.database.query<any>(
          `SELECT ec.*,
          cer.password_pri_prueba, cer.password_pub_prueba,
          cer.password_pri_produccion, cer.password_pub_produccion
           FROM empresa_config ec
           LEFT JOIN empresa_certificados cer ON ec.empresa_id = cer.empresa_id
           WHERE ec.empresa_id = ? `,
          [empresaId]
        );
      }),
      map(rows => {
        if (rows.length > 0) {
          const row = rows[0];
          return {
            nombreLegal: row.nombre_legal || '',
            nombreComercial: row.nombre_comercial || '',
            nit: row.nit || '',
            nrc: row.nrc || '',
            dui: row.dui || '',
            actividadEconomicaPrimaria: row.actividad_economica_primaria || '',
            actividadEconomicaSecundaria: row.actividad_economica_secundaria || '',
            actividadEconomicaTerciaria: row.actividad_economica_terciaria || '',
            direccion: row.direccion || '',
            departamento: row.departamento || '',
            municipio: row.municipio || '',
            codigoMH: row.codigo_mh || '',
            puntosVenta: row.puntos_venta || 1,
            sitioWeb: row.sitio_web || '',
            telefono: row.telefono || '',
            correo: row.correo || '',
            logoUrl: row.logo_url || '',
            certificadoPrueba: row.certificado_prueba || '',
            passwordAPIPrueba: row.password_api_prueba || '',
            certificadoProduccion: row.certificado_produccion || '',
            passwordAPIProduccion: row.password_api_produccion || '',
            // Passwords individuales de certificados
            passwordPriPrueba: row.password_pri_prueba || '',
            passwordPubPrueba: row.password_pub_prueba || '',
            passwordPriProduccion: row.password_pri_produccion || '',
            passwordPubProduccion: row.password_pub_produccion || '',
            ambientePruebasActivo: row.ambiente_pruebas_activo,
            ambienteProduccionActivo: row.ambiente_produccion_activo
          };
        }
        return null;
      })
    );
  }

  /**
   * Obtener JSON de un DTE específico
   */
  getDTEJSON(dteId: number): Observable<any> {
    return this.database.isReady$.pipe(
      first(ready => ready),
      switchMap(() => {
        const sql = `
          SELECT dte_json 
          FROM dtes 
          WHERE id = ?
          `;

        return this.database.query(sql, [dteId]).pipe(
          map((rows: any[]) => {
            if (rows.length > 0 && rows[0].dte_json) {
              return typeof rows[0].dte_json === 'string'
                ? JSON.parse(rows[0].dte_json)
                : rows[0].dte_json;
            }
            return null;
          })
        );
      })
    );
  }
  /**
   * Subir certificado
   */
  uploadCertificado(empresaId: string, file: File, ambiente: 'PRUEBAS' | 'PRODUCCION', passwords: any): Observable<any> {
    const formData = new FormData();
    formData.append('certificado', file);
    formData.append('ambiente', ambiente);

    // Agregar passwords al FormData
    Object.keys(passwords).forEach(key => {
      formData.append(key, passwords[key]);
    });

    const token = localStorage.getItem('auth_token');
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token} `);

    return this.http.post(`${this.API_URL} /empresas/${empresaId}/certificado`, formData, { headers });
  }
}
