const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'wavepos_dte_v2',
    user: process.env.DB_USER || 'mrgomez',
    password: process.env.DB_PASSWORD || 'Karin2100',
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
        const result = await pool.query(
            'SELECT empresa_id, nombre, active FROM api_keys WHERE key = $1 AND active = 1',
            [apiKey]
        );

        if (result.rows.length === 0) {
            return res.status(403).json({
                error: 'API Key inválida o desactivada.'
            });
        }

        const { empresa_id, nombre } = result.rows[0];

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
