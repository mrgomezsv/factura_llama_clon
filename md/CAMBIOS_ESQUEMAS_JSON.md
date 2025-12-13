# Cambios en Estructura JSON según Esquemas Oficiales

## 📋 Resumen

Se ha refactorizado completamente el sistema de generación de JSONs de DTE para que cada tipo de documento use su estructura específica según los esquemas JSON oficiales de SVFE (Hacienda).

## 🔄 Cambios Principales

### 1. Corrección de Códigos de Documentos

**Antes:**
- `FAC` → `'02'` (incorrecto)

**Ahora:**
- `FAC` → `'01'` (correcto según `fe-fc-v1.json`)

### 2. Mapeo de Versiones por Tipo de Documento

Cada tipo de documento ahora usa su versión correcta según el esquema:

| Tipo | Código | Versión | Esquema |
|------|--------|---------|---------|
| FAC | 01 | 1 | fe-fc-v1.json |
| CCF | 03 | 3 | fe-ccf-v3.json |
| REM | 04 | 3 | fe-nr-v3.json |
| NCR | 05 | 3 | fe-nc-v3.json |
| NDB | 06 | 3 | fe-nd-v3.json |
| CRT | 07 | 1 | fe-cr-v1.json |
| FEX | 11 | 1 | fe-fex-v1.json |
| FSE | 14 | 1 | fe-fse-v1.json |

### 3. Métodos Específicos por Tipo de Documento

Cada tipo de documento ahora tiene su propio método de construcción que genera el JSON según su esquema específico:

- `buildFacturaConsumidorFinal()` - Para FAC
- `buildCreditoFiscal()` - Para CCF
- `buildNotaCredito()` - Para NCR
- `buildNotaDebito()` - Para NDB
- `buildNotaRemision()` - Para REM
- `buildFacturaSujetoExcluido()` - Para FSE
- `buildFacturaExportacion()` - Para FEX
- `buildComprobanteRetencion()` - Para CRT

### 4. Diferencias Estructurales Implementadas

#### Factura Consumidor Final (FAC)
- Versión: 1
- Receptor: Opcional (puede ser null)
- CuerpoDocumento: Incluye `ivaItem` en cada item
- Resumen: Incluye `totalIva`

#### Crédito Fiscal (CCF)
- Versión: 3
- Receptor: Requerido con NIT/NRC
- CuerpoDocumento: No incluye `ivaItem`
- Resumen: Incluye `ivaPerci1` (IVA Percibido)

#### Nota de Crédito (NCR)
- Versión: 3
- `documentoRelacionado`: Array requerido (no null)
- Resumen: No incluye `totalIva`, solo `ivaPerci1`

#### Nota de Débito (NDB)
- Versión: 3
- Similar a NCR pero para débitos

#### Nota de Remisión (REM)
- Versión: 3
- Receptor: Incluye campo `bienTitulo`
- Resumen: No incluye `totalIva`

#### Factura Sujeto Excluido (FSE)
- Versión: 1
- Usa `sujetoExcluido` en lugar de `receptor`
- CuerpoDocumento: Usa `compra` en lugar de `ventaGravada/ventaExenta`
- Resumen: Estructura diferente (`totalCompra`, `descu`, etc.)

#### Factura Exportación (FEX)
- Versión: 1
- Emisor: Incluye `tipoItemExpor`, `recintoFiscal`, `regimen`
- Receptor: Estructura diferente (incluye `codPais`, `nombrePais`, `tipoPersona`)
- CuerpoDocumento: Estructura simplificada
- Resumen: Incluye `seguro`, `flete`, `codIncoterms`, `descIncoterms`

#### Comprobante de Retención (CRT)
- Versión: 1
- Emisor: Usa `codigoMH`, `codigo`, `puntoVentaMH`, `puntoVenta` (nombres diferentes)
- CuerpoDocumento: Estructura completamente diferente (documentos retenidos)
- Resumen: Solo `totalSujetoRetencion`, `totalIVAretenido`, `totalIVAretenidoLetras`

## 🔧 Archivos Modificados

### Backend

1. **`server/services/dte-builder.js`**
   - ✅ Corregido mapeo: `FAC` → `'01'` (antes `'02'`)
   - ✅ Agregado `VERSION_MAP` para versiones por tipo
   - ✅ Creados métodos específicos para cada tipo de documento
   - ✅ Corregido formato de fecha: `yyyy-MM-dd` (antes `dd/MM/yyyy HH:mm:ss`)
   - ✅ Corregido formato de número de control según patrones de esquemas
   - ✅ Implementadas diferencias estructurales por tipo

2. **`server/services/dte-pdf-generator.js`**
   - ✅ Corregido mapeo: `'02'` → `'01'` para FACTURA CONSUMIDOR FINAL
   - ✅ Corregido valor por defecto en `getCssStyles()`: `'02'` → `'01'`
   - ✅ Corregido typo: `precioUnitaro` → `precioUni`
   - ✅ Agregado soporte para `numItem` (además de `numeroLinea` para compatibilidad)

3. **`server/index.js`**
   - ✅ Agregada función `normalizeTipoDteCodigo()` para normalizar códigos antiguos
   - ✅ Normalización al leer `tipo_dte` de la base de datos

4. **`server/migrate-to-separate-tables.js`**
   - ✅ Agregada función `mapTipoDteCodigo()` para mapear códigos durante migración
   - ✅ Corrección automática de `'02'` → `'01'` para FAC durante migración

5. **`server/fix-tipo-dte-codes.js`** (NUEVO)
   - Script para corregir códigos antiguos en documentos existentes
   - Corrige tanto la columna `tipo_dte` como el JSON almacenado

### Configuración

6. **`package.json`**
   - ✅ Agregado script: `"db:fix-codes": "node server/fix-tipo-dte-codes.js"`

## 📝 Formato de Fecha Corregido

**Antes:**
```javascript
formatDateTimeForDte(date) {
  // Retornaba: "dd/MM/yyyy HH:mm:ss"
}
```

**Ahora:**
```javascript
formatDateForDte(date) {
  // Retorna: "yyyy-MM-dd" (formato ISO requerido por esquemas)
}
formatTimeForDte(date) {
  // Retorna: "HH:mm:ss" (separado)
}
```

## 🔍 Formato de Número de Control

**Patrón según esquemas:** `^DTE-{TIPO}-[A-Z0-9]{8}-[0-9]{15}$`

**Ejemplo para FAC:**
- Antes: `DTE-02-0001001-00000001` (incorrecto)
- Ahora: `DTE-01-00010010-000000000000001` (correcto)

## 🚀 Uso del Script de Corrección

Para corregir documentos existentes en la base de datos que tengan códigos antiguos:

```bash
npm run db:fix-codes
```

Este script:
- Busca todos los documentos con `tipo_dte = '02'` y los convierte a `'01'`
- Actualiza el campo `tipoDte` dentro del JSON almacenado
- Funciona en todas las tablas de documentos

## ⚠️ Notas Importantes

1. **Compatibilidad hacia atrás**: El código incluye normalización para leer documentos antiguos con código `'02'` y convertirlos automáticamente a `'01'`.

2. **Migración de datos**: Si tienes datos existentes, ejecuta:
   ```bash
   npm run db:fix-codes
   ```

3. **Validación**: Todos los JSONs generados ahora cumplen con los esquemas oficiales de SVFE.

## ✅ Verificación

Para verificar que los cambios están correctos:

1. Genera un nuevo documento de cada tipo
2. Verifica que el `tipoDte` en el JSON sea correcto según la tabla de mapeo
3. Verifica que la versión sea correcta según el esquema
4. Verifica que la estructura del JSON coincida con el esquema correspondiente

## 📚 Referencias

- Esquemas JSON oficiales: `/Users/mrgomez/Desktop/Doc_Actualizados_Implementacion_DTE/svfe-json-schemas/`
- Documentación de migración: `MIGRACION_TABLAS_SEPARADAS.md`
