# Migración a Tablas Separadas por Tipo de Documento

Este documento explica cómo migrar de la tabla única `dtes` a tablas separadas para cada tipo de documento.

## 📋 Descripción

Se han creado tablas separadas para cada tipo de documento tributario electrónico:

- `documento_factura` - Para documentos tipo FAC (Factura Consumidor Final)
- `documento_credito_fiscal` - Para documentos tipo CCF (Crédito Fiscal)
- `documento_nota_credito` - Para documentos tipo NCR (Nota de Crédito)
- `documento_nota_debito` - Para documentos tipo NDB (Nota de Débito)
- `documento_factura_sujeto_excluido` - Para documentos tipo FSE (Factura Sujeto Excluido)
- `documento_factura_exportacion` - Para documentos tipo FEX (Factura de Exportación)
- `documento_nota_remision` - Para documentos tipo REM (Nota de Remisión)
- `documento_comprobante_retencion` - Para documentos tipo CRT (Comprobante de Retención)

## 🚀 Pasos de Migración

### 1. Crear las nuevas tablas

Las tablas se crean automáticamente cuando ejecutas el script de creación de base de datos:

```bash
node server/create-database.js
```

O si ya tienes la base de datos creada, puedes ejecutar solo la migración:

```bash
node server/migrate-to-separate-tables.js
```

### 2. Migrar datos existentes

El script `migrate-to-separate-tables.js` automáticamente:
- Crea las nuevas tablas si no existen
- Migra todos los datos de la tabla `dtes` a las tablas correspondientes
- Evita duplicados verificando por `control_number`

### 3. Verificar la migración

Después de ejecutar la migración, puedes verificar que los datos se migraron correctamente:

```sql
-- Verificar cantidad de documentos por tipo
SELECT 'Facturas Consumidor Final' as tipo, COUNT(*) as cantidad FROM documento_factura
UNION ALL
SELECT 'Créditos Fiscales', COUNT(*) FROM documento_credito_fiscal
UNION ALL
SELECT 'Notas de Crédito', COUNT(*) FROM documento_nota_credito
UNION ALL
SELECT 'Notas de Débito', COUNT(*) FROM documento_nota_debito
UNION ALL
SELECT 'Facturas Sujeto Excluido', COUNT(*) FROM documento_factura_sujeto_excluido
UNION ALL
SELECT 'Facturas Exportación', COUNT(*) FROM documento_factura_exportacion
UNION ALL
SELECT 'Notas Remisión', COUNT(*) FROM documento_nota_remision
UNION ALL
SELECT 'Comprobantes Retención', COUNT(*) FROM documento_comprobante_retencion;
```

### 4. Eliminar tablas antiguas (Opcional)

Una vez que hayas verificado que todos los datos se migraron correctamente a las nuevas tablas con prefijo `documento_`, puedes eliminar las tablas antiguas:

```bash
npm run db:remove-old
```

O directamente:

```bash
node server/remove-old-tables.js --confirm
```

**⚠️ ADVERTENCIA**: Este script elimina permanentemente las siguientes tablas:
- `facturas_consumidor_final`
- `creditos_fiscales`
- `notas_credito`
- `notas_debito`
- `facturas_sujeto_excluido`
- `facturas_exportacion`
- `notas_remision`
- `comprobantes_retencion`

**IMPORTANTE**: Asegúrate de haber migrado todos los datos antes de ejecutar este script. El script mostrará cuántos registros tiene cada tabla antes de eliminarla.

## 📝 Cambios en el Código

### Backend (server/index.js)

El código del backend ha sido actualizado para:
- Usar la función `getTableNameByTipoDte()` para obtener la tabla correcta según el tipo de documento
- Insertar nuevos documentos en las tablas específicas
- Buscar documentos en todas las tablas cuando se necesita regenerar un PDF

### Estructura de las Tablas

Todas las tablas tienen la misma estructura:

```sql
- id (SERIAL PRIMARY KEY)
- control_number (TEXT UNIQUE NOT NULL)
- tipo_dte (TEXT NOT NULL) - Código numérico del tipo de DTE
- codigo_generacion (TEXT UNIQUE)
- numero_control (TEXT)
- numero_documento (INTEGER)
- receptor (TEXT NOT NULL)
- total (REAL NOT NULL DEFAULT 0)
- ambiente (TEXT NOT NULL DEFAULT 'PRUEBAS')
- fecha_creacion (TIMESTAMP NOT NULL)
- fecha_emision (TIMESTAMP)
- fecha_envio (TIMESTAMP)
- fecha_autorizacion (TIMESTAMP)
- empresa_id (TEXT)
- cliente_id (TEXT)
- estado (TEXT DEFAULT 'BORRADOR')
- dte_json (TEXT)
- dte_firmado (TEXT)
- sello_recibido (TEXT)
- codigo_mensaje (TEXT)
- descripcion_mensaje (TEXT)
- observaciones (TEXT)
- pdf_url (TEXT)
- created_at (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
- updated_at (TIMESTAMP DEFAULT CURRENT_TIMESTAMP)
```

## ⚠️ Notas Importantes

1. **Tabla `dtes` antigua**: Se mantiene para compatibilidad con datos antiguos, pero los nuevos documentos se guardan en las tablas específicas.

2. **Índices**: Cada tabla tiene índices optimizados para:
   - Búsquedas por fecha
   - Búsquedas por control_number
   - Búsquedas por número de documento
   - Búsquedas por empresa_id
   - Búsquedas por cliente_id
   - Búsquedas por estado

3. **Migración de datos**: El script de migración es idempotente, puedes ejecutarlo múltiples veces sin problemas.

## 🔄 Rollback

Si necesitas revertir la migración, puedes:

1. Mantener ambas estructuras (tablas nuevas y tabla `dtes` antigua)
2. Los datos antiguos permanecen en `dtes`
3. Los nuevos datos se guardan en las tablas específicas

Para un rollback completo, necesitarías:
- Migrar los datos de las tablas específicas de vuelta a `dtes`
- Actualizar el código para usar solo `dtes`

## 📊 Ventajas de las Tablas Separadas

1. **Mejor organización**: Cada tipo de documento tiene su propia tabla
2. **Mejor rendimiento**: Consultas más rápidas al buscar por tipo específico
3. **Escalabilidad**: Más fácil agregar campos específicos por tipo de documento en el futuro
4. **Mantenimiento**: Más fácil de mantener y entender la estructura

## 🐛 Solución de Problemas

### Error: "tabla no existe"
Ejecuta el script de migración:
```bash
node server/migrate-to-separate-tables.js
```

### Error: "duplicate key value"
El script de migración verifica duplicados automáticamente. Si ocurre este error, significa que el documento ya existe en la tabla destino.

### Datos no migrados
Verifica que los tipos de documento en la tabla `dtes` sean válidos (FAC, CCF, NCR, NDB, FSE, FEX, REM, CRT).
