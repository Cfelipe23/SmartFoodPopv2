import { useState } from 'react';
import { X, Lock, Mail, User, ArrowRight } from 'lucide-react';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;
const labelStyle = { display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' };
const iconStyle = { position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' };
const inputStyle = { borderRadius: '8px', paddingLeft: '2.4rem' };
const linkButtonStyle = { background: 'none', border: 'none', color: '#059669', fontWeight: 700, marginLeft: '0.3rem', cursor: 'pointer' };

// Credenciales de demostración: solo se muestran en desarrollo (npm run dev), nunca en el build de producción.
const DEMO_ACCOUNTS = {
  consumer: { email: 'usuario@popayan.com', password: 'user123' },
  admin: { email: 'admin@smartfood.com', password: 'admin123' }
};

// RF01 (registro) y RF02 (inicio de sesión)
export default function AuthModal({ onClose, onLogin, onRegister }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const isRegister = mode === 'register';

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const validate = () => {
    if (!email.trim() || !password || (isRegister && !name.trim())) return 'Todos los campos son obligatorios';
    if (!EMAIL_PATTERN.test(email.trim())) return 'Ingresa un correo electrónico válido';
    if (isRegister && password.length < MIN_PASSWORD_LENGTH) return `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`;
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    const validationError = validate();
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }
    setLoading(true);
    try {
      const message = isRegister
        ? await onRegister(name.trim(), email.trim(), password)
        : await onLogin(email.trim(), password);
      setSuccessMsg(message || (isRegister ? 'Registro exitoso' : 'Sesión iniciada'));
      setTimeout(onClose, 1100);
    } catch (err) {
      setErrorMsg(err.message || 'Ocurrió un error. Intenta nuevamente.');
      setLoading(false);
    }
  };

  const fillDemo = (type) => {
    setEmail(DEMO_ACCOUNTS[type].email);
    setPassword(DEMO_ACCOUNTS[type].password);
    setErrorMsg('');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={isRegister ? 'Crear cuenta' : 'Iniciar sesión'}>
        <button className="modal-close" onClick={onClose} aria-label="Cerrar">
          <X size={20} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '2rem' }}>🛒</div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 800 }}>
            {isRegister ? 'Crear Cuenta en SmartFoodPop' : 'Iniciar Sesión'}
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
            {isRegister ? 'Regístrate para guardar productos y publicar reseñas' : 'Ingresa tus credenciales para acceder'}
          </p>
        </div>

        {import.meta.env.DEV && !isRegister && (
          <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '0.75rem', borderRadius: '10px', marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#047857', marginBottom: '0.4rem' }}>
              ⚡ Accesos de prueba (solo desarrollo):
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" onClick={() => fillDemo('consumer')} className="nav-btn" style={{ flex: 1, padding: '0.35rem', fontSize: '0.75rem', background: '#ffffff', border: '1px solid #6ee7b7', borderRadius: '6px' }}>
                👤 Consumidor Demo
              </button>
              <button type="button" onClick={() => fillDemo('admin')} className="nav-btn" style={{ flex: 1, padding: '0.35rem', fontSize: '0.75rem', background: '#e0e7ff', border: '1px solid #a5b4fc', color: '#4338ca', borderRadius: '6px' }}>
                🛡️ Administrador
              </button>
            </div>
          </div>
        )}

        {errorMsg && (
          <div role="alert" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '0.6rem 0.8rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem' }}>
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div role="status" style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857', padding: '0.6rem 0.8rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem' }}>
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {isRegister && (
            <div>
              <label htmlFor="auth-name" style={labelStyle}>Nombre Completo</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={iconStyle} />
                <input id="auth-name" type="text" className="search-input" style={inputStyle} placeholder="Ej: Juan Pérez" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="auth-email" style={labelStyle}>Correo Electrónico</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={iconStyle} />
              <input id="auth-email" type="email" className="search-input" style={inputStyle} placeholder="correo@ejemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </div>
          </div>

          <div>
            <label htmlFor="auth-password" style={labelStyle}>Contraseña</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={iconStyle} />
              <input
                id="auth-password"
                type="password"
                className="search-input"
                style={inputStyle}
                placeholder={isRegister ? `Mínimo ${MIN_PASSWORD_LENGTH} caracteres` : '••••••••'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
              />
            </div>
          </div>

          <button type="submit" className="nav-btn nav-btn-primary" disabled={loading} style={{ width: '100%', padding: '0.75rem', justifyContent: 'center', marginTop: '0.5rem' }}>
            <span>{isRegister ? 'Registrarme' : 'Entrar a SmartFoodPop'}</span>
            <ArrowRight size={16} />
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: '#64748b' }}>
          {isRegister ? '¿Ya tienes una cuenta?' : '¿Aún no tienes cuenta?'}
          <button type="button" style={linkButtonStyle} onClick={() => switchMode(isRegister ? 'login' : 'register')}>
            {isRegister ? 'Inicia Sesión' : 'Regístrate'}
          </button>
        </div>
      </div>
    </div>
  );
}
