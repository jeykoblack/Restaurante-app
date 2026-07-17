function authorize(...allowedRoles) {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'No autenticado',
        });
      }

      const userRole = req.user.role;

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          error: 'No tienes permiso para esta acción',
        });
      }

      next();
    } catch (error) {
      return res.status(500).json({
        error: 'Error al validar permisos',
      });
    }
  };
}

module.exports = authorize;