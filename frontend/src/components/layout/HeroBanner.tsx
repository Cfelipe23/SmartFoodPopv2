import { MapPin, TrendingDown } from 'lucide-react';

export default function HeroBanner({ productCount = 0 }: { productCount?: number }) {
  return (
    <div className="hero-section">
      <div className="hero-container">

        <div className="hero-content">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.15)', padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 600, marginBottom: '1rem' }}>
            <MapPin size={14} color="#a7f3d0" /> Cobertura Popayán: Tiendas D1 & Olímpica
          </div>

          <h1>Compara Precios y Ahorra en tus Compras</h1>
          <p>
            Centralizamos en un solo lugar los productos y precios de las tiendas de Popayán. Consulta ofertas, compara precios por tienda y lee las reseñas de otros consumidores.
          </p>

          <div className="hero-stats">
            <div className="stat-card">
              <div className="stat-num">{productCount.toLocaleString('es-CO')}</div>
              <div className="stat-label">Productos comparables</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">2</div>
              <div className="stat-label">Tiendas comparadas</div>
            </div>
          </div>
        </div>

        <div className="hero-badge-container">
          <div style={{ color: '#d1fae5', fontSize: '0.85rem', fontWeight: 600 }}>Supermercados consultados:</div>
          <div className="store-pill-group">
            <div className="store-pill" style={{ borderLeft: '4px solid #dc2626' }}>
              <span>🏬</span> Tiendas D1
            </div>
            <div className="store-pill" style={{ borderLeft: '4px solid #2563eb' }}>
              <span>🛒</span> Olímpica
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.8rem 1.2rem', borderRadius: '12px', fontSize: '0.85rem', color: '#e6f4ea', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
            <TrendingDown size={18} color="#a7f3d0" />
            <span>Precios obtenidos de los sitios web de las tiendas</span>
          </div>
        </div>

      </div>
    </div>
  );
}
