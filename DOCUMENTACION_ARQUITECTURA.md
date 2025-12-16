# Documentación de Arquitectura de Datos DTE

## Diagrama Entidad-Relación (ERD)

Este diagrama refleja la estructura actual de la base de datos PostgreSQL, diseñada para soportar múltiples empresas (Multi-Tenant) con configuraciones y certificados independientes, y almacenamiento especializado por tipo de documento.

```mermaid
erDiagram
    users ||--o{ empresas : "pertenece_a"
    empresas ||--|| empresa_config : "tiene_configuracion"
    empresas ||--|| empresa_certificados : "tiene_seguridad"
    empresas ||--o{ clientes : "gestiona"
    
    %% Tablas de Documentos (Una por tipo para eficiencia y claridad)
    empresas ||--o{ documento_factura : "emite"
    empresas ||--o{ documento_credito_fiscal : "emite"
    empresas ||--o{ documento_nota_credito : "emite"
    empresas ||--o{ documento_nota_debito : "emite"
    empresas ||--o{ documento_nota_remision : "emite"
    empresas ||--o{ documento_factura_exportacion : "emite"
    
    users {
        uuid id PK
        string email
        string password_hash
        uuid empresa_id FK
    }

    empresas {
        uuid id PK
        string nombre
        string nit
    }

    empresa_config {
        uuid id PK
        uuid empresa_id FK
        string codigo_mh "Código Establecimiento + Punto Emisión"
        string cert_password_pri_prueba
        string password_api_prueba "Credencial API MH"
        boolean ambiente_pruebas_activo
    }

    empresa_certificados {
        uuid id PK
        uuid empresa_id FK
        string ruta_archivo_crt
        timestamp fecha_vencimiento
    }

    documento_factura {
        uuid id PK
        uuid empresa_id FK
        string codigo_generacion "UUID v4"
        string control_number "DTE-01-..."
        string sello_recibido
        string estado "PROCESADO | RECHAZADO | GENERADO"
        jsonb json_firmado
    }
```

## Flujo de Autenticación y Cambio de Contexto

1.  **Login**: Usuario ingresa credenciales -> Servidor valida -> Retorna JWT con `empresaId`.
2.  **Operación**: Cada petición valida el JWT y extrae `empresaId` para asegurar que el usuario solo opere sobre su empresa.
3.  **Cambio de Empresa**: Si el usuario cambia de empresa o crea una nueva:
    *   Backend actualiza `users.empresa_id`.
    *   Frontend llama a `POST /api/auth/refresh-token` para obtener un nuevo JWT con el nuevo `empresaId`.
    *   Siguientes peticiones usan el contexto actualizado automáticamente.
