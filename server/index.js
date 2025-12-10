const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Configuración de PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'factura_llama_clon_db',
  user: process.env.DB_USER || 'mrgomez',
  password: process.env.DB_PASSWORD || 'Karin2100',
});

// Verificar conexión
pool.on('connect', () => {
  console.log('✅ Conectado a PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Error inesperado en PostgreSQL:', err);
});

// Endpoint de salud
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'ok', database: 'connected', time: result.rows[0].now });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Endpoint para ejecutar queries
app.post('/api/query', async (req, res) => {
  try {
    let { sql, params = [] } = req.body;
    
    // Convertir INSERT OR IGNORE a INSERT ... ON CONFLICT DO NOTHING
    sql = convertInsertOrIgnore(sql);
    
    const result = await pool.query(sql, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error en query:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para ejecutar comandos (INSERT, UPDATE, DELETE)
app.post('/api/execute', async (req, res) => {
  try {
    let { sql, params = [] } = req.body;
    
    // Convertir INSERT OR IGNORE a INSERT ... ON CONFLICT DO NOTHING
    sql = convertInsertOrIgnore(sql);
    
    const result = await pool.query(sql, params);
    res.json({ 
      rowCount: result.rowCount,
      rows: result.rows 
    });
  } catch (error) {
    console.error('Error en execute:', error);
    res.status(500).json({ error: error.message });
  }
});

// Función helper para convertir INSERT OR IGNORE
function convertInsertOrIgnore(sql) {
  if (!sql.includes('INSERT OR IGNORE')) {
    return sql;
  }
  
  // Mapeo de tablas a sus claves primarias
  const primaryKeys = {
    'users': 'id',
    'empresas': 'id',
    'clientes': 'id',
    'productos': 'id',
    'sucursales': 'id',
    'formas_pago': 'id',
    'tipos_dte': 'codigo',
    'user_config': 'id',
    'empresa_config': 'id'
  };
  
  // Extraer la tabla
  const tableMatch = sql.match(/INSERT OR IGNORE INTO\s+(\w+)/i);
  if (tableMatch) {
    const table = tableMatch[1];
    const pk = primaryKeys[table] || 'id';
    sql = sql.replace(/INSERT OR IGNORE INTO/i, 'INSERT INTO');
    
    // Agregar ON CONFLICT si no existe
    if (!sql.includes('ON CONFLICT')) {
      // Buscar el final de VALUES
      const valuesMatch = sql.match(/VALUES\s*\([^)]+\)/i);
      if (valuesMatch) {
        sql = sql.replace(/VALUES\s*\([^)]+\)/i, (match) => {
          return match + ` ON CONFLICT (${pk}) DO NOTHING`;
        });
      }
    }
  } else {
    sql = sql.replace(/INSERT OR IGNORE/gi, 'INSERT');
  }
  
  return sql;
}

// Iniciar servidor
app.listen(port, () => {
  console.log(`🚀 Servidor backend corriendo en http://localhost:${port}`);
});
