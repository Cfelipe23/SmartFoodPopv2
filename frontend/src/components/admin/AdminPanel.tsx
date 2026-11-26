import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { X, Trash2, Edit3, Shield, Check, AlertTriangle } from 'lucide-react';
import { formatCop } from '../../utils/format';
import { buildProductPayload } from '../../utils/productPayload';
import type { Category, CreateProductInput, Product, Store, UpdateProductInput } from '../../types/api';
import type { Feedback, ProductForm } from '../../types/presentation';

const LIST_LIMIT = 30;
const labelStyle = { display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.2rem' };
const fieldStyle = { borderRadius: '8px', paddingLeft: '0.8rem' };

type PriceField = NonNullable<ProductForm['prices'][Store['id']]>;
type ProductField = keyof Omit<ProductForm, 'prices'>;

const EMPTY_PRICE: PriceField = { price: '', is_offer: false, previous_price: '' };

interface AdminPanelProps {
  onClose: () => void;
  products?: readonly Product[];
  categories?: readonly Category[];
  stores?: readonly Store[];
  onAddProduct: (productData: CreateProductInput) => Promise<string>;
  onUpdateProduct: (id: Product['id'], productData: UpdateProductInput) => Promise<string>;
  onDeleteProduct: (id: Product['id']) => Promise<string>;
}

function emptyForm(categories: readonly Category[], stores: readonly Store[]): ProductForm {
  return {
    name: '',
    description: '',
    category_id: categories[0]?.id ?? 1,
    unit: '',
    image_url: '',
    prices: Object.fromEntries(stores.map(store => [store.id, { ...EMPTY_PRICE }]))
  };
}

function formFromProduct(product: Product, categories: readonly Category[], stores: readonly Store[]): ProductForm {
  const form = emptyForm(categories, stores);
  form.name = product.name || '';
  form.description = product.description || '';
  form.category_id = product.category_id || form.category_id;
  form.unit = product.unit || '';
  form.image_url = product.image_url || '';
  for (const price of product.prices || []) {
    if (price.store_id === null) continue;
    form.prices[price.store_id] = {
      price: String(price.price),
      is_offer: Boolean(price.is_offer),
      previous_price: price.is_offer ? String(price.previous_price) : ''
    };
  }
  return form;
}

// RF11 / HU11: agregar, editar y eliminar productos (con confirmación antes de eliminar).
export default function AdminPanel({ onClose, products = [], categories = [], stores = [], onAddProduct, onUpdateProduct, onDeleteProduct }: AdminPanelProps) {
  const [editingId, setEditingId] = useState<Product['id'] | null>(null);
  const [form, setForm] = useState(() => emptyForm(categories, stores));
  const [filter, setFilter] = useState('');
  const [confirmingProduct, setConfirmingProduct] = useState<Product | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [busy, setBusy] = useState(false);

  const visibleProducts = useMemo(() => {
    const term = filter.trim().toLowerCase();
    const matches = term ? products.filter(p => p.name.toLowerCase().includes(term)) : products;
    return { total: matches.length, items: matches.slice(0, LIST_LIMIT) };
  }, [products, filter]);

  const updateField = <K extends ProductField>(field: K, value: ProductForm[K]) => setForm(prev => ({ ...prev, [field]: value }));
  const updatePrice = (storeId: Store['id'], changes: Partial<PriceField>) => setForm(prev => ({
    ...prev,
    prices: { ...prev.prices, [storeId]: { ...(prev.prices[storeId] ?? EMPTY_PRICE), ...changes } }
  }));

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm(categories, stores));
  };

  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setForm(formFromProduct(product, categories, stores));
    setFeedback(null);
  };

  const runAction = async (action: () => Promise<string>) => {
    setBusy(true);
    try {
      const message = await action();
      setFeedback({ type: 'success', text: message });
      return true;
    } catch (err) {
      setFeedback({ type: 'error', text: err instanceof Error ? err.message : 'No se pudo completar la operación.' });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const { payload, error } = buildProductPayload(form, stores);
    if (payload === undefined) {
      setFeedback({ type: 'error', text: error });
      return;
    }
    const saved = await runAction(() => (editingId ? onUpdateProduct(editingId, payload) : onAddProduct(payload)));
    if (saved) resetForm();
  };

  const handleConfirmDelete = async () => {
    const product = confirmingProduct;
    if (!product) return;
    setConfirmingProduct(null);
    const deleted = await runAction(() => onDeleteProduct(product.id));
    if (deleted && editingId === product.id) resetForm();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '900px' }} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Panel de administración">
        <button className="modal-close" onClick={onClose} aria-label="Cerrar">
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Shield size={24} color="#6366f1" />
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 800 }}>
            Panel de Administración de Catálogo
          </h2>
        </div>

        {feedback && (
          <div role={feedback.type === 'error' ? 'alert' : 'status'} style={{
            marginBottom: '1rem', padding: '0.6rem 0.9rem', borderRadius: '8px', fontSize: '0.87rem', fontWeight: 600,
            background: feedback.type === 'error' ? '#fef2f2' : '#ecfdf5',
            border: `1px solid ${feedback.type === 'error' ? '#fecaca' : '#a7f3d0'}`,
            color: feedback.type === 'error' ? '#dc2626' : '#047857'
          }}>
            {feedback.text}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '1.25rem', borderRadius: '14px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.85rem', color: '#334155' }}>
              {editingId ? '✏️ Editar Producto' : '➕ Agregar Nuevo Producto'}
            </h3>

            <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label htmlFor="admin-name" style={labelStyle}>Nombre del Producto *</label>
                <input id="admin-name" type="text" className="search-input" style={fieldStyle} value={form.name} onChange={(e) => updateField('name', e.target.value)} maxLength={255} />
              </div>

              <div>
                <label htmlFor="admin-description" style={labelStyle}>Descripción</label>
                <textarea id="admin-description" className="search-input" style={{ ...fieldStyle, minHeight: '56px', resize: 'vertical' }} value={form.description} onChange={(e) => updateField('description', e.target.value)} maxLength={2000} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <label htmlFor="admin-category" style={labelStyle}>Categoría *</label>
                  <select id="admin-category" className="search-input" style={fieldStyle} value={form.category_id} onChange={(e) => updateField('category_id', e.target.value)}>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="admin-unit" style={labelStyle}>Presentación / Unidad</label>
                  <input id="admin-unit" type="text" className="search-input" style={fieldStyle} value={form.unit} onChange={(e) => updateField('unit', e.target.value)} placeholder="Ej: Bolsa 1 kg" />
                </div>
              </div>

              <fieldset style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.6rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <legend style={{ fontSize: '0.78rem', fontWeight: 700, color: '#334155', padding: '0 0.3rem' }}>Precio por tienda * (deja vacío si no se vende)</legend>
                {stores.map(store => {
                  const entry = form.prices[store.id] ?? EMPTY_PRICE;
                  return (
                    <div key={store.id}>
                      <label htmlFor={`admin-price-${store.id}`} style={labelStyle}>{store.logo} {store.name} ($ COP)</label>
                      <input id={`admin-price-${store.id}`} type="number" min="0" step="1" className="search-input" style={fieldStyle} value={entry.price} onChange={(e) => updatePrice(store.id, { price: e.target.value })} />
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', marginTop: '0.3rem', color: '#475569' }}>
                        <input type="checkbox" checked={entry.is_offer} onChange={(e) => updatePrice(store.id, { is_offer: e.target.checked })} />
                        En oferta
                      </label>
                      {entry.is_offer && (
                        <input type="number" min="0" step="1" className="search-input" style={{ ...fieldStyle, marginTop: '0.3rem' }} placeholder="Precio anterior ($ COP)" aria-label={`Precio anterior en ${store.name}`} value={entry.previous_price ?? ''} onChange={(e) => updatePrice(store.id, { previous_price: e.target.value })} />
                      )}
                    </div>
                  );
                })}
              </fieldset>

              <div>
                <label htmlFor="admin-image" style={labelStyle}>URL de Imagen</label>
                <input id="admin-image" type="url" className="search-input" style={fieldStyle} placeholder="https://..." value={form.image_url} onChange={(e) => updateField('image_url', e.target.value)} />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="submit" disabled={busy} className="nav-btn nav-btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  <Check size={16} /> {editingId ? 'Guardar Cambios' : 'Crear Producto'}
                </button>
                {editingId && (
                  <button type="button" onClick={resetForm} className="nav-btn" style={{ background: '#e2e8f0' }}>
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.6rem', color: '#334155' }}>
              📦 Productos en Catálogo ({products.length})
            </h3>
            <input type="search" className="search-input" style={{ ...fieldStyle, marginBottom: '0.6rem' }} placeholder="Buscar producto para editar o eliminar..." aria-label="Buscar producto" value={filter} onChange={(e) => setFilter(e.target.value)} />

            <div style={{ maxHeight: '420px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {visibleProducts.items.length === 0 && (
                <p style={{ fontSize: '0.85rem', color: '#64748b' }}>No hay productos que coincidan.</p>
              )}
              {visibleProducts.items.map(p => (
                <div key={p.id} style={{ background: editingId === p.id ? '#eef2ff' : 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.6rem 0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
                    <img src={p.image_url ?? undefined} alt="" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                      <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                        {p.unit} · {p.prices.map(price => formatCop(price.price)).join(' / ')}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.3rem', flexShrink: 0 }}>
                    <button className="nav-btn" style={{ padding: '0.3rem', color: '#6366f1' }} onClick={() => startEdit(p)} title="Editar" aria-label={`Editar ${p.name}`}>
                      <Edit3 size={16} />
                    </button>
                    <button className="nav-btn" style={{ padding: '0.3rem', color: '#ef4444' }} onClick={() => setConfirmingProduct(p)} title="Eliminar" aria-label={`Eliminar ${p.name}`}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              {visibleProducts.total > LIST_LIMIT && (
                <p style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  Mostrando {LIST_LIMIT} de {visibleProducts.total}. Usa el buscador para encontrar otros productos.
                </p>
              )}
            </div>
          </div>
        </div>

        {confirmingProduct && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(15, 23, 42, 0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={() => setConfirmingProduct(null)}>
            <div role="alertdialog" aria-modal="true" aria-label="Confirmar eliminación" onClick={(e) => e.stopPropagation()} style={{ background: 'white', borderRadius: '14px', padding: '1.4rem', maxWidth: '400px', width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.25)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#dc2626', fontWeight: 800, marginBottom: '0.5rem' }}>
                <AlertTriangle size={20} /> ¿Eliminar este producto?
              </div>
              <p style={{ fontSize: '0.9rem', color: '#334155', marginBottom: '0.3rem' }}><strong>{confirmingProduct.name}</strong></p>
              <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1rem' }}>Se eliminará del catálogo junto con sus reseñas y favoritos. Esta acción no se puede deshacer.</p>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                <button className="nav-btn" style={{ background: '#e2e8f0' }} onClick={() => setConfirmingProduct(null)}>Cancelar</button>
                <button className="nav-btn" style={{ background: '#dc2626', color: 'white' }} onClick={handleConfirmDelete}>Sí, eliminar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
