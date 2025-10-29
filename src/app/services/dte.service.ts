import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { DTE } from '../models/dte.model';
import { Empresa } from '../models/empresa.model';
import { PeriodoTributario } from '../models/periodo-tributario.model';
import { TipoDTE } from '../models/tipo-dte.model';

// Datos mock hardcodeados (temporal hasta que Angular soporte imports JSON directamente)
const dtesData: any[] = [
  {
    "controlNumber": "DTE-03-M001P001-000000000000346",
    "tipo": "CCF",
    "receptor": "JUAN CARLOS FERRUFINO HERNANDEZ",
    "total": 181.93,
    "ambiente": "PRODUCCIÓN",
    "fechaCreacion": "2025-10-13T12:36:43"
  },
  {
    "controlNumber": "DTE-03-M001P001-000000000000345",
    "tipo": "CCF",
    "receptor": "UNO EL SALVADOR, SOCIEDAD ANONIMA",
    "total": 160.16,
    "ambiente": "PRODUCCIÓN",
    "fechaCreacion": "2025-10-13T12:06:55"
  },
  {
    "controlNumber": "DTE-03-M001P001-000000000000344",
    "tipo": "CCF",
    "receptor": "UNO EL SALVADOR, SOCIEDAD ANONIMA",
    "total": 206.08,
    "ambiente": "PRODUCCIÓN",
    "fechaCreacion": "2025-10-13T11:45:22"
  },
  {
    "controlNumber": "DTE-03-M001P001-000000000000343",
    "tipo": "CCF",
    "receptor": "CARLOS ALBERTO MARTINEZ RODRIGUEZ",
    "total": 203.84,
    "ambiente": "PRODUCCIÓN",
    "fechaCreacion": "2025-10-13T12:06:55"
  },
  {
    "controlNumber": "DTE-03-M001P001-000000000000342",
    "tipo": "CCF",
    "receptor": "MARIA ELENA LOPEZ GARCIA",
    "total": 644.00,
    "ambiente": "PRODUCCIÓN",
    "fechaCreacion": "2025-10-11T14:20:39"
  },
  {
    "controlNumber": "DTE-03-M001P001-000000000000341",
    "tipo": "CCF",
    "receptor": "JOSE ANTONIO RAMIREZ MENDOZA",
    "total": 143.36,
    "ambiente": "PRODUCCIÓN",
    "fechaCreacion": "2025-10-11T14:15:30"
  },
  {
    "controlNumber": "DTE-03-M001P001-000000000000340",
    "tipo": "CCF",
    "receptor": "ANA CRISTINA SANCHEZ VASQUEZ",
    "total": 287.50,
    "ambiente": "PRODUCCIÓN",
    "fechaCreacion": "2025-10-11T10:30:15"
  },
  {
    "controlNumber": "DTE-03-M001P001-000000000000339",
    "tipo": "CCF",
    "receptor": "PEDRO JOSE GUTIERREZ CASTRO",
    "total": 125.80,
    "ambiente": "PRODUCCIÓN",
    "fechaCreacion": "2025-10-10T16:45:12"
  },
  {
    "controlNumber": "DTE-03-M001P001-000000000000338",
    "tipo": "CCF",
    "receptor": "LUISA FERNANDA MORALES RIVAS",
    "total": 450.25,
    "ambiente": "PRODUCCIÓN",
    "fechaCreacion": "2025-10-10T09:20:45"
  },
  {
    "controlNumber": "DTE-03-M001P001-000000000000337",
    "tipo": "CCF",
    "receptor": "ROBERTO CARLOS ESPINOZA ORTEGA",
    "total": 320.60,
    "ambiente": "PRODUCCIÓN",
    "fechaCreacion": "2025-10-09T13:55:30"
  },
  {
    "controlNumber": "DTE-03-M001P001-000000000000336",
    "tipo": "CCF",
    "receptor": "GLORIA PATRICIA HERRERA MENDEZ",
    "total": 189.45,
    "ambiente": "PRODUCCIÓN",
    "fechaCreacion": "2025-10-09T11:30:20"
  },
  {
    "controlNumber": "DTE-03-M001P001-000000000000335",
    "tipo": "CCF",
    "receptor": "FRANCISCO JAVIER TORRES VARGAS",
    "total": 567.90,
    "ambiente": "PRODUCCIÓN",
    "fechaCreacion": "2025-10-08T15:40:10"
  },
  {
    "controlNumber": "DTE-03-M001P001-000000000000334",
    "tipo": "CCF",
    "receptor": "CARMEN ROSA DIAZ ALVARADO",
    "total": 234.75,
    "ambiente": "PRODUCCIÓN",
    "fechaCreacion": "2025-10-08T08:15:55"
  },
  {
    "controlNumber": "DTE-03-M001P001-000000000000333",
    "tipo": "CCF",
    "receptor": "MANUEL ALEJANDRO CRUZ BENITEZ",
    "total": 156.30,
    "ambiente": "PRODUCCIÓN",
    "fechaCreacion": "2025-10-07T17:25:40"
  },
  {
    "controlNumber": "DTE-03-M001P001-000000000000332",
    "tipo": "CCF",
    "receptor": "LUIS ALBERTO LOPEZ PANIAGUA",
    "total": 43.51,
    "ambiente": "PRODUCCIÓN",
    "fechaCreacion": "2025-10-07T07:05:21"
  }
];

const empresasData: any[] = [
  {
    "id": "1",
    "nombre": "INDUSTRIAS G & G TEXTILES & BORDADOS",
    "nit": "0614-123456-001-2",
    "direccion": "San Salvador, El Salvador"
  },
  {
    "id": "2",
    "nombre": "COMERCIAL SAN MIGUEL S.A. DE C.V.",
    "nit": "0614-234567-001-3",
    "direccion": "San Miguel, El Salvador"
  },
  {
    "id": "3",
    "nombre": "DISTRIBUIDORA OCCIDENTAL LTDA",
    "nit": "0614-345678-001-4",
    "direccion": "Santa Ana, El Salvador"
  }
];

const tiposDteData: any[] = [
  {
    "codigo": "FAC",
    "nombre": "Factura",
    "habilitado": true
  },
  {
    "codigo": "CCF",
    "nombre": "Comprobante Crédito Fiscal",
    "habilitado": true
  },
  {
    "codigo": "NCR",
    "nombre": "Nota de Crédito",
    "habilitado": true
  },
  {
    "codigo": "NDB",
    "nombre": "Nota de Débito",
    "habilitado": true
  },
  {
    "codigo": "FSE",
    "nombre": "Factura de Sujeto Excluido",
    "habilitado": true
  },
  {
    "codigo": "FEX",
    "nombre": "Factura de Exportación",
    "habilitado": true
  },
  {
    "codigo": "REM",
    "nombre": "Nota de Remisión",
    "habilitado": true
  },
  {
    "codigo": "CRT",
    "nombre": "Comprobante de Retención",
    "habilitado": false
  }
];

// Clientes, sucursales y productos (mock)
import clientesData from '../data/clientes-mock.json';
import sucursalesData from '../data/sucursales-mock.json';
import productosData from '../data/productos-mock.json';
import formasPagoData from '../data/formas-pago-mock.json';

@Injectable({
  providedIn: 'root'
})
export class DteService {
  /**
   * Obtiene todos los DTEs (simulado)
   */
  getDTEs(filtro?: { tipoTab?: 'enviados' | 'recibidos', periodo?: PeriodoTributario }): Observable<DTE[]> {
    let dtes = (dtesData as any[]).map(dte => DTE.fromJson(dte));
    
    // Filtrar por período si se proporciona
    if (filtro?.periodo) {
      const mes = filtro.periodo.mes;
      const año = filtro.periodo.año;
      dtes = dtes.filter(dte => {
        const fecha = dte.fechaCreacion;
        return fecha.getMonth() + 1 === mes && fecha.getFullYear() === año;
      });
    }
    
    // Simular delay de red
    return of(dtes).pipe(delay(300));
  }

  /** Obtener clientes mock */
  getClientes(): Observable<{ id: string; nombre: string; correo: string }[]> {
    return of(clientesData as any[]).pipe(delay(150));
  }

  /** Obtener sucursales mock */
  getSucursales(): Observable<{ id: string; nombre: string }[]> {
    return of(sucursalesData as any[]).pipe(delay(150));
  }

  /** Obtener productos mock */
  getProductos(): Observable<{ id: string; nombre: string; codigo?: string }[]> {
    return of(productosData as any[]).pipe(delay(150));
  }

  /** Obtener formas de pago */
  getFormasPago(): Observable<{ id: string; nombre: string }[]> {
    return of(formasPagoData as any[]).pipe(delay(150));
  }

  /**
   * Obtiene todas las empresas
   */
  getEmpresas(): Observable<Empresa[]> {
    const empresas = (empresasData as any[]).map(emp => new Empresa(
      emp.id,
      emp.nombre,
      emp.nit,
      emp.direccion
    ));
    return of(empresas).pipe(delay(200));
  }

  /**
   * Obtiene todos los tipos de DTE
   */
  getTiposDTE(): Observable<TipoDTE[]> {
    const tipos = (tiposDteData as any[]).map(tipo => new TipoDTE(
      tipo.codigo,
      tipo.nombre,
      tipo.habilitado
    ));
    return of(tipos).pipe(delay(150));
  }

  /**
   * Obtiene un DTE por número de control
   */
  getDTEByControlNumber(controlNumber: string): Observable<DTE | null> {
    const dtes = (dtesData as any[]).map(dte => DTE.fromJson(dte));
    const dte = dtes.find(d => d.controlNumber === controlNumber);
    return of(dte || null).pipe(delay(200));
  }
}

