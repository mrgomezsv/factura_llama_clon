# Guía de Integración API Externa - WavePos DTE-v2

Esta API permite que cualquier sistema POS externo emita Documentos Tributarios Electrónicos (DTE) utilizando la infraestructura de WavePos.

## Configuración General

- **Endpoint:** `POST http://localhost:3000/api/v1/external/generar`
- **Header Requerido:** `x-api-key: [TU_API_KEY]`
- **Content-Type:** `application/json`

---

## 1. Factura de Consumidor Final (01)

Se utiliza para ventas a personas naturales que no son contribuyentes de IVA.

### Ejemplo de JSON
```json
{
  "tipoDte": "01",
  "ambiente": "PRUEBAS",
  "cliente": {
    "nombre": "JUAN PEREZ",
    "numeroDocumento": "000000000",
    "direccion": "San Salvador",
    "correo": "juan@example.com"
  },
  "items": [
    {
      "cantidad": 1,
      "descripcion": "Producto de Ejemplo",
      "precioUni": 10.00,
      "ventaGravada": 10.00
    }
  ],
  "totales": {
    "totalGravada": 10.00,
    "totalPagar": 10.00,
    "totalLetras": "DIEZ 00/100 USD"
  }
}
```

---

## 2. Comprobante de Crédito Fiscal (03)

Se utiliza para ventas entre contribuyentes de IVA (Empresas o Personas con NRC).

### Ejemplo de JSON
```json
{
  "tipoDte": "03",
  "ambiente": "PRUEBAS",
  "cliente": {
    "nombre": "EMPRESA CLIENTE S.A. DE C.V.",
    "nit": "06141208221234",
    "nrc": "1234567",
    "direccion": "San Salvador",
    "departamento": "06",
    "municipio": "14"
  },
  "items": [
    {
      "cantidad": 1,
      "descripcion": "Servicio de Consultoría",
      "precioUni": 100.00,
      "ventaGravada": 100.00
    }
  ],
  "totales": {
    "totalGravada": 100.00,
    "subTotal": 100.00,
    "montoTotalOperacion": 113.00,
    "totalPagar": 113.00,
    "totalLetras": "CIENTO TRECE 00/100 USD"
  }
}
```

---

## 3. Factura de Sujeto Excluido (14)

Se utiliza cuando la empresa compra a personas que no están inscritas en IVA.

### Ejemplo de JSON
```json
{
  "tipoDte": "14",
  "ambiente": "PRUEBAS",
  "cliente": {
    "nombre": "PROVEEDOR INFORMAL",
    "numeroDocumento": "000000000",
    "direccion": "Ahuachapán"
  },
  "items": [
    {
      "cantidad": 1,
      "descripcion": "Compra de Frutas",
      "precioUni": 50.00,
      "ventaGravada": 50.00
    }
  ],
  "totales": {
    "montoTotalOperacion": 50.00,
    "reteRenta": 5.00,
    "totalPagar": 45.00,
    "totalLetras": "CUARENTA Y CINCO 00/100 USD"
  }
}
```

---

## 4. Notas de Crédito (05) / Débito (06)

Se utilizan para modificar documentos emitidos previamente (Anulaciones, devoluciones, cargos extra).

### Campos Requeridos Extra:
- `documentoRelacionado`: Objeto con los datos del documento que se está modificando.

```json
{
  "tipoDte": "05",
  "documentoRelacionado": {
    "tipoDocumento": "03",
    "tipoGeneracion": 2,
    "numeroDocumento": "C123456789...",
    "fechaEmision": "2023-10-01"
  },
  ...
}
```

---

## Respuestas del API

### Éxito (200 OK)
```json
{
    "success": true,
    "id": 35,
    "codigoGeneracion": "...",
    "numeroControl": "...",
    "selloRecibido": "...",
    "estado": "PROCESADO",
    "pdfUrl": "..."
}
```

### Rechazo por Hacienda (200 OK o 400)
```json
{
    "success": false,
    "estado": "RECHAZADO",
    "descripcionMensaje": "[receptor.nit] NIT CONTRIBUYENTE NO EXISTE",
    "observaciones": []
}
```
