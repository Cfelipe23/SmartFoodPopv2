import React, { useState } from 'react';
import { X, Lock, Mail, User, Shield, ArrowRight } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onLogin, onRegister, onResetPassword }) {
  // mode: 'login' | 'register' | 'forgot'
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);
    try {
      let message;
      if (mode === 'register') {
        message = await onRegister(name, email, password);
        setSuccessMsg(message || '¡Cuenta creada exitosamente! Bienvenido a SmartFoodPop.');
        setTimeout(onClose, 1200);
      } else if (mode === 'login') {
        message = await onLogin(email, password);
        setSuccessMsg(message || '¡Sesión iniciada con éxito! Redirigiendo...');
        setTimeout(onClose, 1000);
      } else if (mode === 'forgot') {
        if (newPassword !== confirmPassword) {
          throw new Error('Las contraseñas no coinciden');
        }
        if (onResetPassword) {
          message = await onResetPassword(email, newPassword);
          setSuccessMsg(message || 'Contraseña actualizada. Ya puedes iniciar sesión con tu nueva clave.');
          setTimeout(() => {
            setMode('login');
            setPassword(newPassword);
            setSuccessMsg('');
          }, 1500);
        }
      }
    } catch (err) {
      setErrorMsg(err.message || 'Ocurrió un error. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = (type) => {
    if (type === 'consumer') {
      setEmail('usuario@popayan.com');
      setPassword('user123');
      setMode('login');
    } else if (type === 'admin') {
      setEmail('admin@smartfood.com');
      setPassword('admin123');
      setMode('login');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={20} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '2rem' }}>🛒</div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 800 }}>
            {mode === 'register' && 'Crear Cuenta en SmartFoodPop'}
            {mode === 'login' && 'Iniciar Sesión'}
            {mode === 'forgot' && 'Recuperar Contraseña'}
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>
            {mode === 'register' && 'Regístrate para guardar productos y publicar reseñas'}
            {mode === 'login' && 'Ingresa tus credenciales para acceder'}
            {mode === 'forgot' && 'Ingresa tu correo y define una nueva contraseña'}
          </p>
        </div>

        {/* Demo Quick Access (solo en login) */}
        {mode === 'login' && (
          <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '0.75rem', borderRadius: '10px', marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#047857', marginBottom: '0.4rem' }}>
              ⚡ Accesos de Prueba Rápidos:
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                type="button" 
                onClick={() => handleDemoFill('consumer')} 
                className="nav-btn" 
                style={{ flex: 1, padding: '0.35rem', fontSize: '0.75rem', background: '#ffffff', border: '1px solid #6ee7b7', borderRadius: '6px' }}
              >
                👤 Consumidor Demo
              </button>
              <button 
                type="button" 
                onClick={() => handleDemoFill('admin')} 
                className="nav-btn" 
                style={{ flex: 1, padding: '0.35rem', fontSize: '0.75rem', background: '#e0e7ff', border: '1px solid #a5b4fc', color: '#4338ca', borderRadius: '6px' }}
              >
                🛡️ Administrador
              </button>
            </div>
          </div>
        )}

        {errorMsg && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '0.6rem 0.8rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem' }}>
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#047857', padding: '0.6rem 0.8rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem' }}>
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {mode === 'register' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Nombre Completo</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input 
                  type="text" 
                  className="search-input" 
                  style={{ borderRadius: '8px', paddingLeft: '2.4rem' }} 
                  placeholder="Ej: Juan Pérez"
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                />
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Correo Electrónico</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input 
                type="email" 
                className="search-input" 
                style={{ borderRadius: '8px', paddingLeft: '2.4rem' }} 
                placeholder="correo@ejemplo.com"
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>
          </div>

          {(mode === 'login' || mode === 'register') && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Contraseña</label>
                {mode === 'login' && (
                  <button 
                    type="button" 
                    onClick={() => { setMode('forgot'); setErrorMsg(''); setSuccessMsg(''); }}
                    style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                )}
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input 
                  type="password" 
                  className="search-input" 
                  style={{ borderRadius: '8px', paddingLeft: '2.4rem' }} 
                  placeholder="••••••••"
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                />
              </div>
            </div>
          )}

          {mode === 'forgot' && (
            <>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Nueva Contraseña</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input 
                    type="password" 
                    className="search-input" 
                    style={{ borderRadius: '8px', paddingLeft: '2.4rem' }} 
                    placeholder="Mínimo 4 caracteres"
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    required 
                  />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.3rem' }}>Confirmar Nueva Contraseña</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input 
                    type="password" 
                    className="search-input" 
                    style={{ borderRadius: '8px', paddingLeft: '2.4rem' }} 
                    placeholder="Repite la contraseña"
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    required 
                  />
                </div>
              </div>
            </>
          )}

          <button 
            type="submit" 
            className="nav-btn nav-btn-primary" 
            disabled={loading}
            style={{ width: '100%', padding: '0.75rem', justifyContent: 'center', marginTop: '0.5rem' }}
          >
            <span>
              {mode === 'register' && 'Registrarme'}
              {mode === 'login' && 'Entrar a SmartFoodPop'}
              {mode === 'forgot' && 'Restablecer e Iniciar'}
            </span>
            <ArrowRight size={16} />
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem', color: '#64748b' }}>
          {mode === 'register' && (
            <>
              ¿Ya tienes una cuenta?
              <button 
                type="button"
                style={{ background: 'none', border: 'none', color: '#059669', fontWeight: 700, marginLeft: '0.3rem', cursor: 'pointer' }}
                onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
              >
                Inicia Sesión
              </button>
            </>
          )}
          {mode === 'login' && (
            <>
              ¿Aún no tienes cuenta?
              <button 
                type="button"
                style={{ background: 'none', border: 'none', color: '#059669', fontWeight: 700, marginLeft: '0.3rem', cursor: 'pointer' }}
                onClick={() => { setMode('register'); setErrorMsg(''); setSuccessMsg(''); }}
              >
                Regístrate
              </button>
            </>
          )}
          {mode === 'forgot' && (
            <button 
              type="button"
              style={{ background: 'none', border: 'none', color: '#059669', fontWeight: 700, cursor: 'pointer' }}
              onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
            >
              ← Volver al Inicio de Sesión
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
