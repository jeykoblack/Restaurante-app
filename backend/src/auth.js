const jwt = require('jsonwebtoken');

const JWT_SECRET = 'restaurante_secreto_123';

function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: 'Token no enviado',
      });
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        error: 'Formato de token inválido',
      });
    }

    const token = parts[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Token inválido o expirado',
    });
  }
}

module.exports = authMiddleware;