const AuthError = require('../services/AuthError');

function respondWithError(res, error, fallbackMessage) {
  if (error instanceof AuthError) return res.status(error.status).json({ error: error.message });
  console.error(fallbackMessage, error);
  return res.status(500).json({ error: fallbackMessage });
}

module.exports = (authService) => ({
  async register(req, res) {
    try {
      const session = await authService.register(req.body);
      res.status(201).json(session);
    } catch (error) {
      respondWithError(res, error, 'Error interno en el servidor al registrar');
    }
  },

  async login(req, res) {
    try {
      const session = await authService.login(req.body);
      res.json(session);
    } catch (error) {
      respondWithError(res, error, 'Error al iniciar sesión');
    }
  },

  me(req, res) {
    res.json({ user: req.user });
  }
});
