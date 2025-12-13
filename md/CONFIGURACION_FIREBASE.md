# 🔥 Configuración de Firebase para Login

## Pasos para configurar Firebase en el proyecto

### 1. Crear Proyecto Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Haz clic en "Agregar proyecto" o selecciona un proyecto existente
3. Completa el nombre del proyecto y sigue las instrucciones

### 2. Habilitar Authentication

1. En el panel de Firebase, ve a **Authentication**
2. Haz clic en **Get Started**
3. Ve a la pestaña **Sign-in method**
4. Habilita **Email/Password**:
   - Haz clic en "Email/Password"
   - Activa el primer toggle (Email/Password)
   - Haz clic en "Save"

### 2.1. Configurar Plantilla de Email de Recuperación (Opcional pero recomendado)

1. En **Authentication**, ve a la pestaña **Templates**
2. Selecciona **Password reset**
3. Personaliza el asunto y el cuerpo del email (opcional)
4. Configura la URL de acción (por defecto Firebase redirige a su propia página)
5. Para usar tu propia página:
   - Ve a **Settings** > **Authorized domains**
   - Asegúrate de que tu dominio esté autorizado
   - En la plantilla, configura la URL de acción como: `https://tu-dominio.com/reset-password?mode=resetPassword&oobCode=__OOB_CODE__`

### 3. Obtener Configuración de Firebase

1. En el panel de Firebase, ve a **Project Settings** (⚙️)
2. Desplázate hacia abajo hasta **Your apps**
3. Si no tienes una app web, haz clic en el icono `</>` (Web)
4. Registra tu app con un nombre
5. Copia la configuración que aparece (object con apiKey, authDomain, etc.)

### 4. Configurar Variables de Entorno

1. Abre el archivo `src/environments/environment.ts`
2. Reemplaza los valores de `firebase` con tu configuración:

```typescript
export const environment = {
  production: false,
  firebase: {
    apiKey: "TU_API_KEY_REAL",
    authDomain: "tu-proyecto.firebaseapp.com",
    projectId: "tu-proyecto-id",
    storageBucket: "tu-proyecto.appspot.com",
    messagingSenderId: "123456789",
    appId: "TU_APP_ID_REAL"
  }
};
```

3. Si vas a usar producción, actualiza también `src/environments/environment.prod.ts`

### 5. Configurar Firestore (Opcional, pero recomendado)

1. En Firebase Console, ve a **Firestore Database**
2. Haz clic en **Create database**
3. Selecciona modo de inicio:
   - **Production mode** (recomendado para producción)
   - **Test mode** (solo para desarrollo)
4. Selecciona una ubicación para tu base de datos
5. Haz clic en **Enable**

### 6. Configurar Reglas de Seguridad de Firestore

Ve a la pestaña **Rules** en Firestore y configura según `FIREBASE_DB_STRUCTURE.md`.

### 7. Probar el Login

1. Ejecuta el proyecto: `npm start`
2. Ve a `http://localhost:4200/login`
3. Intenta hacer login (primero necesitarás crear una cuenta en Firebase Console o implementar el componente de registro)

---

## Crear Usuario de Prueba

### Opción 1: Desde Firebase Console

1. Ve a **Authentication** > **Users**
2. Haz clic en **Add user**
3. Ingresa email y contraseña
4. Haz clic en **Add user**

### Opción 2: Implementar Registro

El componente de registro (`sign-up`) aún necesita implementación para crear usuarios desde la aplicación.

---

## Notas Importantes

⚠️ **NO subas** los archivos `environment.ts` y `environment.prod.ts` con credenciales reales a repositorios públicos.

✅ Agrega estos archivos a `.gitignore` o usa variables de entorno del sistema.

---

## Verificación

Una vez configurado, deberías poder:

- ✅ Ver la pantalla de login sin errores
- ✅ Validar formulario antes de enviar
- ✅ Ver mensajes de error si las credenciales son incorrectas
- ✅ Ser redirigido a `/dtes` si el login es exitoso

---

## Solución de Problemas

### Error: "Firebase: Error (auth/network-request-failed)"
- Verifica tu conexión a internet
- Verifica que las credenciales en `environment.ts` sean correctas

### Error: "Firebase: Error (auth/invalid-api-key)"
- Verifica que copiaste correctamente el `apiKey` en `environment.ts`
- Asegúrate de que el proyecto Firebase esté activo

### Error: "Firebase: Error (auth/operation-not-allowed)"
- Verifica que Email/Password esté habilitado en Firebase Console
- Ve a Authentication > Sign-in method y verifica que esté activado

### El login no redirige
- Verifica que las rutas estén protegidas con `authGuard`
- Revisa la consola del navegador para ver errores

---

---

## ✅ Componentes de Autenticación Implementados

1. **Login** (`/login`) - ✅ Completo
2. **Registro** (`/sign-up`) - ✅ Completo
3. **Recuperación de Contraseña** (`/forgot-password`) - ✅ Completo

Todos los componentes incluyen:
- ✅ Validaciones en tiempo real
- ✅ Manejo de errores en español
- ✅ Estados de carga
- ✅ Redirección automática
- ✅ Protección de rutas con guards

