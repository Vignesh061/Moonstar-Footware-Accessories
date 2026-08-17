/**
 * Admin Dashboard — KPI cards and overview data.
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getDashboard } from '../../services/adminApi';
import './Dashboard.css';

const STATUS_COLORS = {
  pending: '#e67e22',
  confirmed: '#3498db',
  packed: '#9b59b6',
  shipped: '#1abc9c',
  out_for_delivery: '#27ae60',
  delivered: '#2ecc71',
  cancelled: '#e74c3c',
};

function statusLabel(s) {
  return s?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || s;
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [recentProducts, setRecentProducts] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { loadDashboard(); }, []);

  const loadDashboard = async () => {
    try {
      const data = await getDashboard();
      setStats(data.stats);
      setLowStock(data.low_stock_products || []);
      setRecentProducts(data.recent_products || []);
      setRecentOrders(data.recent_orders || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="admin-page"><div className="admin-loading">Loading dashboard...</div></div>;
  if (error) return <div className="admin-page"><div className="admin-error">{error}</div></div>;

  const kpiCards = [
    { label: 'Active Products', value: stats?.active_products ?? 0, icon: '📦', color: '#3498db', link: '/admin/products' },
    { label: 'Categories', value: stats?.total_categories ?? 0, icon: '🏷️', color: '#2ecc71', link: '/admin/categories' },
    { label: 'Total Orders', value: stats?.total_orders ?? 0, icon: '🛒', color: '#9b59b6', link: '/admin/orders' },
    { label: 'Pending Orders', value: stats?.pending_orders ?? 0, icon: '⏳', color: '#e67e22', link: '/admin/orders?status=pending' },
    { label: 'Delivered', value: stats?.delivered_orders ?? 0, icon: '✅', color: '#27ae60', link: '/admin/orders?status=delivered' },
    { label: 'Revenue', value: `₹${(stats?.total_revenue ?? 0).toLocaleString('en-IN')}`, icon: '💰', color: '#C5983B', link: '/admin/orders' },
    { label: 'Low Stock', value: stats?.low_stock_count ?? 0, icon: '⚠️', color: '#e67e22', link: '/admin/products' },
    { label: 'Customers', value: stats?.total_customers ?? 0, icon: '👥', color: '#8e44ad', link: '#' },
  ];

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h1 className="admin-page__title">Dashboard</h1>
        <p className="admin-page__subtitle">Welcome back to MoonStar Admin Panel</p>
      </div>

      {/* KPI Grid */}
      <div className="kpi-grid">
        {kpiCards.map((card) => (
          <Link to={card.link} key={card.label} className="kpi-card" style={{ borderTopColor: card.color }}>
            <span className="kpi-card__icon">{card.icon}</span>
            <div className="kpi-card__data">
              <span className="kpi-card__value">{card.value}</span>
              <span className="kpi-card__label">{card.label}</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {/* Low Stock */}
        <div className="dashboard-card">
          <h3 className="dashboard-card__title">⚠️ Low Stock</h3>
          {lowStock.length === 0 ? (
            <p className="dashboard-card__empty">All products well-stocked!</p>
          ) : (
            <div className="dashboard-card__table">
              <table>
                <thead><tr><th>Product</th><th>Stock</th></tr></thead>
                <tbody>
                  {lowStock.map((p) => (
                    <tr key={p.id}>
                      <td className="dashboard-card__product-name">{p.name}</td>
                      <td><span className={`stock-badge ${p.stock === 0 ? 'stock-badge--out' : 'stock-badge--low'}`}>{p.stock}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Products */}
        <div className="dashboard-card">
          <div className="dashboard-card__header">
            <h3 className="dashboard-card__title">📦 Recent Products</h3>
            <Link to="/admin/products" className="dashboard-card__view-all">View All →</Link>
          </div>
          {recentProducts.length === 0 ? (
            <p className="dashboard-card__empty">No products yet. <Link to="/admin/products">Add one</Link></p>
          ) : (
            <div className="dashboard-card__list">
              {recentProducts.map((p) => (
                <div key={p.id} className="recent-product">
                  <div className="recent-product__img" style={{ backgroundImage: p.image ? `url(${p.image})` : 'none' }}>
                    {!p.image && '📷'}
                  </div>
                  <div className="recent-product__info">
                    <span className="recent-product__name">{p.name}</span>
                    <span className="recent-product__price">₹{p.price}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="dashboard-card">
          <div className="dashboard-card__header">
            <h3 className="dashboard-card__title">🛒 Recent Orders</h3>
            <Link to="/admin/orders" className="dashboard-card__view-all">View All →</Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="dashboard-card__empty">No orders yet.</p>
          ) : (
            <div className="dashboard-card__list">
              {recentOrders.map((o) => (
                <div key={o.id} className="recent-product">
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                    <span className="recent-product__name" style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      #{o.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#888' }}>{o.delivery_name}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                    <span className="recent-product__price">₹{Number(o.total_amount).toFixed(0)}</span>
                    <span style={{
                      fontSize: '0.65rem', fontWeight: 600,
                      color: STATUS_COLORS[o.status] || '#888',
                    }}>
                      {statusLabel(o.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
