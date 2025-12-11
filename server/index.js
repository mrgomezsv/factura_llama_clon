const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const dteBuilder = require('./services/dte-builder');
const dteSigner = require('./services/dte-signer');
const dtePdfGenerator = require('./services/dte-pdf-generator');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

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

// Endpoint para generar DTE completo
app.post('/api/dtes/generar', async (req, res) => {
  try {
    console.log('📥 Recibida petición para generar DTE');
    const {
      tipoDte = 'FAC',
      empresaId,
      clienteId,
      items,
      totales,
      retenciones = { renta: 0, iva: 0 },
      descuentoGlobal = 0,
      otrosMontosNoAfectos = 0,
      ambiente = 'PRUEBAS'
    } = req.body;

    console.log('📋 Datos recibidos:', {
      tipoDte,
      empresaId,
      clienteId,
      itemsCount: items?.length || 0,
      totales: totales ? 'presente' : 'ausente'
    });

    // Validar datos requeridos
    if (!empresaId) {
      return res.status(400).json({ error: 'empresaId es requerido' });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Se requiere al menos un item' });
    }

    // Obtener configuración de empresa
    console.log('🏢 Obteniendo configuración de empresa:', empresaId);
    const empresaResult = await pool.query(
      'SELECT * FROM empresa_config WHERE empresa_id = $1',
      [empresaId]
    );

    if (empresaResult.rows.length === 0) {
      console.error('❌ Configuración de empresa no encontrada para:', empresaId);
      return res.status(404).json({ error: 'Configuración de empresa no encontrada' });
    }

    const empresaConfig = empresaResult.rows[0];
    console.log('✅ Configuración de empresa obtenida');

    // Obtener datos del cliente
    let cliente = { nombre: 'CONSUMIDOR FINAL' };
    if (clienteId) {
      const clienteResult = await pool.query(
        'SELECT * FROM clientes WHERE id = $1',
        [clienteId]
      );
      if (clienteResult.rows.length > 0) {
        cliente = clienteResult.rows[0];
      }
    }

    // Obtener el siguiente número de documento
    // Primero mapear el tipoDte al código numérico para la consulta
    const tipoDteCodigo = dteBuilder.mapTipoDte(tipoDte);
    
    const lastDteResult = await pool.query(
      `SELECT numero_documento FROM dtes 
       WHERE empresa_id = $1 AND (tipo_dte = $2 OR tipo = $3)
       ORDER BY numero_documento DESC NULLS LAST LIMIT 1`,
      [empresaId, tipoDteCodigo, tipoDte]
    );

    const nextNumero = lastDteResult.rows.length > 0 && lastDteResult.rows[0].numero_documento !== null
      ? parseInt(lastDteResult.rows[0].numero_documento) + 1 
      : 1;

    // Construir JSON del DTE (tipoDteCodigo ya fue calculado arriba)
    const { dteJson, codigoGeneracion, numeroControl } = dteBuilder.buildDteJson({
      tipoDte,
      empresaConfig: {
        nombreLegal: empresaConfig.nombre_legal,
        nombreComercial: empresaConfig.nombre_comercial,
        nit: empresaConfig.nit,
        nrc: empresaConfig.nrc,
        direccion: empresaConfig.direccion,
        telefono: empresaConfig.telefono,
        correo: empresaConfig.correo,
        actividadEconomicaPrimaria: empresaConfig.actividad_economica_primaria,
        codigoMH: empresaConfig.codigo_mh,
        logoUrl: empresaConfig.logo_url
      },
      cliente: {
        nombre: cliente.nombre,
        nit: cliente.nit,
        nrc: cliente.nrc,
        direccion: cliente.direccion,
        telefono: cliente.telefono,
        correo: cliente.correo,
        numeroDocumento: cliente.nit,
        departamento: null,
        municipio: null
      },
      items,
      totales,
      retenciones,
      descuentoGlobal,
      ambiente,
      numeroDocumento: nextNumero
    });

    // Firmar el DTE
    console.log('📝 Firmando DTE...');
    let dteFirmadoStr;
    try {
      dteFirmadoStr = await dteSigner.signDte(dteJson);
      if (!dteFirmadoStr) {
        console.warn('⚠️  No se pudo firmar el DTE, continuando sin firma para pruebas');
        // Para desarrollo, continuar sin firma
        dteFirmadoStr = JSON.stringify(dteJson);
      }
    } catch (signError) {
      console.warn('⚠️  Error al firmar DTE (continuando sin firma para pruebas):', signError.message);
      // Para desarrollo, continuar sin firma
      dteFirmadoStr = JSON.stringify(dteJson);
    }

    const dteFirmado = typeof dteFirmadoStr === 'string' ? JSON.parse(dteFirmadoStr) : dteFirmadoStr;

    // Guardar DTE en la base de datos
    const fechaEmision = new Date();
    const insertResult = await pool.query(
      `INSERT INTO dtes (
        control_number, tipo, tipo_dte, codigo_generacion, numero_control, numero_documento,
        receptor, total, ambiente, fecha_creacion, fecha_emision,
        empresa_id, cliente_id, estado, dte_json, dte_firmado
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING id`,
      [
        numeroControl,
        tipoDte,
        tipoDteCodigo,
        codigoGeneracion,
        numeroControl,
        nextNumero,
        cliente.nombre,
        totales.totalPagar || totales.montoTotalOperacion || 0,
        ambiente,
        fechaEmision,
        fechaEmision,
        empresaId,
        clienteId || null,
        'BORRADOR',
        JSON.stringify(dteJson),
        JSON.stringify(dteFirmado)
      ]
    );

    const dteId = insertResult.rows[0].id;

    // Generar PDF
    const dteData = {
      dte: {
        id: dteId,
        codigoGeneracion,
        numeroControl,
        tipoDte: tipoDteCodigo,
        fechaEmision,
        nombreReceptor: cliente.nombre,
        nitReceptor: cliente.nit,
        nrcReceptor: cliente.nrc,
        direccionReceptor: cliente.direccion,
        emailReceptor: cliente.correo,
        selloRecibido: null
      },
      empresaConfig: {
        nombreLegal: empresaConfig.nombre_legal || empresaConfig.nombre_comercial || '',
        nombreComercial: empresaConfig.nombre_comercial || empresaConfig.nombre_legal || '',
        nit: empresaConfig.nit || '',
        nrc: empresaConfig.nrc || '',
        direccion: empresaConfig.direccion || '',
        telefono: empresaConfig.telefono || '',
        correo: empresaConfig.correo || '',
        actividadEconomicaPrimaria: empresaConfig.actividad_economica_primaria || '',
        logoUrl: empresaConfig.logo_url || null
      }
    };

    console.log('📄 Generando PDF...');
    let pdfBuffer;
    try {
      pdfBuffer = await dtePdfGenerator.generatePdf(dteData, dteJson);
      if (!pdfBuffer) {
        throw new Error('PDF buffer es null o undefined');
      }
    } catch (pdfError) {
      console.error('❌ Error al generar PDF:', pdfError);
      throw new Error(`Error al generar PDF: ${pdfError.message}`);
    }

    // Actualizar estado del DTE a GENERADO
    await pool.query(
      'UPDATE dtes SET estado = $1 WHERE id = $2',
      ['GENERADO', dteId]
    );

    // Retornar PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="DTE-${tipoDte}-${numeroControl}.pdf"`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('❌ Error al generar DTE:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Endpoint para regenerar PDF de un DTE existente
app.get('/api/dtes/:id/pdf', async (req, res) => {
  try {
    const dteId = parseInt(req.params.id);
    
    if (isNaN(dteId)) {
      return res.status(400).json({ error: 'ID de DTE inválido' });
    }

    // Obtener DTE de la base de datos
    const dteResult = await pool.query(
      `SELECT d.*, e.*, c.nombre as cliente_nombre, c.nit as cliente_nit, c.nrc as cliente_nrc, 
              c.direccion as cliente_direccion, c.correo as cliente_correo
       FROM dtes d
       LEFT JOIN empresas e ON d.empresa_id = e.id
       LEFT JOIN clientes c ON d.cliente_id = c.id
       WHERE d.id = $1`,
      [dteId]
    );

    if (dteResult.rows.length === 0) {
      return res.status(404).json({ error: 'DTE no encontrado' });
    }

    const dte = dteResult.rows[0];
    
    if (!dte.dte_json) {
      return res.status(400).json({ error: 'DTE no tiene JSON asociado' });
    }

    const dteJson = typeof dte.dte_json === 'string' ? JSON.parse(dte.dte_json) : dte.dte_json;
    const identificacion = dteJson.identificacion || {};
    const tipoDteCodigo = identificacion.tipoDte || dte.tipo_dte;

    // Obtener configuración de empresa
    const empresaConfigResult = await pool.query(
      'SELECT * FROM empresa_config WHERE empresa_id = $1 LIMIT 1',
      [dte.empresa_id]
    );

    if (empresaConfigResult.rows.length === 0) {
      return res.status(404).json({ error: 'Configuración de empresa no encontrada' });
    }

    const empresaConfig = empresaConfigResult.rows[0];

    // Preparar datos para generar PDF
    const dteData = {
      dte: {
        id: dte.id,
        codigoGeneracion: dte.codigo_generacion,
        numeroControl: dte.numero_control,
        tipoDte: tipoDteCodigo,
        fechaEmision: dte.fecha_emision || dte.fecha_creacion,
        nombreReceptor: dte.receptor || dte.cliente_nombre,
        nitReceptor: dte.cliente_nit,
        nrcReceptor: dte.cliente_nrc,
        direccionReceptor: dte.cliente_direccion,
        emailReceptor: dte.cliente_correo,
        selloRecibido: dte.sello_recibido
      },
      empresaConfig: {
        nombreLegal: empresaConfig.nombre_legal || empresaConfig.nombre_comercial || '',
        nombreComercial: empresaConfig.nombre_comercial || empresaConfig.nombre_legal || '',
        nit: empresaConfig.nit || '',
        nrc: empresaConfig.nrc || '',
        direccion: empresaConfig.direccion || '',
        telefono: empresaConfig.telefono || '',
        correo: empresaConfig.correo || '',
        actividadEconomicaPrimaria: empresaConfig.actividad_economica_primaria || '',
        logoUrl: empresaConfig.logo_url || null
      }
    };

    // Generar QR antes de generar PDF
    const qrImage = await dtePdfGenerator.generateQrCode(dte.codigo_generacion);
    dteData.dte.qrImage = qrImage;

    // Generar PDF
    console.log(`📄 Regenerando PDF para DTE ${dteId}...`);
    const pdfBuffer = await dtePdfGenerator.generatePdf(dteData, dteJson);
    
    if (!pdfBuffer) {
      throw new Error('Error al generar PDF');
    }

    // Retornar PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="DTE-${dte.numero_control || dteId}.pdf"`);
    res.send(pdfBuffer);

  } catch (error) {
    console.error('❌ Error al regenerar PDF:', error);
    res.status(500).json({ 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`🚀 Servidor backend corriendo en http://localhost:${port}`);
});
