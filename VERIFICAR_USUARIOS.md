# Verificar Usuarios Registrados

## Problema
No puedes iniciar sesión porque el email `mrgomez.dev@gmail.com` no está registrado en la base de datos.

## Solución

### Opción 1: Usar el Usuario por Defecto

El sistema tiene un usuario por defecto creado automáticamente:

- **Email:** `admin@test.com`
- **Contraseña:** `admin123`

Intenta iniciar sesión con estas credenciales.

### Opción 2: Registrar un Nuevo Usuario

1. Ve a la página de registro: `http://localhost:4200/sign-up`
2. Completa el formulario:
   - Nombre del negocio
   - Email: `mrgomez.dev@gmail.com`
   - Contraseña: `Karin2100` (o la que prefieras)
   - Acepta los términos y condiciones
3. Haz clic en "Crear cuenta"
4. Serás redirigido automáticamente después del registro

### Opción 3: Verificar Usuarios en la Consola

Abre la consola del navegador (F12) y verás un log con todos los usuarios registrados cuando cargas la página de login.

También puedes ejecutar este comando en la consola para ver los usuarios:

```javascript
// Esto requiere acceso al servicio, pero el componente de login ya lo hace automáticamente
```

## Verificación

Después de registrarte o usar el usuario por defecto, deberías poder:
- ✅ Iniciar sesión exitosamente
- ✅ Ser redirigido a `/dtes`
- ✅ Ver tu sesión activa

## Nota Importante

La base de datos SQLite se guarda en el **localStorage del navegador**. Si limpias el localStorage, perderás todos los usuarios registrados (excepto el usuario por defecto que se crea automáticamente).

Para limpiar la base de datos y empezar de nuevo:
```javascript
localStorage.removeItem('factura_llama_db');
location.reload();
```
