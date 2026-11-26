import { useState } from 'react';
import { X, Star, Send, TrendingDown, Store, MessageSquare, Layers, ExternalLink, Heart } from 'lucide-react';
import { formatCop, discountPercent } from '../../utils/format';
import { buildComparison } from '../../utils/comparison';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80';
const MAX_COMMENT_LENGTH = 1000;
const sectionTitleStyle = { fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' };

function StarRow({ value, size = 14 }) {
  return (
    <div style={{ display: 'flex' }} aria-label={`${value} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} size={size} fill={s <= value ? '#f59e0b' : 'none'} color={s <= value ? '#f59e0b' : '#cbd5e1'} />
      ))}
    </div>
  );
}

// RF05 (detalle), RF06 (reseñas) y RF07 (comparación de precios entre tiendas)
export default function ProductDetailModal({
  product,
  detail,
  loading,
  error,
  stores = [],
  onClose,
  onAddReview,
  onSelectSimilar,
  user,
  onOpenAuth,
  isFavorite = false,
  onToggleFavorite
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewFeedback, setReviewFeedback] = useState(null); // { type, text }

  const shown = detail?.product || product;
  const reviews = detail?.reviews || [];
  const summary = detail?.review_summary || { count: 0, average: 0 };
  const similar = detail?.similar || [];
  const { id, name, description, unit, image_url, category_name } = shown;

  // El detalle trae los precios enriquecidos; el equivalente en la otra tienda viene del listado.
  const comparison = buildComparison({ ...shown, equivalent: product.equivalent }, stores);
  const rows = [...comparison.rows].sort((a, b) => (comparison.basis === 'unit' ? a.unit_price.value - b.unit_price.value : a.price - b.price));
  const isComparable = comparison.comparable;
  const storeNames = [...new Set(rows.map(row => stores.find(s => s.id === row.store_id)?.name).filter(Boolean))];
  const bestRow = comparison.best;
  const worstRow = rows[rows.length - 1];
  const maxSavings = isComparable && bestRow && worstRow && comparison.basis === 'price' ? worstRow.price - bestRow.price : 0;
  const savingsPct = maxSavings > 0 ? Math.round((maxSavings / worstRow.price) * 100) : 0;
  const unitSavingsPct = isComparable && comparison.basis === 'unit' && worstRow.unit_price.value > 0
    ? Math.round(((worstRow.unit_price.value - bestRow.unit_price.value) / worstRow.unit_price.value) * 100)
    : 0;

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setReviewFeedback(null);
    if (!comment.trim()) {
      setReviewFeedback({ type: 'error', text: 'Escribe un comentario para publicar tu reseña' });
      return;
    }
    setIsSubmitting(true);
    try {
      const message = await onAddReview(id, rating, comment.trim());
      setComment('');
      setRating(5);
      setReviewFeedback({ type: 'success', text: message || 'Reseña publicada con éxito' });
    } catch (err) {
      setReviewFeedback({ type: 'error', text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={`Detalle de ${name}`}>
        <button className="modal-close" onClick={onClose} aria-label="Cerrar">
          <X size={20} />
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div>
            <img
              src={image_url}
              alt={name}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = FALLBACK_IMAGE;
              }}
              style={{ width: '100%', height: '230px', objectFit: 'contain', background: '#f8fafc', borderRadius: '12px', padding: '0.5rem' }}
            />
          </div>

          <div>
            <div style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 700, textTransform: 'uppercase' }}>{unit}</div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 800, margin: '0.2rem 0 0.5rem' }}>{name}</h2>
            {onToggleFavorite && (
              <button
                type="button"
                className="nav-btn"
                onClick={() => (user ? onToggleFavorite(id) : onOpenAuth())}
                aria-pressed={isFavorite}
                title={user ? undefined : 'Inicia sesión para guardar productos'}
                style={{ marginBottom: '0.6rem', color: isFavorite ? '#ef4444' : undefined, borderColor: isFavorite ? '#fecaca' : undefined }}
              >
                <Heart size={16} fill={isFavorite ? '#ef4444' : 'none'} />
                <span>{isFavorite ? 'Guardado · quitar' : 'Guardar producto'}</span>
              </button>
            )}
            <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '0.75rem' }}>
              {description || 'Producto de la canasta familiar disponible en supermercados de Popayán.'}
            </p>

            <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '0.2rem 0.75rem', fontSize: '0.82rem', marginBottom: '0.9rem' }}>
              <dt style={{ color: '#64748b', fontWeight: 600 }}>Categoría</dt>
              <dd>{category_name || 'Sin categoría'}</dd>
              <dt style={{ color: '#64748b', fontWeight: 600 }}>Presentación</dt>
              <dd>{unit}</dd>
              <dt style={{ color: '#64748b', fontWeight: 600 }}>Disponible en</dt>
              <dd>{storeNames.join(', ') || '—'}</dd>
              <dt style={{ color: '#64748b', fontWeight: 600 }}>Calificación</dt>
              <dd style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                {summary.count > 0 ? (<><StarRow value={Math.round(summary.average)} /> {summary.average} ({summary.count})</>) : 'Sin reseñas todavía'}
              </dd>
            </dl>

            {isComparable && (maxSavings > 0 || unitSavingsPct > 0) && (
              <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '0.8rem 1rem', borderRadius: '12px', color: '#047857' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.95rem' }}>
                  <TrendingDown size={18} />
                  {comparison.basis === 'unit'
                    ? `Hasta ${unitSavingsPct}% más barato por ${comparison.measure}`
                    : `Ahorras ${formatCop(maxSavings)} (${savingsPct}%)`}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#065f46', marginTop: '2px' }}>Comprando en la opción más económica.</div>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div role="alert" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '0.6rem 0.8rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem' }}>
            No se pudo cargar toda la información del producto: {error}
          </div>
        )}

        <div style={{ marginBottom: '1.75rem' }}>
          <h3 style={sectionTitleStyle}>
            <Store size={18} color="#059669" /> {isComparable ? 'Comparativa por tienda' : 'Precio en tienda'}
          </h3>

          {!isComparable && rows.length === 1 && (
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.6rem' }}>
              No encontramos un producto equivalente en {comparison.missingStores.map(store => store.name).join(', ') || 'otra tienda'}.
            </p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {rows.length === 0 && <p style={{ fontSize: '0.88rem', color: '#94a3b8' }}>Sin precios registrados.</p>}
            {rows.map((row) => {
              const store = stores.find(s => s.id === row.store_id);
              const isBest = Boolean(bestRow) && bestRow.key === row.key;
              const discount = row.is_offer ? discountPercent(row.previous_price, row.price) : 0;
              const link = row.source_url;

              return (
                <div
                  key={row.key}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.8rem 1rem', borderRadius: '10px',
                    border: isBest ? '2px solid #059669' : '1px solid #e2e8f0', background: isBest ? '#f0fdf4' : '#ffffff'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{ fontSize: '1.4rem' }}>{store ? store.logo : '🏬'}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                        {store ? store.name : 'Tienda en Popayán'}
                        {isBest && (
                          <span style={{ marginLeft: '8px', background: '#059669', color: 'white', fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '10px', fontWeight: 700 }}>
                            MEJOR OPCIÓN
                          </span>
                        )}
                      </div>
                      {row.isEquivalent && (
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>≈ {row.name} · {row.unit}</div>
                      )}
                      {link && (
                        <a href={link} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', color: '#2563eb', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                          Ver en la tienda <ExternalLink size={11} />
                        </a>
                      )}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: isBest ? '#059669' : '#0f172a' }}>{formatCop(row.price)}</div>
                    {row.unit_price && (
                      <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{formatCop(row.unit_price.value)} por {row.unit_price.per}</div>
                    )}
                    {row.is_offer && (
                      <div style={{ fontSize: '0.75rem', color: '#ea580c', fontWeight: 600 }}>
                        {discount > 0 && <>-{discount}% · </>}oferta
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {similar.length > 0 && (
          <div style={{ marginBottom: '1.75rem' }}>
            <h3 style={sectionTitleStyle}><Layers size={18} color="#0ea5e9" /> Productos similares en otras tiendas</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {similar.map(item => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectSimilar(item.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', textAlign: 'left', background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.55rem 0.8rem', cursor: 'pointer' }}
                >
                  <img src={item.image_url} alt="" style={{ width: '42px', height: '42px', objectFit: 'contain', borderRadius: '6px', background: '#f8fafc' }} onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>{item.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{item.unit}</div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '0.78rem' }}>
                    {item.prices.map(pr => (
                      <div key={pr.store_id}>
                        <span style={{ color: '#64748b' }}>{pr.store_logo} {formatCop(pr.price)}</span>
                        {pr.unit_price && <span style={{ color: '#0f172a', fontWeight: 700 }}> · {formatCop(pr.unit_price.value)}/{pr.unit_price.per}</span>}
                      </div>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <h3 style={sectionTitleStyle}>
            <MessageSquare size={18} color="#6366f1" /> Reseñas y opiniones {loading && <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>cargando…</span>}
          </h3>

          {user ? (
            <form onSubmit={handleSubmitReview} noValidate style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '1rem', borderRadius: '12px', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Tu calificación:</span>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} type="button" onClick={() => setRating(star)} aria-label={`${star} estrellas`} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                    <Star size={20} fill={star <= rating ? '#f59e0b' : 'none'} color={star <= rating ? '#f59e0b' : '#94a3b8'} />
                  </button>
                ))}
              </div>

              <textarea
                className="search-input"
                style={{ borderRadius: '8px', minHeight: '70px', width: '100%', marginBottom: '0.5rem', resize: 'vertical' }}
                placeholder="Escribe tu opinión sobre el precio, la calidad o la disponibilidad en Popayán..."
                aria-label="Tu reseña"
                value={comment}
                maxLength={MAX_COMMENT_LENGTH}
                onChange={(e) => setComment(e.target.value)}
              />

              {reviewFeedback && (
                <div role={reviewFeedback.type === 'error' ? 'alert' : 'status'} style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.5rem', color: reviewFeedback.type === 'error' ? '#dc2626' : '#047857' }}>
                  {reviewFeedback.text}
                </div>
              )}

              <div style={{ display: 'flex' }}>
                <button type="submit" disabled={isSubmitting} className="nav-btn nav-btn-primary" style={{ marginLeft: 'auto', fontSize: '0.85rem' }}>
                  <Send size={14} /> {isSubmitting ? 'Publicando…' : 'Publicar reseña'}
                </button>
              </div>
            </form>
          ) : (
            <div style={{ background: '#f1f5f9', padding: '0.8rem 1rem', borderRadius: '10px', fontSize: '0.85rem', color: '#475569', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
              <span>Inicia sesión para publicar tu opinión sobre este producto.</span>
              <button className="nav-btn nav-btn-primary" style={{ padding: '0.3rem 0.7rem', fontSize: '0.8rem' }} onClick={onOpenAuth}>Ingresar</button>
            </div>
          )}

          {reviews.length === 0 ? (
            <p style={{ fontSize: '0.88rem', color: '#94a3b8', fontStyle: 'italic' }}>
              {loading ? 'Cargando reseñas…' : 'Sé el primero en dejar una reseña sobre este producto.'}
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {reviews.map((r) => (
                <div key={r.id} style={{ background: '#ffffff', border: '1px solid #e2e8f0', padding: '0.75rem 1rem', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{r.user_name || 'Comprador local'}</span>
                    <StarRow value={r.rating} />
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#334155', whiteSpace: 'pre-wrap' }}>{r.comment}</p>
                  {r.created_at && (
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '0.2rem' }}>{new Date(r.created_at).toLocaleDateString('es-CO')}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
