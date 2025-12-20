require('dotenv').config();
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
// require('dotenv').config(); // Moved to top
const { setupCatalogs } = require('./setup-catalogs');
const { initializeDatabase } = require('./verify-db');

const JWT_SECRET = process.env.JWT_SECRET || 'secret_para_desarrollo_123';

/**
 * Mapea el tipo de documento a su tabla correspondiente
 */
function getTableNameByTipoDte(tipoDte) {
  const tipoToTable = {
    'FAC': 'documento_factura',
    'CCF': 'documento_credito_fiscal',
    '01': 'documento_factura',
    '03': 'documento_credito_fiscal',
    'NCR': 'documento_nota_credito',
    'NDB': 'documento_nota_debito',
    'FSE': 'documento_factura_sujeto_excluido',
    'FEX': 'documento_factura_exportacion',
    'REM': 'documento_nota_remision',
    'CRT': 'documento_comprobante_retencion',
    '05': 'documento_nota_credito',
    '06': 'documento_nota_debito'
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

// Endpoint de Registro
app.post('/api/auth/register', async (req, res) => {
  const { email, password, displayName } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son requeridos' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Verificar si el usuario ya existe
    const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existingUser.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Este correo electrónico ya está registrado' });
    }

    // 2. Generar IDs únicos
    const userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const empresaId = 'emp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const configId = 'conf_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    // 3. Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Insertar datos en DB
    // a) Empresa (Usar displayName como nombre)
    // NOTA: La tabla empresas usa 'nombre', NO 'nombre_comercial'
    await client.query(
      'INSERT INTO empresas (id, nombre) VALUES ($1, $2)',
      [empresaId, displayName || 'Mi Empresa']
    );

    // b) Configuración de empresa
    await client.query(
      'INSERT INTO empresa_config (id, empresa_id, nombre_comercial) VALUES ($1, $2, $3)',
      [configId, empresaId, displayName || 'Mi Empresa']
    );

    // c) Usuario
    await client.query(
      'INSERT INTO users (id, email, password_hash, display_name, empresa_id) VALUES ($1, $2, $3, $4, $5)',
      [userId, email.toLowerCase().trim(), hashedPassword, displayName, empresaId]
    );

    // d) Configuración de usuario
    await client.query(
      'INSERT INTO user_config (id, user_id, rol) VALUES ($1, $2, $3)',
      ['uc_' + Date.now(), userId, 'PROPIETARIO']
    );

    await client.query('COMMIT');

    // 5. Generar Token
    const token = jwt.sign(
      {
        id: userId,
        email: email.toLowerCase().trim(),
        empresaId: empresaId,
        role: 'PROPIETARIO'
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    // 8. Retornar éxito con token y usuario
    res.status(201).json({
      message: 'Cuenta creada exitosamente',
      token,
      user: {
        id: userId,
        email: email.toLowerCase().trim(),
        displayName: displayName,
        empresaId: empresaId
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message || 'Error al registrar usuario' });
  } finally {
    client.release();
  }
});

// Endpoint para refrescar token (actualizar claims como empresaId)
app.post('/api/auth/refresh-token', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    // Buscar información actualizada del usuario
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = result.rows[0];

    // Generar Nuevo Token con claims actualizados
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
    console.error('Refresh token error:', error);
    res.status(500).json({ error: 'Error al refrescar token' });
  }
});
// Endpoint para subir certificado
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const certDir = path.join(__dirname, 'certs');
    if (!fs.existsSync(certDir)) {
      fs.mkdirSync(certDir, { recursive: true });
    }
    cb(null, certDir)
  },
  filename: function (req, file, cb) {
    // El nombre se asignará en el controlador basado en el NIT de la empresa
    // Por ahora usamos un temporal que luego renombraremos
    cb(null, 'temp-' + Date.now() + '-' + file.originalname)
  }
});

const upload = multer({ storage: storage });

app.post('/api/empresas/:id/certificado', authMiddleware, upload.single('certificado'), async (req, res) => {
  const client = await pool.connect();
  const uploadedFile = req.file;

  try {
    const empresaId = req.params.id;
    const {
      passwordPriPrueba,
      passwordPubPrueba,
      passwordPriProduccion,
      passwordPubProduccion,
      ambiente
    } = req.body;

    console.log(`🔐 Configurando certificado para empresa ${empresaId}, Ambiente: ${ambiente}`);

    await client.query('BEGIN');

    // 1. Obtener NIT de la empresa para nombrar el archivo
    const empresaRes = await client.query('SELECT nit FROM empresa_config WHERE empresa_id = $1', [empresaId]);

    if (empresaRes.rows.length === 0) {
      if (uploadedFile) fs.unlinkSync(uploadedFile.path); // Limpiar temp
      throw new Error('Empresa no encontrada');
    }

    const nit = empresaRes.rows[0].nit;
    if (!nit) {
      if (uploadedFile) fs.unlinkSync(uploadedFile.path); // Limpiar temp
      throw new Error('La empresa no tiene NIT configurado. Configure el NIT primero.');
    }

    // 2. Procesar archivo si se subió uno
    let certPath = null;
    if (uploadedFile) {
      const finalPath = path.join(__dirname, 'certs', `${nit}.crt`);
      fs.renameSync(uploadedFile.path, finalPath);
      fs.chmodSync(finalPath, 0o644);
      certPath = `${nit}.crt`; // Guardamos solo el nombre relativo
      console.log(`✅ Certificado guardado en: ${finalPath}`);
    }

    // 3. Actualizar contraseñas en tabla 'empresa_certificados'
    // Usamos UPSERT (Insert or Update)

    // Primero verificar si existe registro
    const certRow = await client.query('SELECT id FROM empresa_certificados WHERE empresa_id = $1', [empresaId]);

    if (certRow.rows.length === 0) {
      // Insertar
      await client.query(`
            INSERT INTO empresa_certificados 
            (empresa_id, password_pri_prueba, password_pub_prueba, password_pri_produccion, password_pub_produccion, cert_path_prueba, cert_path_produccion)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
        empresaId,
        passwordPriPrueba || null,
        passwordPubPrueba || null,
        passwordPriProduccion || null,
        passwordPubProduccion || null,
        ambiente === 'PRUEBAS' && certPath ? certPath : null,
        ambiente === 'PRODUCCION' && certPath ? certPath : null
      ]);
    } else {
      // Actualizar dinámicamente
      let updateFields = [];
      let values = [];
      let paramCount = 1;

      if (passwordPriPrueba) { updateFields.push(`password_pri_prueba = $${paramCount++}`); values.push(passwordPriPrueba); }
      if (passwordPubPrueba) { updateFields.push(`password_pub_prueba = $${paramCount++}`); values.push(passwordPubPrueba); }
      if (passwordPriProduccion) { updateFields.push(`password_pri_produccion = $${paramCount++}`); values.push(passwordPriProduccion); }
      if (passwordPubProduccion) { updateFields.push(`password_pub_produccion = $${paramCount++}`); values.push(passwordPubProduccion); }

      if (certPath) {
        if (ambiente === 'PRUEBAS') {
          updateFields.push(`cert_path_prueba = $${paramCount++}`); values.push(certPath);
        } else {
          updateFields.push(`cert_path_produccion = $${paramCount++}`); values.push(certPath);
        }
      }

      updateFields.push(`updated_at = NOW()`);

      if (updateFields.length > 0) {
        values.push(empresaId);
        const query = `UPDATE empresa_certificados SET ${updateFields.join(', ')} WHERE empresa_id = $${paramCount}`;
        await client.query(query, values);
      }
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Configuración de certificado actualizada exitosamente en tabla dedicada',
      certUploaded: !!uploadedFile,
      nit: nit
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error guardando certificado:', error);
    if (uploadedFile && fs.existsSync(uploadedFile.path)) {
      try { fs.unlinkSync(uploadedFile.path); } catch (e) { }
    }
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
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
      ambiente = 'PRUEBAS',
      documentoRelacionado = null
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

    // Unir con tabla de certificados
    const empresaResult = await pool.query(`
      SELECT ec.*, 
             crt.password_pri_prueba as cert_password_pri_prueba,
             crt.password_pub_prueba as cert_password_pub_prueba,
             crt.password_pri_produccion as cert_password_pri_produccion,
             crt.password_pub_produccion as cert_password_pub_produccion
      FROM empresa_config ec
      LEFT JOIN empresa_certificados crt ON ec.empresa_id = crt.empresa_id
      WHERE ec.empresa_id = $1
      `,
      [empresaId]
    );

    if (empresaResult.rows.length === 0) {
      console.error('❌ Configuración de empresa no encontrada para:', empresaId);
      return res.status(404).json({ error: 'Configuración de empresa no encontrada' });
    }

    const empresaConfig = empresaResult.rows[0];
    console.log('👀 DEBUG RAW DB ROW:', empresaConfig);
    console.log('✅ Configuración de empresa obtenida');

    // Obtener datos del cliente
    let cliente = null;
    if (clienteId) {
      const clienteResult = await pool.query(
        'SELECT * FROM clientes WHERE id = $1',
        [clienteId]
      );
      if (clienteResult.rows.length > 0) {
        cliente = clienteResult.rows[0];
      }
    } else if (req.body.cliente) {
      cliente = req.body.cliente;
    } else if (req.body.sujetoExcluido) {
      cliente = req.body.sujetoExcluido;
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

    const empresaConfigBuilder = {
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
    };

    const { dteJson, codigoGeneracion, numeroControl } = dteBuilder.buildDteJson({
      tipoDte,
      empresaConfig: empresaConfigBuilder,
      cliente: {
        nombre: cliente?.nombre || 'Consumidor Final',
        nit: cliente?.nit,
        nrc: cliente?.nrc,
        direccion: cliente?.direccion,
        telefono: cliente?.telefono,
        correo: cliente?.correo,
        numeroDocumento: cliente?.nit || cliente?.numDocumento,
        departamento: cliente?.departamento,
        municipio: cliente?.municipio,
        codActividad: cliente?.codActividad || cliente?.cod_actividad,
        descActividad: cliente?.descActividad || cliente?.desc_actividad,
      },
      sujetoExcluido: cliente, // Also pass as sujetoExcluido for FSEGenerator
      items,
      totalesByBody: totales, // Rename slightly to avoid confusion with internal calculation if any
      totales: totales || { totalPagar: 0, montoTotalOperacion: 0 },
      retenciones,
      documentoRelacionado, // Pasado explícitamente
      ambiente: ambiente, // Pasar ambiente para identificacion
      descuentoGlobal,
      numeroDocumento: nextNumero,
      // Nuevos campos para exportación
      incoterms: req.body.incoterms,
      modoTransporte: req.body.modoTransporte,
      recintoFiscal: req.body.recintoFiscal,
      regimenAduanero: req.body.regimenAduanero
    });
    console.log('✅ JSON del DTE construido');

    // Firmar el DTE
    console.log('📝 Firmando DTE...');
    let dteFirmadoStr;
    try {
      // Pasamos empresaConfig que ahora incluye las contraseñas cargadas desde la DB
      dteFirmadoStr = await dteSigner.signDte(dteJson, empresaConfig);
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

    // Intentar parsear si es string, pero si falla (es JWS raw), mantenerlo como string
    let dteFirmado = dteFirmadoStr;
    if (typeof dteFirmadoStr === 'string') {
      try {
        const parsed = JSON.parse(dteFirmadoStr);
        if (typeof parsed === 'object') dteFirmado = parsed;
      } catch (e) {
        // Es un string plano (JWS), está bien
      }
    }

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
          nit: empresaConfig.nit,
          ambiente: ambiente, // 'PRUEBAS' o 'PRODUCCIÓN'
          dteJson: dteJson // Pasar el JSON original para extraer metadatos
        };

        // Enviar a MH usando las credenciales de la empresa
        mhResponse = await dteApiService.enviarDte(dteFirmado, null, mhConfig);
        require('fs').appendFileSync('debug_mh.log', `[${new Date().toISOString()}] MH Response: ${JSON.stringify(mhResponse)}\n`);
      } catch (apiError) {
        console.error('⚠️ Error crítico al comunicar con MH:', apiError.message);
        require('fs').appendFileSync('debug_mh.log', `[${new Date().toISOString()}] MH Error: ${apiError.message}\n${apiError.stack}\n`);
        // Mantenemos el estado de error
      }
    } else {
      console.warn('⚠️ No se envía a MH porque no hay DTE firmado');
    }
    console.log('✅ Transmisión finalizada, estado:', mhResponse.estado);

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
      cliente?.nombre || 'Sujeto Excluido', (totales?.totalPagar || totales?.montoTotalOperacion || 0), ambiente, fechaEmision, fechaEmision,
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
    console.log('✅ DTE guardado en DB, ID:', dteId);

    // Generar PDF
    const dteData = {
      dte: {
        id: dteId,
        codigoGeneracion,
        numeroControl,
        tipoDte: tipoDteCodigo,
        fechaEmision,
        nombreReceptor: cliente?.nombre || 'Sujeto Excluido',
        nitReceptor: cliente?.nit || cliente?.numDocumento,
        nrcReceptor: cliente?.nrc,
        direccionReceptor: cliente?.direccion,
        emailReceptor: cliente?.correo,
        selloRecibido: mhResponse.selloRecibido || null
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

    // Obtener tipoDte de los query params para evitar colisiones de ID
    const tipoDteParam = req.query.tipoDte;
    let tablesToSearch = [];

    if (tipoDteParam) {
      const specificTable = getTableNameByTipoDte(tipoDteParam);
      if (specificTable) {
        tablesToSearch = [specificTable];
      }
    }

    if (tablesToSearch.length === 0) {
      tablesToSearch = [
        'documento_factura',
        'documento_credito_fiscal',
        'documento_nota_credito',
        'documento_nota_debito',
        'documento_factura_sujeto_excluido',
        'documento_factura_exportacion',
        'documento_nota_remision',
        'documento_comprobante_retencion'
      ];
    }

    let dteResult = null;
    let tableName = null;

    for (const table of tablesToSearch) {
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
// Iniciar servidor y verificar catálogos
// Iniciar servidor
const startServer = async () => {
  try {
    // initializeDatabase ya se encarga de crear la BD, tablas y catálogos si faltan
    await initializeDatabase();

    app.listen(port, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${port}`);
    });
  } catch (error) {
    console.error('❌ Error fatal iniciando el servidor:', error);
    process.exit(1);
  }
};

startServer();
