import { useEffect, useRef, useState } from 'react';
import { Search, Heart, User, Shield, Tag, ChevronDown, LogOut } from 'lucide-react';

// HU10: menú de perfil con acceso a los productos guardados.
function ProfileMenu({ user, favoritesCount, onOpenFavorites, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const itemStyle = { display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.55rem 0.8rem', background: 'none', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', textAlign: 'left' };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button className="nav-btn" onClick={() => setOpen(o => !o)} aria-haspopup="menu" aria-expanded={open} style={{ fontSize: '0.85rem', fontWeight: 600 }}>
        <User size={16} />
        <span>{user.name.split(' ')[0]}</span>
        <ChevronDown size={14} />
      </button>
      {open && (
        <div role="menu" aria-label="Mi perfil" style={{ position: 'absolute', right: 0, top: 'calc(100% + 0.4rem)', minWidth: '220px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 12px 30px rgba(15,23,42,0.15)', padding: '0.4rem', zIndex: 60 }}>
          <div style={{ padding: '0.5rem 0.8rem 0.6rem', borderBottom: '1px solid #f1f5f9', marginBottom: '0.3rem' }}>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f172a' }}>{user.name}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>
          </div>
          <button role="menuitem" style={{ ...itemStyle, color: '#0f172a' }} onClick={() => { setOpen(false); onOpenFavorites(); }}>
            <Heart size={15} color="#ef4444" /> Mis productos guardados ({favoritesCount})
          </button>
          <button role="menuitem" style={{ ...itemStyle, color: '#ef4444' }} onClick={() => { setOpen(false); onLogout(); }}>
            <LogOut size={15} /> Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}

export default function Header({
  searchTerm,
  setSearchTerm,
  user,
  onOpenAuth,
  onLogout,
  onOpenAdmin,
  activeTab,
  setActiveTab,
  favoritesCount,
  onOpenFavorites
}) {
  return (
    <header className="app-header">
      <div className="header-container">

        <div className="brand-logo" onClick={() => setActiveTab('catalog')}>
          <span style={{ fontSize: '1.6rem' }}>🛒</span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>SmartFood</span>
              <span className="brand-badge">Popayán</span>
            </div>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 500, marginTop: '-3px' }}>
              Comparador de Supermercados
            </div>
          </div>
        </div>

        <div className="header-search">
          <Search className="search-icon" size={18} />
          <input
            type="text"
            className="search-input"
            placeholder="Buscar por producto (ej: Arroz, Leche, Aceite)..."
            aria-label="Buscar productos por nombre"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button type="button" onClick={() => setSearchTerm('')} className="search-clear-btn" title="Limpiar búsqueda" aria-label="Limpiar búsqueda">
              ×
            </button>
          )}
        </div>

        <div className="header-actions">
          <button className={`nav-btn ${activeTab === 'offers' ? 'nav-btn-primary' : ''}`} onClick={() => setActiveTab('offers')}>
            <Tag size={16} />
            <span>Ofertas</span>
          </button>

          <button className={`nav-btn ${activeTab === 'favorites' ? 'nav-btn-primary' : ''}`} onClick={() => setActiveTab('favorites')}>
            <Heart size={16} fill={activeTab === 'favorites' ? 'currentColor' : 'none'} />
            <span>Guardados</span>
            {favoritesCount > 0 && (
              <span style={{ background: '#ef4444', color: 'white', fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '10px' }}>
                {favoritesCount}
              </span>
            )}
          </button>

          {user && user.role === 'admin' && (
            <button className="nav-btn nav-btn-admin" onClick={onOpenAdmin}>
              <Shield size={16} />
              <span>Admin Panel</span>
            </button>
          )}

          {user ? (
            <ProfileMenu user={user} favoritesCount={favoritesCount} onOpenFavorites={onOpenFavorites} onLogout={onLogout} />
          ) : (
            <button className="nav-btn nav-btn-primary" onClick={onOpenAuth}>
              <User size={16} />
              <span>Ingresar / Registro</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
