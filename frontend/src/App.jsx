import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Loader2, Store } from 'lucide-react';
import Header from './components/layout/Header';
import HeroBanner from './components/layout/HeroBanner';
import ProductCard from './components/products/ProductCard';
import ProductDetailModal from './components/products/ProductDetailModal';
import AuthModal from './components/auth/AuthModal';
import AdminPanel from './components/admin/AdminPanel';
import Toast from './components/common/Toast';
import { useAuth } from './hooks/useAuth';
import { useProducts } from './hooks/useProducts';
import { useProductDetail } from './hooks/useProductDetail';
import { useFavorites } from './hooks/useFavorites';
import { reviewApi } from './api/reviewApi';
import { healthApi } from './api/healthApi';
import { filterProducts } from './utils/filterProducts';

const PAGE_SIZE = 24;

const EMPTY_MESSAGES = {
  catalog: { title: 'No se encontraron productos', text: 'Intenta cambiar los términos de búsqueda o selecciona otra categoría o tienda.' },
  offers: { title: 'No hay ofertas disponibles en este momento', text: 'Vuelve más tarde o revisa el catálogo completo.' },
  favorites: { title: 'Aún no tienes productos guardados', text: 'Toca el corazón de un producto para guardarlo y consultarlo después.' }
};

function StatusBox({ icon, title, text, children }) {
  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', padding: '3rem 1.5rem', borderRadius: '16px', textAlign: 'center', color: '#64748b' }}>
      {icon}
      <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', color: '#0f172a', margin: '0.5rem 0 0.3rem' }}>{title}</h3>
      {text && <p style={{ fontSize: '0.9rem' }}>{text}</p>}
      {children}
    </div>
  );
}

export default function App() {
  const { user, login, register, logout } = useAuth();
  const { products, stores, categories, loading, error, reload, addProduct, updateProduct, deleteProduct } = useProducts();

  const [selectedProduct, setSelectedProduct] = useState(null);
  const { detail, loading: detailLoading, error: detailError, reload: reloadDetail } = useProductDetail(selectedProduct?.id);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStore, setSelectedStore] = useState('all');
  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog' | 'offers' | 'favorites'

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [notice, setNotice] = useState(null);
  const [storage, setStorage] = useState('');
  const dismissNotice = useCallback(() => setNotice(null), []);

  // Aviso (solo en desarrollo) cuando el backend no está conectado a PostgreSQL.
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    healthApi.getHealth().then(res => setStorage(res.storage)).catch(() => setStorage(''));
  }, []);

  const { favorites, toggleFavorite } = useFavorites({ user, onAuthRequired: () => setIsAuthOpen(true) });

  const filteredProducts = useMemo(
    () => filterProducts({ products, categories, stores, favorites, searchTerm, selectedCategory, selectedStore, activeTab }),
    [products, categories, stores, favorites, searchTerm, selectedCategory, selectedStore, activeTab]
  );

  // Paginación incremental: se reinicia cuando cambian los filtros.
  const filterKey = [searchTerm, selectedCategory, selectedStore, activeTab].join('|');
  const [pageState, setPageState] = useState({ key: filterKey, count: PAGE_SIZE });
  const visibleCount = pageState.key === filterKey ? pageState.count : PAGE_SIZE;
  const visibleProducts = filteredProducts.slice(0, visibleCount);

  const handleToggleFavorite = async (productId) => {
    try {
      const message = await toggleFavorite(productId);
      if (message) setNotice({ type: 'success', text: message });
    } catch (err) {
      setNotice({ type: 'error', text: err.message });
    }
  };

  const handleAddReview = async (productId, rating, comment) => {
    const res = await reviewApi.addReview(productId, rating, comment);
    reloadDetail();
    return res.message;
  };

  const handleLogout = () => {
    logout();
    setIsAdminOpen(false);
    if (activeTab === 'favorites') setActiveTab('catalog');
  };

  const handleSelectSimilar = (productId) => {
    setSelectedProduct(products.find(p => p.id === productId) || null);
  };

  const emptyMessage = EMPTY_MESSAGES[activeTab];
  const needsLoginForFavorites = activeTab === 'favorites' && !user;

  const renderProducts = () => {
    if (loading) {
      return <StatusBox icon={<Loader2 size={40} color="#059669" className="spin" />} title="Cargando catálogo…" />;
    }
    if (error) {
      return (
        <StatusBox icon={<AlertCircle size={48} color="#dc2626" />} title="No se pudo cargar el catálogo" text={error}>
          <button className="nav-btn nav-btn-primary" style={{ margin: '1rem auto 0' }} onClick={reload}>Reintentar</button>
        </StatusBox>
      );
    }
    if (needsLoginForFavorites) {
      return (
        <StatusBox icon={<AlertCircle size={48} color="#94a3b8" />} title="Inicia sesión para ver tus productos guardados">
          <button className="nav-btn nav-btn-primary" style={{ margin: '1rem auto 0' }} onClick={() => setIsAuthOpen(true)}>Ingresar / Registro</button>
        </StatusBox>
      );
    }
    if (products.length === 0) {
      return <StatusBox icon={<AlertCircle size={48} color="#94a3b8" />} title="No hay productos disponibles" text="El catálogo está vacío en este momento. Intenta de nuevo más tarde." />;
    }
    if (filteredProducts.length === 0) {
      return <StatusBox icon={<AlertCircle size={48} color="#94a3b8" />} title={emptyMessage.title} text={emptyMessage.text} />;
    }
    return (
      <>
        <div className="products-grid">
          {visibleProducts.map(p => (
            <ProductCard
              key={p.id}
              product={p}
              stores={stores}
              onSelectProduct={setSelectedProduct}
              isFavorite={favorites.includes(p.id)}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </div>
        {visibleCount < filteredProducts.length && (
          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <button className="nav-btn nav-btn-primary" onClick={() => setPageState({ key: filterKey, count: visibleCount + PAGE_SIZE })}>
              Mostrar más productos ({filteredProducts.length - visibleCount} restantes)
            </button>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="app-root">
      {import.meta.env.DEV && storage === 'memory' && (
        <div role="alert" style={{ background: '#fef3c7', borderBottom: '1px solid #fcd34d', color: '#92400e', padding: '0.45rem 1rem', fontSize: '0.82rem', fontWeight: 600, textAlign: 'center' }}>
          ⚠️ Base de datos NO conectada: los datos (usuarios, reseñas, favoritos) se guardan solo en memoria y se pierden al reiniciar el backend. Configura DATABASE_URL en backend/.env.
        </div>
      )}
      <Header
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        onOpenAdmin={() => setIsAdminOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        favoritesCount={favorites.length}
        onOpenFavorites={() => setActiveTab('favorites')}
      />

      <div className={`hero-banner-wrapper ${searchTerm.trim() ? 'collapsed' : 'expanded'}`}>
        <HeroBanner productCount={products.length} />
      </div>

      <main className="main-container">
        {searchTerm.trim() && (
          <div className="search-active-banner">
            <div>
              <span className="search-active-badge">Búsqueda activa</span>
              <span className="search-active-query">"{searchTerm.trim()}"</span>
              <span className="search-active-count">({filteredProducts.length} resultado{filteredProducts.length === 1 ? '' : 's'})</span>
            </div>
            <button type="button" className="btn-clear-search-pill" onClick={() => setSearchTerm('')}>
              Restablecer catálogo completo
            </button>
          </div>
        )}

        <div className="filters-bar">
          <div className="category-scroll">
            <button className={`category-chip ${selectedCategory === 'all' ? 'active' : ''}`} onClick={() => setSelectedCategory('all')}>
              🏷️ Todos ({products.length})
            </button>
            {categories.map(c => (
              <button key={c.id} className={`category-chip ${selectedCategory === c.slug ? 'active' : ''}`} onClick={() => setSelectedCategory(c.slug)}>
                {c.icon} {c.name}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Store size={16} color="#64748b" />
            <select
              className="search-input"
              aria-label="Filtrar por tienda"
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', width: 'auto' }}
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
            >
              <option value="all">Todas las Tiendas</option>
              {stores.map(s => (
                <option key={s.id} value={s.code}>{s.logo} {s.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="section-header">
          <h2 className="section-title">
            {activeTab === 'offers' && <>🔥 Ofertas Disponibles en Popayán</>}
            {activeTab === 'favorites' && <>❤️ Tus Productos Guardados</>}
            {activeTab === 'catalog' && <>📦 Catálogo de Productos y Comparativa</>}
          </h2>

          {!loading && !error && !needsLoginForFavorites && (
            <div style={{ fontSize: '0.88rem', color: '#64748b', fontWeight: 600 }}>
              Mostrando {visibleProducts.length} de {filteredProducts.length} productos
            </div>
          )}
        </div>

        {renderProducts()}
      </main>

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          detail={detail}
          loading={detailLoading}
          error={detailError}
          stores={stores}
          user={user}
          onClose={() => setSelectedProduct(null)}
          onAddReview={handleAddReview}
          onSelectSimilar={handleSelectSimilar}
          isFavorite={favorites.includes(selectedProduct.id)}
          onToggleFavorite={handleToggleFavorite}
          onOpenAuth={() => {
            setSelectedProduct(null);
            setIsAuthOpen(true);
          }}
        />
      )}

      {isAuthOpen && (
        <AuthModal onClose={() => setIsAuthOpen(false)} onLogin={login} onRegister={register} />
      )}

      {isAdminOpen && user?.role === 'admin' && (
        <AdminPanel
          onClose={() => setIsAdminOpen(false)}
          products={products}
          categories={categories}
          stores={stores}
          onAddProduct={addProduct}
          onUpdateProduct={updateProduct}
          onDeleteProduct={deleteProduct}
        />
      )}

      <Toast notice={notice} onDismiss={dismissNotice} />
    </div>
  );
}
