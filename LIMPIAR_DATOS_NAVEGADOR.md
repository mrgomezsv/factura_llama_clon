# Instrucciones para Limpiar Datos del Navegador

## Problema
Si aún ves datos hardcodeados de Clientes, Sucursales o Productos, es porque están guardados en el localStorage del navegador.

## Solución

### Opción 1: Limpiar desde la Consola del Navegador (Recomendado)

1. Abre las herramientas de desarrollador (F12 o clic derecho → Inspeccionar)
2. Ve a la pestaña **Console**
3. Ejecuta el siguiente comando:

```javascript
// Limpiar la base de datos SQLite
localStorage.removeItem('factura_llama_db');

// Limpiar la sesión de usuario (opcional)
localStorage.removeItem('factura_llama_session');

// Recargar la página
location.reload();
```

### Opción 2: Limpiar Todo el localStorage

Si quieres limpiar TODO el localStorage (incluyendo otros datos de la aplicación):

```javascript
localStorage.clear();
location.reload();
```

### Opción 3: Desde las Herramientas de Desarrollador

1. Abre las herramientas de desarrollador (F12)
2. Ve a la pestaña **Application** (o **Aplicación**)
3. En el menú lateral, expande **Local Storage**
4. Selecciona tu dominio
5. Busca las claves:
   - `factura_llama_db` - Base de datos SQLite
   - `factura_llama_session` - Sesión de usuario
6. Haz clic derecho en cada una y selecciona **Delete** (o presiona Delete)
7. Recarga la página (F5)

## Verificación

Después de limpiar los datos, deberías ver:
- **Clientes**: Lista vacía (si no hay datos en la DB)
- **Sucursales**: Lista vacía (si no hay datos en la DB)
- **Productos**: Lista vacía (si no hay datos en la DB)

## Nota

Los datos hardcodeados en el código ya fueron eliminados. Si aún ves datos, es porque están guardados en el localStorage del navegador y necesitas limpiarlos usando una de las opciones anteriores.
