const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'secret_para_desarrollo_123';

/**
 * Middleware para verificar JWT y obtener el usuario (y su empresa)
 */
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    // Formato esperado: "Bearer <token>"
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            console.error('❌ Error verificar token:', err.message);
            return res.status(403).json({ error: 'Token inválido o expirado.' });
        }

        // Adjuntar usuario al request. 
        // Se espera que el payload del token tenga { id, email, empresaId, ... }
        req.user = user;
        next();
    });
}

module.exports = authenticateToken;
