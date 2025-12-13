# Estructura de Base de Datos Firebase Firestore
## Sistema de Facturación Electrónica - El Salvador

---

## 📋 Índice
1. [Consideraciones Generales](#consideraciones-generales)
2. [Estructura de Colecciones](#estructura-de-colecciones)
3. [Reglas de Seguridad](#reglas-de-seguridad)
4. [Índices Recomendados](#índices-recomendados)

---

## 🎯 Consideraciones Generales

### Autenticación
- Usar **Firebase Authentication** para gestión de usuarios
- Cada usuario autenticado tendrá acceso solo a sus datos

### Organización por Usuario
- Todas las colecciones estarán organizadas bajo `/users/{userId}/...`
- Esto garantiza aislamiento de datos entre usuarios

### Timestamps
- Usar `Timestamp` de Firestore para fechas
- Campo `createdAt` y `updatedAt` en todos los documentos

---

## 📦 Estructura de Colecciones

### 1. **users/{userId}** (Usuario/Empresa)
Documento principal del usuario con información de su empresa.

```typescript
{
  // Información de la cuenta
  email: string;
  displayName: string;
  photoURL?: string;
  
  // Información de la empresa (Emisor)
  empresa: {
    nombreLegal: string;
    nombreComercial?: string;
    nit: string;
    nrc: string;
    giro?: string;
    actividadesEconomicas: string[]; // Códigos o descripciones
    
    // Dirección
    direccion: {
      complemento?: string;
      departamento: string;
      municipio: string;
      codigoMH: string; // Código del Ministerio de Hacienda
    };
    
    // Contacto
    telefono?: string;
    email: string;
    website?: string;
    
    // Configuración
    puntosVenta: number;
    ambiente: 'PRODUCCIÓN' | 'PRUEBAS';
  };
  
  // Metadatos
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLogin?: Timestamp;
  subscriptionPlan?: 'free' | 'basic' | 'premium';
}
```

**Path completo:** `/users/{userId}`

---

### 2. **users/{userId}/clientes/{clienteId}** (Clientes/Receptores)
Información de clientes (personas naturales o jurídicas).

```typescript
{
  // Identificación
  nombre: string;
  alias?: string;
  nombreComercial?: string;
  
  // Tipo de persona
  tipoPersona: 'NATURAL' | 'JURIDICA';
  clasificacionTributaria: 'OTROS' | 'MEDIANO' | 'GRANDE';
  esSujetoExcluido: boolean;
  
  // Documentos
  tipoDocumento: 'DUI' | 'NIT' | 'Pasaporte' | 'Carnet de Residente' | 'Otro';
  numeroDocumento: string;
  nrc?: string;
  
  // Actividad económica
  actividadEconomica?: string;
  
  // Ubicación
  direccion: {
    pais: string;
    departamento: string;
    municipio: string;
    direccion?: string;
  };
  
  // Contacto
  correoElectronico: string;
  telefono?: string;
  
  // Estado
  activo: boolean;
  
  // Metadatos
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string; // userId
}
```

**Path completo:** `/users/{userId}/clientes/{clienteId}`

---

### 3. **users/{userId}/sucursales/{sucursalId}** (Sucursales/Puntos de Venta)
Sucursales o puntos de venta de la empresa.

```typescript
{
  nombre: string;
  codigo?: string;
  tipoSucursal: string; // Ej: 'ALMACEN', 'TIENDA', 'OFICINA'
  
  // Dirección
  direccion?: {
    complemento?: string;
    departamento: string;
    municipio: string;
    direccionCompleta?: string;
  };
  
  // Contacto
  telefono?: string;
  email?: string;
  responsable?: string;
  
  // Configuración
  activo: boolean;
  esPrincipal: boolean;
  
  // Metadatos
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}
```

**Path completo:** `/users/{userId}/sucursales/{sucursalId}`

---

### 4. **users/{userId}/productos/{productoId}** (Productos/Servicios)
Catálogo de productos y servicios.

```typescript
{
  // Identificación
  nombre: string;
  codigoInterno?: string;
  codigoBarras?: string;
  descripcion?: string;
  
  // Clasificación
  tipoProducto: 'Bienes' | 'Servicios' | 'Bienes y Servicios';
  
  // Precios y costos
  precioConIva: number;
  precioSinIva?: number;
  costo?: number;
  descuentoDefault?: number;
  
  // Unidad de medida
  unidadMedida: string; // Ej: 'UNIDAD', 'Caja', 'Docena', 'Kg', 'Lt'
  
  // Tributación
  tipoVentaDefault: 'Gravada' | 'Exenta' | 'No Sujeta' | 'No Gravada';
  tasaImpuesto?: number; // Por defecto 13% IVA en El Salvador
  
  // Control de inventario (opcional)
  controlInventario?: boolean;
  stock?: number;
  stockMinimo?: number;
  
  // Estado
  activo: boolean;
  
  // Metadatos
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}
```

**Path completo:** `/users/{userId}/productos/{productoId}`

---

### 5. **users/{userId}/dtes/{dteId}** (Documentos Tributarios Electrónicos)
Documentos fiscales generados (Facturas, CCF, Notas de Crédito, etc.).

```typescript
{
  // Identificación del DTE
  controlNumber: string; // Número de control único
  tipoDTE: 'FAC' | 'CCF' | 'NCR' | 'NDB' | 'FSE' | 'FEX' | 'REM' | 'CRT';
  
  // Numeración
  numeroDocumento: number; // Número secuencial
  serie: string; // Ej: 'A', 'B', etc.
  
  // Fechas
  fechaEmision: Timestamp;
  fechaVencimiento?: Timestamp;
  
  // Emisor (referencia a datos del usuario)
  emisor: {
    userId: string;
    nit: string;
    nrc: string;
    nombreLegal: string;
    codigoMH: string;
  };
  
  // Receptor/Cliente
  receptor: {
    clienteId: string; // Referencia al cliente
    nombre: string;
    nit?: string;
    nrc?: string;
    tipoDocumento: string;
    numeroDocumento: string;
    direccion?: {
      departamento: string;
      municipio: string;
    };
  };
  
  // Sucursal
  sucursalId?: string; // Referencia a sucursal
  puntoVenta?: string;
  
  // Items del documento
  items: Array<{
    productoId?: string; // Referencia al producto
    codigo?: string;
    descripcion: string;
    tipoProducto: string;
    cantidad: number;
    unidadMedida: string;
    precioUnitario: number;
    descuento: number;
    tipoVenta: 'Gravada' | 'Exenta' | 'No Sujeta' | 'No Gravada';
    
    // Cálculos por item
    subtotal: number;
    impuestos?: number;
  }>;
  
  // Totales y cálculos
  totales: {
    sumaVentasGravadas: number;
    sumaVentasExentas: number;
    sumaVentasNoSujetas: number;
    sumatoriaVentas: number;
    descuentoGlobal: number;
    descuentoGlobalVentasGravadas: number;
    ventasGravadasNetas: number;
    ventasExentasNetas: number;
    ventasNoSujetasNetas: number;
    subTotal: number;
    iva: number;
    ivaRetenido: number;
    retencionRenta: number;
    montoTotalOperacion: number;
    totalOtrosMontosNoAfectos: number;
    totalPagar: number;
  };
  
  // Retenciones
  retenciones?: {
    renta: number;
    iva: number;
    otros?: number;
  };
  
  // Otros montos
  otrosMontosNoAfectos?: number;
  
  // Forma de pago
  formaPago?: {
    codigo: string;
    descripcion: string;
    plazo?: number; // Días
  };
  
  // Información adicional
  observaciones?: string;
  responsable?: {
    nombre?: string;
    documento?: string;
  };
  
  // Estado del documento
  estado: 'BORRADOR' | 'ENVIADO' | 'PROCESADO' | 'ANULADO' | 'RECHAZADO';
  ambiente: 'PRODUCCIÓN' | 'PRUEBAS';
  
  // Integración con MH (Ministerio de Hacienda)
  mh?: {
    estadoEnvio?: 'PENDIENTE' | 'ENVIADO' | 'ACEPTADO' | 'RECHAZADO';
    fechaEnvio?: Timestamp;
    numeroAutenticacion?: string;
    numeroControl?: string;
    respuestaMH?: any; // JSON de respuesta
    errores?: Array<{
      codigo: string;
      descripcion: string;
    }>;
  };
  
  // Archivos asociados (URLs en Storage)
  archivos?: {
    pdf?: string; // URL del PDF generado
    xml?: string; // URL del XML generado
    qr?: string; // URL de la imagen QR
  };
  
  // Envío de correo
  correoEnviado?: boolean;
  fechaEnvioCorreo?: Timestamp;
  
  // Metadatos
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  periodo: {
    mes: number; // 1-12
    año: number;
  };
}
```

**Path completo:** `/users/{userId}/dtes/{dteId}`

**Subcolecciones:**
- `/users/{userId}/dtes/{dteId}/anexos/{anexoId}` - Archivos adjuntos/anexos

---

### 6. **users/{userId}/dtes/{dteId}/anexos/{anexoId}** (Anexos/Appendices)
Archivos adjuntos a los DTEs.

```typescript
{
  nombre: string;
  tipo: string; // MIME type
  url: string; // URL en Firebase Storage
  tamaño: number; // En bytes
  descripcion?: string;
  
  createdAt: Timestamp;
  uploadedBy: string;
}
```

**Path completo:** `/users/{userId}/dtes/{dteId}/anexos/{anexoId}`

---

### 7. **users/{userId}/formasPago/{formaPagoId}** (Formas de Pago)
Catálogo de formas de pago configuradas.

```typescript
{
  codigo: string; // Ej: '01', '02', etc.
  nombre: string;
  descripcion?: string;
  requierePlazo: boolean;
  plazoDefault?: number; // Días
  
  activo: boolean;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Path completo:** `/users/{userId}/formasPago/{formaPagoId}`

---

### 8. **users/{userId}/responsables/{responsableId}** (Responsables)
Personas responsables de facturación u otros procesos.

```typescript
{
  nombre: string;
  documento: string;
  tipoDocumento: 'DUI' | 'NIT' | 'Pasaporte';
  cargo?: string;
  telefono?: string;
  email?: string;
  
  activo: boolean;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Path completo:** `/users/{userId}/responsables/{responsableId}`

---

### 9. **users/{userId}/reportes/{reporteId}** (Reportes Generados)
Reportes y consultas guardadas.

```typescript
{
  nombre: string;
  tipo: 'VENTAS' | 'COMPRAS' | 'TRIBUTARIO' | 'INVENTARIO' | 'PERSONALIZADO';
  
  // Filtros
  filtros: {
    fechaDesde?: Timestamp;
    fechaHasta?: Timestamp;
    tipoDTE?: string[];
    clienteId?: string[];
    estado?: string[];
    sucursalId?: string[];
  };
  
  // Configuración
  agrupacion?: string;
  ordenamiento?: string;
  
  // Resultados (opcional, para reportes guardados)
  urlArchivo?: string; // URL del archivo generado (PDF, Excel)
  
  createdAt: Timestamp;
  generatedAt?: Timestamp;
  createdBy: string;
}
```

**Path completo:** `/users/{userId}/reportes/{reporteId}`

---

### 10. **users/{userId}/configuracion** (Configuración del Usuario)
Configuración general del usuario.

```typescript
{
  // Numeración de documentos
  numeracion: {
    formato: string; // Ej: 'DTE-{serie}-{numero}'
    serieActual: string;
    numeroActual: number;
    porSucursal: boolean;
  };
  
  // Notificaciones
  notificaciones: {
    emailFacturas: boolean;
    emailReportes: boolean;
  };
  
  // Integración MH
  mh: {
    usuario?: string;
    token?: string; // Encriptado
    ambiente: 'PRODUCCIÓN' | 'PRUEBAS';
  };
  
  // Impuestos
  impuestos: {
    tasaIVA: number; // Por defecto 0.13 (13%)
    tasaRetencionRenta: number;
    tasaRetencionIVA: number;
  };
  
  updatedAt: Timestamp;
}
```

**Path completo:** `/users/{userId}/configuracion`

---

## 🔒 Reglas de Seguridad (Firestore Security Rules)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function para verificar autenticación
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function para verificar que el usuario accede solo a sus datos
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Regla para el documento del usuario
    match /users/{userId} {
      allow read, write: if isOwner(userId);
      
      // Clientes
      match /clientes/{clienteId} {
        allow read, write: if isOwner(userId);
      }
      
      // Sucursales
      match /sucursales/{sucursalId} {
        allow read, write: if isOwner(userId);
      }
      
      // Productos
      match /productos/{productoId} {
        allow read, write: if isOwner(userId);
      }
      
      // DTEs
      match /dtes/{dteId} {
        allow read, write: if isOwner(userId);
        
        // Anexos de DTE
        match /anexos/{anexoId} {
          allow read, write: if isOwner(userId);
        }
      }
      
      // Formas de pago
      match /formasPago/{formaPagoId} {
        allow read, write: if isOwner(userId);
      }
      
      // Responsables
      match /responsables/{responsableId} {
        allow read, write: if isOwner(userId);
      }
      
      // Reportes
      match /reportes/{reporteId} {
        allow read, write: if isOwner(userId);
      }
      
      // Configuración
      match /configuracion {
        allow read, write: if isOwner(userId);
      }
    }
  }
}
```

---

## 📊 Índices Recomendados

Crear estos índices compuestos en Firestore para mejorar el rendimiento de consultas:

### 1. Colección `dtes`
```javascript
// Para filtrar DTEs por período y tipo
- Collection: dtes
- Fields: periodo.año (Ascending), periodo.mes (Ascending), tipoDTE (Ascending)

// Para filtrar por estado y fecha
- Collection: dtes
- Fields: estado (Ascending), fechaEmision (Descending)

// Para buscar por cliente y fecha
- Collection: dtes
- Fields: receptor.clienteId (Ascending), fechaEmision (Descending)

// Para búsquedas por número de control
- Collection: dtes
- Fields: controlNumber (Ascending)
```

### 2. Colección `clientes`
```javascript
// Para búsquedas por nombre
- Collection: clientes
- Fields: nombre (Ascending), activo (Ascending)
```

### 3. Colección `productos`
```javascript
// Para búsquedas por código
- Collection: productos
- Fields: codigoInterno (Ascending), activo (Ascending)
```

---

## 🔄 Estructura de Firebase Storage

Organizar los archivos en Storage de la siguiente manera:

```
gs://tu-proyecto.appspot.com/
├── users/
│   └── {userId}/
│       ├── dtes/
│       │   └── {dteId}/
│       │       ├── pdf/
│       │       │   └── {archivo}.pdf
│       │       ├── xml/
│       │       │   └── {archivo}.xml
│       │       ├── qr/
│       │       │   └── {imagen}.png
│       │       └── anexos/
│       │           └── {anexo}.*
│       ├── reportes/
│       │   └── {reporteId}/
│       │       └── {archivo}.*
│       └── perfil/
│           └── {imagen}.jpg
```

---

## 🚀 Implementación Sugerida

### 1. Servicios Angular

Crear servicios Firebase para cada colección:
- `firebase-clientes.service.ts`
- `firebase-productos.service.ts`
- `firebase-dtes.service.ts`
- `firebase-sucursales.service.ts`
- etc.

### 2. Modelos TypeScript

Actualizar los modelos existentes para que coincidan con la estructura de Firestore, usando decoradores de `@angular/fire` si es necesario.

### 3. Migración de Datos

Si tienes datos mock, crear scripts de migración para importarlos a Firestore.

---

## 📝 Notas Adicionales

1. **Offline Support**: Firestore soporta offline por defecto. Considera habilitar persistencia offline para mejor UX.

2. **Batching**: Para operaciones múltiples, usa transacciones o batch writes.

3. **Límites**: 
   - Tamaño máximo de documento: 1 MB
   - Profundidad máxima de subcolecciones: 100 niveles
   - Máximo de índices compuestos por colección: 200

4. **Costos**: Monitorea el uso de lecturas/escrituras. Considera implementar caché en el cliente.

5. **Backup**: Configura backups automáticos usando Firebase Extensions o Cloud Functions.

---

## 🎯 Próximos Pasos

1. Crear proyecto Firebase
2. Configurar Authentication
3. Configurar Firestore con las reglas de seguridad
4. Crear los índices necesarios
5. Implementar servicios Angular con `@angular/fire`
6. Migrar datos existentes (si aplica)

---

*Documento generado para el sistema de facturación electrónica - El Salvador*

