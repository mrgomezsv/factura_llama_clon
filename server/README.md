# Servidor Backend - PostgreSQL

Este servidor backend proporciona una API REST para conectarse a PostgreSQL desde la aplicación Angular.

## Requisitos

- PostgreSQL instalado y corriendo
- Node.js y npm instalados

## Configuración

1. Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=factura_llama_clon_db
DB_USER=mrgomez
DB_PASSWORD=Karin2100
PORT=3000
```

## Inicialización

1. **Crear la base de datos y tablas:**
   ```bash
   npm run db:create
   ```

2. **Iniciar el servidor:**
   ```bash
   npm run server
   ```

   O en modo desarrollo (con nodemon si está instalado):
   ```bash
   npm run server:dev
   ```

El servidor estará disponible en `http://localhost:3000`

## Endpoints

- `GET /api/health` - Verifica la conexión con PostgreSQL
- `POST /api/query` - Ejecuta consultas SELECT
- `POST /api/execute` - Ejecuta comandos INSERT, UPDATE, DELETE

## Notas

- El servidor debe estar corriendo antes de iniciar la aplicación Angular
- El servidor convierte automáticamente sintaxis de SQLite a PostgreSQL
- Los parámetros se convierten de `?` a `$1, $2, etc.`
