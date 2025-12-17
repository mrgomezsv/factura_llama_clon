# Manual de Configuración para Pruebas DTE

Este documento detalla los pasos para configurar el sistema WavePos DTE para realizar transmisiones de prueba al Ministerio de Hacienda.

## Requisitos Previos

1.  **Credenciales de API (Hacienda)**: Debe tener su usuario (NIT) y contraseña de API proporcionados por Hacienda para el ambiente de pruebas (`apitest`).
2.  **Certificado de Firma**: El sistema debe tener cargado el certificado de pruebas (`.crt`).
    *   *Nota: En la configuración actual de desarrollo, el certificado de pruebas genérico ya se encuentra instalado. Si requiere subir uno propio, contacte a soporte técnico.*

## Pasos de Configuración en WavePos

Siga estos pasos en la aplicación para habilitar el modo de pruebas:

1.  **Abrir Configuración**:
    *   Haga clic en el icono de **engranaje** o en su perfil en la esquina superior derecha.
    *   Seleccione **Configuración**.

2.  **Acceder a Datos de Empresa**:
    *   En el menú lateral del modal, haga clic en **"Mi Empresa"**.

3.  **Configurar Integración**:
    *   Desplácese hacia abajo hasta encontrar la sección **"Integración con Hacienda"** y haga clic para expandirla.

4.  **Seleccionar Ambiente**:
    *   Busque el control **"Ambiente Activo de Transmisión"**.
    *   Seleccione la opción **"Ambiente de PRUEBAS"**.
    *   *Verá un mensaje informativo azul confirmando que el sistema está en modo de pruebas.*

5.  **Ingresar Credenciales de Transmisión**:
    *   **Certificado (Ambiente de Prueba)**: Este campo es informativo en esta versión. Puede dejar el valor por defecto.
    *   **Contraseña API (Ambiente de Prueba)**: Ingrese aquí la **contraseña de API** que le brindó Hacienda (la misma que usa para obtener el token de seguridad).
        *   *Importante: No confunda esta contraseña con la clave privada del certificado.*

6.  **Guardar Cambios**:
    *   Haga clic en el botón **"Guardar Cambios"** al final del formulario.
    *   El sistema confirmará que la empresa ha sido actualizada.

## Verificar Transmisión

Una vez configurado:

1.  Vaya a la sección de **Ventas**.
2.  Cree una nueva factura (FAC) o crédito fiscal (CCF).
3.  Al finalizar la venta, el sistema intentará automáticamente:
    *   Firmar el documento (usando el certificado instalado).
    *   Transmitirlo a Hacienda (usando las credenciales API y URL de pruebas que acaba de configurar).
4.  Si la transmisión es exitosa, verá el estado **PROCESADO** en el historial de documentos.
    *   Si recibe error "CREDENCIALES INVÁLIDAS", verifique la contraseña ingresada en el paso 5.
