# Instrucciones para Limpiar Datos

## ⚠️ Nota Importante

**El proyecto ahora usa PostgreSQL en lugar de SQLite.** Los datos ya no se guardan en localStorage del navegador.

## Limpiar Sesión de Usuario

Si necesitas limpiar solo la sesión del usuario:

```javascript
// Limpiar la sesión de usuario
localStorage.removeItem('factura_llama_session');

// Recargar la página
location.reload();
```

## Limpiar Base de Datos PostgreSQL

Para limpiar los datos de PostgreSQL, debes conectarte directamente a la base de datos:

```sql
-- Conectarse a PostgreSQL
psql -U mrgomez -d factura_llama_clon_db

-- Eliminar todos los datos (¡CUIDADO! Esto elimina TODO)
TRUNCATE TABLE dtes, clientes, productos, sucursales, empresas, user_config, empresa_config CASCADE;
```

O usar el script de migración que recrea las tablas:

```bash
npm run db:create
```

## Verificación

Después de limpiar los datos, deberías ver:
- **Clientes**: Lista vacía (si no hay datos en la DB)
- **Sucursales**: Lista vacía (si no hay datos en la DB)
- **Productos**: Lista vacía (si no hay datos en la DB)
