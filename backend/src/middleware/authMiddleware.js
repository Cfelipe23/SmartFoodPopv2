function createAuthMiddleware(tokenService) {
  function authenticateToken(req, res, next) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!token) return res.status(401).json({ error: 'Acceso denegado: Token no proporcionado' });
    try { req.user = tokenService.verify(token); return next(); }
    catch { return res.status(403).json({ error: 'Token inválido o expirado' }); }
  }
  function requireAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ error: 'Requiere permisos de administrador' });
    return next();
  }
  return { authenticateToken, requireAdmin };
}
module.exports = { createAuthMiddleware };
