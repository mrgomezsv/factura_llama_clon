const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const dteBuilder = require('./services/dte-builder');
const dteSigner = require('./services/dte-signer');
const dtePdfGenerator = require('./services/dte-pdf-generator');
const dteApiService = require('./services/dte-api.service');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const authMiddleware = require('./middleware/auth.middleware');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'secret_para_desarrollo_123';

/**
 * Mapea el tipo de documento a su tabla correspondiente
 */
function getTableNameByTipoDte(tipoDte) {
  const tipoToTable = {
    'FAC': 'documento_factura',
    'CCF': 'documento_credito_fiscal',
    'NCR': 'documento_nota_credito',
    'NDB': 'documento_nota_debito',
    'FSE': 'documento_factura_sujeto_excluido',
    'FEX': 'documento_factura_exportacion',
    'REM': 'documento_nota_remision',
    'CRT': 'documento_comprobante_retencion'
  };

  return tipoToTable[tipoDte] || null;
}

/**
 * Normaliza códigos antiguos de tipo_dte a los nuevos según esquemas JSON
 * Convierte '02' (antiguo código de FAC) a '01' (nuevo código según fe-fc-v1.json)
 */
function normalizeTipoDteCodigo(tipoDteCodigo) {
  // Si el código es '02', convertir a '01' (FAC según fe-fc-v1.json)
  if (tipoDteCodigo === '02') {
    return '01';
  }
  return tipoDteCodigo;
}

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Configuración de PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'wavepos_dte_v2',
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
// Endpoint para ejecutar queries (Protegido)
app.post('/api/query', authMiddleware, async (req, res) => {
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
// Endpoint para ejecutar comandos (INSERT, UPDATE, DELETE) (Protegido)
app.post('/api/execute', authMiddleware, async (req, res) => {
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
  return sql;
}

// Endpoint de Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Buscar usuario
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const user = result.rows[0];

    // 2. Verificar contraseña (asumiendo que están hasheadas con bcrypt)
    // Si en la base de datos hay contraseñas en texto plano (legacy), manejar esa excepción o migrar
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // 3. Verificar que tenga una empresa asignada
    if (!user.empresa_id) {
      return res.status(403).json({ error: 'Usuario no tiene empresa asignada. Contacte soporte.' });
    }

    // 4. Generar Token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        empresaId: user.empresa_id,
        role: user.role || 'USER'
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        empresaId: user.empresa_id
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Endpoint para generar DTE completo
// Endpoint para generar DTE completo (Protegido y Seguro)
app.post('/api/dtes/generar', authMiddleware, async (req, res) => {
  try {
    console.log('📥 Recibida petición para generar DTE');
    const {
      tipoDte = 'FAC',
      // empresaId, // NO LEER DEL BODY - INSEGURO
      clienteId,
      items,
      totales,
      retenciones = { renta: 0, iva: 0 },
      descuentoGlobal = 0,
      otrosMontosNoAfectos = 0,
      ambiente = 'PRUEBAS'
    } = req.body;

    // USAR EL ID DE LA EMPRESA DEL TOKEN VALIDADO
    const empresaId = req.user.empresaId;

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
    const tableName = getTableNameByTipoDte(tipoDte);

    if (!tableName) {
      return res.status(400).json({ error: `Tipo de documento no válido: ${tipoDte}` });
    }

    const lastDteResult = await pool.query(
      `SELECT numero_documento FROM ${tableName} 
       WHERE empresa_id = $1 AND tipo_dte = $2
       ORDER BY numero_documento DESC NULLS LAST LIMIT 1`,
      [empresaId, tipoDteCodigo]
    );

    const nextNumero = lastDteResult.rows.length > 0 && lastDteResult.rows[0].numero_documento !== null
      ? parseInt(lastDteResult.rows[0].numero_documento) + 1
      : 1;

    // Construir JSON del DTE (tipoDteCodigo ya fue calculado arriba)
    const fechaEmision = new Date();
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
      items,
      totales,
      retenciones,
      descuentoGlobal,
      ambiente,
      numeroDocumento: nextNumero,
      // Nuevos campos para exportación
      incoterms: req.body.incoterms,
      modoTransporte: req.body.modoTransporte,
      recintoFiscal: req.body.recintoFiscal,
      regimenAduanero: req.body.regimenAduanero
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

    const { incoterms, modoTransporte, recintoFiscal, regimenAduanero } = req.body;

    // --- TRANSMISIÓN A HACIENDA ---
    console.log('🚀 Iniciando transmisión a MH...');
    let mhResponse = { success: false, estado: 'ERROR_TRANSMISION' };

    // Solo intentar enviar si se firmó correctamente (es un objeto/string válido)
    if (dteFirmadoStr) {
      try {
        // Configurar credenciales dinámicas desde la BD
        const mhConfig = {
          user: empresaConfig.nit, // El usuario suele ser el NIT
          pwd: ambiente === 'PRODUCCIÓN' ? empresaConfig.password_api_produccion : empresaConfig.password_api_prueba,
          nit: empresaConfig.nit
        };

        // Enviar a MH usando las credenciales de la empresa
        mhResponse = await dteApiService.enviarDte(dteFirmado, null, mhConfig);
      } catch (apiError) {
        console.error('⚠️ Error crítico al comunicar con MH:', apiError.message);
        // Mantenemos el estado de error
      }
    } else {
      console.warn('⚠️ No se envía a MH porque no hay DTE firmado');
    }

    const estadoFinal = mhResponse.success ? 'PROCESADO' : (mhResponse.estado || 'RECHAZADO');

    // Construir query de inserción dinámica según el tipo de DTE
    const columns = [
      'control_number', 'tipo_dte', 'codigo_generacion', 'numero_control', 'numero_documento',
      'receptor', 'total', 'ambiente', 'fecha_creacion', 'fecha_emision',
      'empresa_id', 'cliente_id', 'estado', 'dte_json', 'dte_firmado',
      'sello_recibido', 'codigo_mensaje', 'descripcion_mensaje', 'observaciones'
    ];

    const values = [
      numeroControl, tipoDteCodigo, codigoGeneracion, numeroControl, nextNumero,
      cliente.nombre, totales.totalPagar || totales.montoTotalOperacion || 0, ambiente, fechaEmision, fechaEmision,
      empresaId, clienteId || null, estadoFinal, JSON.stringify(dteJson), JSON.stringify(dteFirmado),
      mhResponse.selloRecibido || null, mhResponse.codigoMensaje || null, mhResponse.descripcionMensaje || null, JSON.stringify(mhResponse.observaciones || [])
    ];

    // Agregar campos específicos para Exportación (FEX)
    if (tipoDte === 'FEX') {
      columns.push('incoterms', 'modo_transporte', 'recinto_fiscal', 'regimen_aduanero');
      values.push(incoterms || null, modoTransporte || null, recintoFiscal || null, regimenAduanero || null);
    }

    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    const insertQuery = `
      INSERT INTO ${tableName} (${columns.join(', ')})
      VALUES (${placeholders})
      RETURNING id
    `;

    const insertResult = await pool.query(insertQuery, values);

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
      `UPDATE ${tableName} SET estado = $1 WHERE id = $2`,
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

    // Buscar el DTE en todas las tablas posibles
    const tables = [
      'documento_factura',
      'documento_credito_fiscal',
      'documento_nota_credito',
      'documento_nota_debito',
      'documento_factura_sujeto_excluido',
      'documento_factura_exportacion',
      'documento_nota_remision',
      'documento_comprobante_retencion'
    ];

    let dteResult = null;
    let tableName = null;

    for (const table of tables) {
      const result = await pool.query(
        `SELECT d.*, e.*, c.nombre as cliente_nombre, c.nit as cliente_nit, c.nrc as cliente_nrc, 
                c.direccion as cliente_direccion, c.correo as cliente_correo
         FROM ${table} d
         LEFT JOIN empresas e ON d.empresa_id = e.id
         LEFT JOIN clientes c ON d.cliente_id = c.id
         WHERE d.id = $1`,
        [dteId]
      );

      if (result.rows.length > 0) {
        dteResult = result;
        tableName = table;
        break;
      }
    }

    if (!dteResult || dteResult.rows.length === 0) {
      return res.status(404).json({ error: 'DTE no encontrado' });
    }

    const dte = dteResult.rows[0];

    if (!dte.dte_json) {
      return res.status(400).json({ error: 'DTE no tiene JSON asociado' });
    }

    const dteJson = typeof dte.dte_json === 'string' ? JSON.parse(dte.dte_json) : dte.dte_json;
    const identificacion = dteJson.identificacion || {};
    // Normalizar código: preferir el del JSON, si no existe usar el de la BD y normalizarlo
    let tipoDteCodigo = identificacion.tipoDte || normalizeTipoDteCodigo(dte.tipo_dte);

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
