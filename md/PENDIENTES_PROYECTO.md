# 📋 Pendientes del Proyecto - Sistema de Facturación Electrónica

**Fecha de revisión:** Diciembre 2024  
**Estado general:** Proyecto en desarrollo - Funcionalidades básicas implementadas, integración con backend pendiente

---

## 📑 Índice

1. [🔐 Autenticación y Usuarios](#-autenticación-y-usuarios)
2. [💾 Integración con Backend/Firebase](#-integración-con-backendfirebase)
3. [📄 Funcionalidades de DTEs](#-funcionalidades-de-dtes)
4. [👥 Gestión de Entidades](#-gestión-de-entidades)
5. [📊 Reportes y Consultas](#-reportes-y-consultas)
6. [✅ Validaciones y Manejo de Errores](#-validaciones-y-manejo-de-errores)
7. [🧪 Testing](#-testing)
8. [📚 Documentación](#-documentación)
9. [🔧 Configuración y Entorno](#-configuración-y-entorno)
10. [🎨 UI/UX y Mejoras](#-uiux-y-mejoras)
11. [🔒 Seguridad](#-seguridad)
12. [⚡ Optimizaciones](#-optimizaciones)

---

## 🔐 Autenticación y Usuarios

### 🔴 Crítico - No Implementado

- [ ] **Login funcional**
  - **Ubicación:** `src/app/components/login/login.component.ts`
  - **Problema:** El método `entrar()` solo redirige sin validar credenciales
  - **Acción:** Implementar autenticación con Firebase Auth
  - **Prioridad:** 🔴 ALTA

- [ ] **Registro de usuarios (Sign Up)**
  - **Ubicación:** `src/app/components/sign-up/sign-up.component.ts`
  - **Problema:** `crearCuenta()` solo tiene `console.log`, no crea cuenta real
  - **Acción:** Implementar registro con Firebase Auth y creación de perfil en Firestore
  - **Prioridad:** 🔴 ALTA

- [ ] **Recuperación de contraseña**
  - **Ubicación:** `src/app/components/forgot-password/forgot-password.component.ts`
  - **Problema:** `console.log('Enviar instrucciones')` sin funcionalidad
  - **Acción:** Implementar envío de email de recuperación con Firebase Auth
  - **Prioridad:** 🔴 ALTA

- [ ] **Guards de autenticación**
  - **Problema:** No existen guards para proteger rutas
  - **Acción:** Crear `auth.guard.ts` y aplicar a rutas protegidas
  - **Prioridad:** 🔴 ALTA

- [ ] **Gestión de sesión de usuario**
  - **Problema:** No hay manejo de estado de autenticación
  - **Acción:** Implementar servicio de autenticación y estado global
  - **Prioridad:** 🔴 ALTA

### ⚠️ Importante

- [ ] **Formularios de login/registro sin validación**
  - **Problema:** Los formularios en HTML no tienen validación ni feedback de errores
  - **Acción:** Agregar validaciones y mensajes de error
  - **Prioridad:** 🟡 MEDIA

- [ ] **Persistencia de sesión**
  - **Problema:** No hay manejo de refresh token o persistencia
  - **Acción:** Configurar persistencia de Firebase Auth
  - **Prioridad:** 🟡 MEDIA

---

## 💾 Integración con Backend/Firebase

### 🔴 Crítico - No Implementado

- [ ] **Instalación de Firebase**
  - **Problema:** No hay `@angular/fire` ni `firebase` en `package.json`
  - **Acción:** `npm install @angular/fire firebase`
  - **Prioridad:** 🔴 ALTA

- [ ] **Configuración de Firebase**
  - **Problema:** No existe configuración de Firebase en `app.config.ts`
  - **Acción:** Configurar Firebase providers según `FIREBASE_IMPLEMENTATION_EXAMPLES.md`
  - **Prioridad:** 🔴 ALTA

- [ ] **Servicios Firebase**
  - **Problema:** Todos los servicios usan datos mock
  - **Archivos afectados:**
    - `src/app/services/dte.service.ts` - Usa datos hardcodeados
  - **Acción:** Crear servicios Firebase:
    - `firebase-auth.service.ts`
    - `firebase-clientes.service.ts`
    - `firebase-productos.service.ts`
    - `firebase-dtes.service.ts`
    - `firebase-sucursales.service.ts`
    - `firebase-storage.service.ts`
    - `firebase-user.service.ts`
  - **Prioridad:** 🔴 ALTA

- [ ] **Migración de datos mock a Firebase**
  - **Problema:** Todos los datos están en JSON mock
  - **Archivos:**
    - `src/app/data/clientes-mock.json`
    - `src/app/data/productos-mock.json`
    - `src/app/data/sucursales-mock.json`
    - `src/app/data/formas-pago-mock.json`
  - **Acción:** 
    - Crear scripts de migración si hay datos iniciales
    - Eliminar dependencias de datos mock
  - **Prioridad:** 🔴 ALTA

- [ ] **Estructura de Firestore**
  - **Problema:** No existe base de datos configurada
  - **Acción:** 
    - Crear proyecto Firebase
    - Configurar Firestore con estructura de `FIREBASE_DB_STRUCTURE.md`
    - Configurar reglas de seguridad
    - Crear índices compuestos necesarios
  - **Prioridad:** 🔴 ALTA

### ⚠️ Importante

- [ ] **Variables de entorno**
  - **Problema:** No hay archivos `environment.ts` para configuraciones
  - **Acción:** Crear `environment.ts` y `environment.prod.ts` con config de Firebase
  - **Prioridad:** 🟡 MEDIA

- [ ] **Manejo de errores de red**
  - **Problema:** No hay manejo de errores en llamadas a Firebase
  - **Acción:** Implementar try-catch y mensajes de error amigables
  - **Prioridad:** 🟡 MEDIA

- [ ] **Offline support**
  - **Problema:** No está configurada la persistencia offline de Firestore
  - **Acción:** Habilitar caché offline y sincronización
  - **Prioridad:** 🟢 BAJA

---

## 📄 Funcionalidades de DTEs

### 🔴 Crítico - No Implementado

- [ ] **Guardar DTE como borrador**
  - **Ubicación:** Todas las páginas de DTE (factura, CCF, notas, etc.)
  - **Problema:** El botón "Generar DTE" no tiene funcionalidad
  - **Archivos afectados:**
    - `src/app/pages/factura/factura-page.component.html` (línea 85)
    - Todos los demás tipos de DTE tienen el mismo problema
  - **Acción:** Implementar método `guardarDTE()` o `generarDTE()` en cada página
  - **Prioridad:** 🔴 ALTA

- [ ] **Enviar DTE al Ministerio de Hacienda**
  - **Problema:** No existe integración con MH
  - **Acción:** 
    - Crear servicio para integración con API de MH
    - Implementar generación de XML según especificaciones
    - Manejar respuestas y códigos de autenticación
  - **Prioridad:** 🔴 ALTA

- [ ] **Generación de PDF de DTE**
  - **Problema:** No se genera PDF
  - **Acción:** Implementar generación de PDF con biblioteca (ej: jsPDF, pdfmake)
  - **Prioridad:** 🟡 MEDIA

- [ ] **Generación de XML**
  - **Problema:** No se genera XML según especificación MH
  - **Acción:** Implementar generación de XML válido
  - **Prioridad:** 🔴 ALTA

- [ ] **Generación de código QR**
  - **Problema:** No se genera QR
  - **Acción:** Implementar generación de QR para DTE
  - **Prioridad:** 🟡 MEDIA

- [ ] **Vista previa de DTE**
  - **Problema:** El checkbox "Mostrar vista previa" no funciona
  - **Acción:** Implementar modal/componente de vista previa
  - **Prioridad:** 🟡 MEDIA

- [ ] **Envío de correo electrónico**
  - **Problema:** El checkbox "Enviar correo" no envía emails
  - **Acción:** 
    - Integrar con Firebase Functions o servicio de email
    - Crear templates de email
  - **Prioridad:** 🟡 MEDIA

- [ ] **Numeración automática de documentos**
  - **Problema:** No hay sistema de numeración
  - **Acción:** Implementar contadores por tipo de DTE y sucursal
  - **Prioridad:** 🔴 ALTA

- [ ] **Generación de número de control**
  - **Problema:** El formato del número de control no está implementado
  - **Acción:** Implementar generación según especificación: `DTE-{tipo}-{codigoMH}{puntoVenta}-{numero}`
  - **Prioridad:** 🔴 ALTA

### ⚠️ Importante

- [ ] **Validación de datos antes de generar DTE**
  - **Problema:** No hay validación de datos requeridos
  - **Acción:** Validar cliente, items, totales antes de guardar
  - **Prioridad:** 🟡 MEDIA

- [ ] **Editar DTE borrador**
  - **Problema:** No se puede editar un DTE guardado como borrador
  - **Acción:** Implementar edición de borradores
  - **Prioridad:** 🟡 MEDIA

- [ ] **Anular DTE**
  - **Problema:** No existe funcionalidad para anular
  - **Acción:** Implementar anulación según normativa
  - **Prioridad:** 🟡 MEDIA

- [ ] **Notas de crédito/debito vinculadas a DTE original**
  - **Problema:** No hay relación entre documentos
  - **Acción:** Implementar referencia a DTE original
  - **Prioridad:** 🟡 MEDIA

---

## 👥 Gestión de Entidades

### 🔴 Crítico - No Implementado

- [ ] **Editar cliente**
  - **Ubicación:** `src/app/pages/clientes/clientes-page.component.ts` (línea 240-244)
  - **Problema:** `console.log('Editar cliente:', cliente);`
  - **Acción:** Crear modal de edición y servicio de actualización
  - **Prioridad:** 🔴 ALTA

- [ ] **Eliminar cliente**
  - **Ubicación:** `src/app/pages/clientes/clientes-page.component.ts` (línea 246-250)
  - **Problema:** `console.log('Eliminar cliente:', cliente);`
  - **Acción:** Implementar eliminación lógica (soft delete)
  - **Prioridad:** 🔴 ALTA

- [ ] **Editar producto**
  - **Ubicación:** `src/app/pages/clientes/clientes-page.component.ts` (línea 217-221)
  - **Problema:** `console.log('Editar producto:', producto);`
  - **Acción:** Crear modal de edición y servicio de actualización
  - **Prioridad:** 🔴 ALTA

- [ ] **Eliminar producto**
  - **Ubicación:** `src/app/pages/clientes/clientes-page.component.ts` (línea 223-227)
  - **Problema:** `console.log('Eliminar producto:', producto);`
  - **Acción:** Implementar eliminación lógica
  - **Prioridad:** 🔴 ALTA

- [ ] **Editar sucursal**
  - **Ubicación:** `src/app/pages/clientes/clientes-page.component.ts` (línea 263-267)
  - **Problema:** `console.log('Editar sucursal:', sucursal);`
  - **Acción:** Crear modal de edición y servicio de actualización
  - **Prioridad:** 🔴 ALTA

- [ ] **Eliminar sucursal**
  - **Ubicación:** `src/app/pages/clientes/clientes-page.component.ts` (línea 269-273)
  - **Problema:** `console.log('Eliminar sucursal:', sucursal);`
  - **Acción:** Implementar eliminación lógica
  - **Prioridad:** 🔴 ALTA

- [ ] **Editar información de empresa**
  - **Ubicación:** `src/app/pages/clientes/clientes-page.component.ts` (línea 287-291)
  - **Problema:** `console.log('Editar información de empresa:', this.empresaSeleccionada);`
  - **Acción:** Crear modal/formulario de edición de empresa
  - **Prioridad:** 🟡 MEDIA

- [ ] **Guardar cliente/producto/sucursal en base de datos**
  - **Problema:** Los modales emiten eventos pero no guardan en BD
  - **Ubicación:** Componentes de creación (crear-cliente, crear-producto, crear-sucursal)
  - **Acción:** Conectar con servicios Firebase para guardar datos
  - **Prioridad:** 🔴 ALTA

### ⚠️ Importante

- [ ] **Validaciones en formularios de creación**
  - **Problema:** Hay validaciones básicas pero no mensajes de error visibles
  - **Acción:** Agregar mensajes de error en UI
  - **Prioridad:** 🟡 MEDIA

- [ ] **Búsqueda y filtrado**
  - **Problema:** No hay funcionalidad de búsqueda en listados
  - **Acción:** Implementar búsqueda y filtros
  - **Prioridad:** 🟢 BAJA

- [ ] **Paginación**
  - **Problema:** No hay paginación en listados
  - **Acción:** Implementar paginación para grandes volúmenes
  - **Prioridad:** 🟢 BAJA

---

## 📊 Reportes y Consultas

### 🔴 Crítico - No Implementado

- [ ] **Generación de reportes**
  - **Ubicación:** `src/app/pages/reportes/reportes-page.component.ts`
  - **Problema:** Solo hay estructura UI, no hay lógica de generación
  - **Comentarios en código:**
    - Línea 57: `// Aquí podrías cargar los datos del período seleccionado`
    - Línea 62: `// this.cargarDatos();`
  - **Acción:** Implementar generación de reportes (ventas, compras, tributario, etc.)
  - **Prioridad:** 🟡 MEDIA

- [ ] **Libro de IVA**
  - **Problema:** Tab existe pero sin funcionalidad
  - **Acción:** Implementar generación de libro de IVA según normativa
  - **Prioridad:** 🟡 MEDIA

- [ ] **Exportar reportes (PDF, Excel)**
  - **Problema:** No hay exportación
  - **Acción:** Implementar exportación a PDF y Excel
  - **Prioridad:** 🟢 BAJA

### ⚠️ Importante

- [ ] **Filtros de reportes**
  - **Problema:** No hay filtros implementados
  - **Acción:** Implementar filtros por fecha, tipo DTE, cliente, etc.
  - **Prioridad:** 🟢 BAJA

---

## ✅ Validaciones y Manejo de Errores

### 🔴 Crítico - No Implementado

- [ ] **Validación de formularios con mensajes de error**
  - **Problema:** Los formularios tienen validators pero no muestran errores
  - **Acción:** Agregar componentes de error en templates
  - **Prioridad:** 🟡 MEDIA

- [ ] **Manejo de errores global**
  - **Problema:** No hay interceptor de errores HTTP
  - **Acción:** Crear HTTP interceptor para manejo centralizado
  - **Prioridad:** 🟡 MEDIA

- [ ] **Validación de datos de DTE**
  - **Problema:** No se valida que el DTE tenga todos los campos requeridos
  - **Acción:** Crear validaciones antes de guardar/enviar
  - **Prioridad:** 🔴 ALTA

- [ ] **Validación de NIT/NRC**
  - **Problema:** No hay validación de formato
  - **Acción:** Implementar validación según formato de El Salvador
  - **Prioridad:** 🟡 MEDIA

- [ ] **Mensajes de error amigables**
  - **Problema:** No hay sistema de notificaciones/alertas
  - **Acción:** Implementar servicio de notificaciones (toast, snackbar)
  - **Prioridad:** 🟡 MEDIA

### ⚠️ Importante

- [ ] **Loading states**
  - **Problema:** No hay indicadores de carga
  - **Acción:** Agregar spinners/loaders durante operaciones
  - **Prioridad:** 🟢 BAJA

- [ ] **Confirmaciones de acciones destructivas**
  - **Problema:** No hay confirmaciones antes de eliminar
  - **Acción:** Agregar modales de confirmación
  - **Prioridad:** 🟡 MEDIA

---

## 🧪 Testing

### 🔴 Crítico - No Implementado

- [ ] **Tests unitarios**
  - **Problema:** Solo existe `app.component.spec.ts` básico
  - **Acción:** Crear tests para:
    - Servicios (cálculos, Firebase)
    - Componentes principales
    - Validaciones
  - **Prioridad:** 🟡 MEDIA

- [ ] **Tests de integración**
  - **Problema:** No existen
  - **Acción:** Crear tests E2E con Cypress o Playwright
  - **Prioridad:** 🟢 BAJA

- [ ] **Cobertura de código**
  - **Problema:** No se mide cobertura
  - **Acción:** Configurar reportes de cobertura
  - **Prioridad:** 🟢 BAJA

---

## 📚 Documentación

### ⚠️ Importante

- [ ] **README.md actualizado**
  - **Problema:** README existe pero puede necesitar actualización
  - **Acción:** Actualizar con instrucciones de instalación y configuración de Firebase
  - **Prioridad:** 🟡 MEDIA

- [ ] **Documentación de API/Servicios**
  - **Problema:** No hay documentación de servicios
  - **Acción:** Agregar JSDoc a servicios y métodos importantes
  - **Prioridad:** 🟢 BAJA

- [ ] **Guía de despliegue**
  - **Problema:** No existe
  - **Acción:** Crear guía de deployment
  - **Prioridad:** 🟡 MEDIA

- [ ] **Documentación de integración con MH**
  - **Problema:** No hay documentación sobre integración con Ministerio de Hacienda
  - **Acción:** Documentar endpoints, formatos, flujos
  - **Prioridad:** 🟡 MEDIA

---

## 🔧 Configuración y Entorno

### 🔴 Crítico - No Implementado

- [ ] **Archivos de entorno**
  - **Problema:** No existen `environment.ts` y `environment.prod.ts`
  - **Acción:** Crear archivos de configuración
  - **Prioridad:** 🔴 ALTA

- [ ] **Configuración de Firebase**
  - **Problema:** No hay configuración
  - **Acción:** Agregar configuración en environment
  - **Prioridad:** 🔴 ALTA

- [ ] **Variables de configuración**
  - **Problema:** Valores hardcodeados
  - **Acción:** Mover a variables de entorno
  - **Prioridad:** 🟡 MEDIA

### ⚠️ Importante

- [ ] **Scripts de build optimizados**
  - **Problema:** Scripts básicos en package.json
  - **Acción:** Agregar scripts para diferentes ambientes
  - **Prioridad:** 🟢 BAJA

---

## 🎨 UI/UX y Mejoras

### ⚠️ Importante

- [ ] **Eliminar console.logs**
  - **Problema:** Múltiples console.log en código de producción
  - **Archivos afectados:**
    - `src/app/pages/clientes/clientes-page.component.ts` (7 console.log)
    - `src/app/components/sign-up/sign-up.component.ts` (1 console.log)
    - `src/app/components/forgot-password/forgot-password.component.ts` (1 console.log)
  - **Acción:** Eliminar o reemplazar con logger service
  - **Prioridad:** 🟡 MEDIA

- [ ] **Manejo de estados vacíos**
  - **Problema:** Algunos componentes muestran estados vacíos, otros no
  - **Acción:** Estandarizar estados vacíos en todos los listados
  - **Prioridad:** 🟢 BAJA

- [ ] **Responsive design**
  - **Problema:** No verificado
  - **Acción:** Verificar y ajustar para móviles/tablets
  - **Prioridad:** 🟡 MEDIA

- [ ] **Accesibilidad (a11y)**
  - **Problema:** No hay atributos ARIA ni navegación por teclado
  - **Acción:** Mejorar accesibilidad
  - **Prioridad:** 🟢 BAJA

- [ ] **Internacionalización (i18n)**
  - **Problema:** Textos hardcodeados en español
  - **Acción:** Implementar i18n si se requiere multiidioma
  - **Prioridad:** 🟢 BAJA

---

## 🔒 Seguridad

### 🔴 Crítico - No Implementado

- [ ] **Reglas de seguridad de Firestore**
  - **Problema:** No están configuradas
  - **Acción:** Implementar según `FIREBASE_DB_STRUCTURE.md`
  - **Prioridad:** 🔴 ALTA

- [ ] **Validación de datos en backend**
  - **Problema:** Solo validación en frontend
  - **Acción:** Implementar Cloud Functions para validación
  - **Prioridad:** 🟡 MEDIA

- [ ] **Sanitización de inputs**
  - **Problema:** No verificado
  - **Acción:** Verificar y agregar sanitización
  - **Prioridad:** 🟡 MEDIA

- [ ] **Rate limiting**
  - **Problema:** No implementado
  - **Acción:** Configurar límites de rate en Firebase
  - **Prioridad:** 🟢 BAJA

### ⚠️ Importante

- [ ] **Encriptación de datos sensibles**
  - **Problema:** Tokens y credenciales pueden estar expuestos
  - **Acción:** Revisar y encriptar datos sensibles
  - **Prioridad:** 🟡 MEDIA

---

## ⚡ Optimizaciones

### ⚠️ Importante

- [ ] **Lazy loading de módulos**
  - **Problema:** Todas las páginas usan lazy loading, verificar optimización
  - **Acción:** Revisar y optimizar carga de módulos
  - **Prioridad:** 🟢 BAJA

- [ ] **Caché de datos**
  - **Problema:** No hay estrategia de caché
  - **Acción:** Implementar caché para datos frecuentes
  - **Prioridad:** 🟢 BAJA

- [ ] **Optimización de imágenes**
  - **Problema:** No verificado
  - **Acción:** Optimizar imágenes y usar formato moderno
  - **Prioridad:** 🟢 BAJA

- [ ] **Bundle size optimization**
  - **Problema:** No verificado
  - **Acción:** Analizar y optimizar tamaño del bundle
  - **Prioridad:** 🟢 BAJA

---

## 📝 Resumen de Prioridades

### 🔴 ALTA Prioridad (Crítico para funcionamiento básico)
1. Autenticación completa (Login, Sign Up, Password Recovery)
2. Integración con Firebase (Instalación, Configuración, Servicios)
3. Guardar/Generar DTE
4. CRUD completo de Clientes, Productos, Sucursales
5. Integración con Ministerio de Hacienda
6. Configuración de Firestore y reglas de seguridad
7. Generación de número de control y numeración automática

### 🟡 MEDIA Prioridad (Importante para experiencia de usuario)
1. Validaciones y manejo de errores
2. Generación de PDF/XML/QR
3. Envío de correos
4. Vista previa de DTE
5. Edición de empresa
6. Reportes
7. Variables de entorno
8. Eliminar console.logs
9. Responsive design

### 🟢 BAJA Prioridad (Mejoras y optimizaciones)
1. Testing completo
2. Paginación y búsqueda avanzada
3. Exportación de reportes
4. Optimizaciones de performance
5. Documentación adicional
6. Accesibilidad
7. Internacionalización

---

## 📌 Notas Adicionales

1. **Datos Mock**: Todos los datos están en archivos JSON mock. Estos deben migrarse a Firebase cuando se implemente el backend.

2. **Estructura de Base de Datos**: Ya existe documentación completa en `FIREBASE_DB_STRUCTURE.md` que debe seguirse.

3. **Ejemplos de Implementación**: Referirse a `FIREBASE_IMPLEMENTATION_EXAMPLES.md` para ver ejemplos de código.

4. **Siguiente Paso Recomendado**: 
   - Instalar Firebase
   - Configurar proyecto Firebase
   - Implementar autenticación
   - Crear servicios básicos de Firebase
   - Migrar datos mock

---

**Última actualización:** Diciembre 2024  
**Mantener este documento actualizado** conforme se completen las tareas.

