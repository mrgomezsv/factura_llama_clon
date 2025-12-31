const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DATABASE_HOST || '45.10.160.29',
    port: process.env.DATABASE_PORT || 5432,
    database: process.env.DATABASE_NAME || 'thetecwa1_fe_dba_prod',
    user: process.env.DATABASE_USER || 'thetecwa1_fe_dba_prod',
    password: process.env.DATABASE_PASSWORD || 'ml%BHX$C//Z$f6uL',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

/**
 * Middleware para validar API Key de sistemas externos
 * El POS debe enviar el header 'x-api-key'
 */
async function validateApiKey(req, res, next) {
    console.log('🔍 Headers recibidos:', req.headers);
    const rawApiKey = req.headers['x-api-key'];
    const apiKey = rawApiKey ? rawApiKey.trim() : null;
    console.log('🔑 API Key extraída:', apiKey);

    if (!apiKey) {
        return res.status(401).json({
            error: 'Acceso denegado. API Key no proporcionada en el header x-api-key.'
        });
    }

    try {
        const [rows] = await pool.query(
            'SELECT empresa_id, nombre, active FROM api_keys WHERE `key` = ? AND active = 1',
            [apiKey]
        );

        if (rows.length === 0) {
            return res.status(403).json({
                error: 'API Key inválida o desactivada.'
            });
        }

        const { empresa_id, nombre } = rows[0];

        // Simular el objeto req.user para compatibilidad con la lógica existente
        req.user = {
            empresaId: empresa_id,
            apiKeyName: nombre,
            isExternal: true
        };

        console.log(`🔑 Acceso autorizado via API Key: ${nombre} (Empresa: ${empresa_id})`);
        next();
    } catch (error) {
        console.error('❌ Error validando API Key:', error);
        res.status(500).json({ error: 'Error interno al validar la llave de acceso.' });
    }
}

module.exports = validateApiKey;
