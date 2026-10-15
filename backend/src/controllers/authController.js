const { AuthError } = require('../services/AuthError');

module.exports = (authService) => ({
  async register(req, res) {
    try {
      const { name, email, password } = req.body;
      const session = await authService.register({ name, email, password });
      res.status(201).json(session);
    } catch (error) {
      if (error instanceof AuthError) return res.status(error.status).json({ error: error.message });
      res.status(500).json({ error: 'Error interno en el servidor al registrar' });
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;
      const session = await authService.login({ email, password });
      res.json(session);
    } catch (error) {
      if (error instanceof AuthError) return res.status(error.status).json({ error: error.message });
      res.status(500).json({ error: 'Error al iniciar sesión' });
    }
  },

  async resetPassword(req, res) {
    try {
      const { email, newPassword } = req.body;
      const session = await authService.resetPassword({ email, newPassword });
      res.json(session);
    } catch (error) {
      if (error instanceof AuthError) return res.status(error.status).json({ error: error.message });
      res.status(500).json({ error: 'Error al restablecer la contraseña' });
    }
  },

  me(req, res) {
    res.json({ user: req.user });
  }
});
