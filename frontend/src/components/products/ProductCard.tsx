import { Heart, Eye, TrendingDown, Scale } from 'lucide-react';
import { formatCop, discountPercent } from '../../utils/format';
import { buildComparison } from '../../utils/comparison';
import type { Product, ProductPrice, Store } from '../../types/api';
import type { DisplayProduct } from '../../types/presentation';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80';

interface ProductCardProps {
  product: DisplayProduct;
  stores?: readonly Store[];
  onSelectProduct: (product: DisplayProduct) => void;
  isFavorite: boolean;
  onToggleFavorite: (productId: Product['id']) => void;
}

export default function ProductCard({ product, stores = [], onSelectProduct, isFavorite, onToggleFavorite }: ProductCardProps) {
  const { id, name, unit, image_url, prices = [] } = product;
  const comparison = buildComparison(product, stores);
  const storeOf = (storeId: ProductPrice['store_id']) => stores.find(s => s.id === storeId);
  const hasOffer = prices.some(p => p.is_offer) || comparison.rows.some(row => row.is_offer);
  const bestStore = comparison.best ? storeOf(comparison.best.store_id) : null;
  const measureLabel = comparison.measure ? `por ${comparison.measure}` : '';

  return (
    <div className="product-card">
      <div
        className="card-img-container clickable-img"
        onClick={() => onSelectProduct(product)}
        title={`Ver detalle de ${name}`}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelectProduct(product);
          }
        }}
      >
        <img
          src={image_url ?? undefined}
          alt={name}
          className="card-img"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = FALLBACK_IMAGE;
          }}
        />

        {hasOffer && <div className="offer-badge">🔥 En Oferta</div>}

        <div className="img-hover-overlay">
          <Eye size={20} color="#ffffff" />
          <span>Ver detalles</span>
        </div>

        <button
          className={`favorite-btn ${isFavorite ? 'active' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(id);
          }}
          title={isFavorite ? 'Quitar de guardados' : 'Guardar producto'}
          aria-label={isFavorite ? 'Quitar de guardados' : 'Guardar producto'}
          aria-pressed={isFavorite}
        >
          <Heart size={18} fill={isFavorite ? '#ef4444' : 'none'} />
        </button>
      </div>

      <div className="card-body">
        <div className="card-unit">{unit}</div>
        <h3 className="card-title">{name}</h3>

        <div className="price-comparison-box">
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            {comparison.comparable && <Scale size={13} />}
            {comparison.comparable ? 'Comparativa por tienda:' : 'Precio en tienda:'}
          </div>

          {comparison.rows.length === 0 && (
            <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Sin precio disponible</div>
          )}

          {comparison.rows.map((row) => {
            const store = storeOf(row.store_id);
            const isBest = comparison.best && comparison.best.key === row.key;
            const discount = row.is_offer ? discountPercent(row.previous_price, row.price) : 0;

            return (
              <div key={row.key} style={{ marginBottom: '0.15rem' }}>
                <div className="price-row">
                  <span className="store-name-tag">
                    <span>{store ? store.logo : '🏬'}</span>
                    <span>{store ? store.name : 'Tienda'}</span>
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    {row.is_offer && (
                      <span style={{ fontSize: '0.7rem', color: '#ea580c', background: '#ffedd5', padding: '0.1rem 0.3rem', borderRadius: '4px', fontWeight: 700 }}>
                        {discount > 0 ? `-${discount}%` : 'OFERTA'}
                      </span>
                    )}
                    {row.is_offer && row.previous_price != null && row.previous_price > row.price && (
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', textDecoration: 'line-through' }}>{formatCop(row.previous_price)}</span>
                    )}
                    <span className={`price-val ${isBest ? 'lowest' : ''}`}>{formatCop(row.price)}</span>
                  </div>
                </div>

                {(row.isEquivalent || (comparison.differentSizes && row.unit_price)) && (
                  <div style={{ fontSize: '0.72rem', color: '#64748b', paddingLeft: '1.4rem', lineHeight: 1.3 }}>
                    {row.isEquivalent && <div>≈ {row.name} · {row.unit}</div>}
                    {comparison.differentSizes && row.unit_price && (
                      <div style={{ color: isBest ? '#059669' : '#64748b', fontWeight: isBest ? 700 : 500 }}>
                        {formatCop(row.unit_price.value)} {measureLabel}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {comparison.missingStores.length > 0 && (
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.25rem' }}>
              Sin producto equivalente en {comparison.missingStores.map(store => store.name).join(', ')}
            </div>
          )}
        </div>

        {comparison.best && bestStore && (
          <div style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '1rem' }}>
            <TrendingDown size={14} />
            {comparison.differentSizes ? `Más económico ${measureLabel}: ${bestStore.name}` : `Mejor precio en ${bestStore.name}`}
          </div>
        )}

        <div className="card-footer-btns">
          <button className="btn-detail" onClick={() => onSelectProduct(product)}>
            <Eye size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
            {comparison.comparable ? 'Ver comparación y reseñas' : 'Ver detalle y reseñas'}
          </button>
        </div>
      </div>
    </div>
  );
}
