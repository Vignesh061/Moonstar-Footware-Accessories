/**
 * OrdersPage — /orders
 * Shows all orders for the logged-in customer.
 * If not authenticated, shows inline login prompt (no redirect).
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMyOrders } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './OrdersPage.css';

const STATUS_LABELS = {
  pending:          { label: 'Pending',          color: '#e67e22' },
  confirmed:        { label: 'Confirmed',         color: '#3498db' },
  packed:           { label: 'Packed',            color: '#9b59b6' },
  shipped:          { label: 'Shipped',           color: '#1abc9c' },
  out_for_delivery: { label: 'Out for Delivery',  color: '#27ae60' },
  delivered:        { label: 'Delivered',         color: '#2ecc71' },
  cancelled:        { label: 'Cancelled',         color: '#e74c3c' },
};

export default function OrdersPage() {
  const { isAuthenticated } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Only fetch when actually authenticated — prevents the 401
  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getMyOrders();
        if (!cancelled) setOrders(data.orders || []);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load orders');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  // ── Not logged in — show inline prompt ──
  if (!isAuthenticated) {
    return (
      <div className="orders-page">
        <div className="container">
          <h1 className="orders-page__title">My Orders</h1>
          <div className="orders-empty">
            <div className="orders-empty__icon">🔐</div>
            <h2>Sign in to view your orders</h2>
            <p>Verify your mobile number to see your order history.</p>
            <Link to="/login" state={{ from: '/orders' }} className="btn btn-primary">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <div className="container">
        <h1 className="orders-page__title">My Orders</h1>

        {error && <div className="orders-error">⚠️ {error}</div>}

        {loading ? (
          <div className="orders-loading">Loading your orders...</div>
        ) : orders.length === 0 ? (
          <div className="orders-empty">
            <div className="orders-empty__icon">📦</div>
            <h2>No orders yet</h2>
            <p>Your order history will appear here.</p>
            <Link to="/" className="btn btn-primary">Start Shopping</Link>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => {
              const status = STATUS_LABELS[order.status] || { label: order.status, color: '#888' };
              return (
                <Link to={`/orders/${order.id}`} key={order.id} className="order-card">
                  <div className="order-card__header">
                    <div>
                      <span className="order-card__id">
                        Order #{order.id.slice(0, 8).toUpperCase()}
                      </span>
                      <span className="order-card__date">
                        {new Date(order.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </span>
                    </div>
                    <span
                      className="order-card__status"
                      style={{
                        color: status.color,
                        borderColor: status.color,
                        background: `${status.color}12`,
                      }}
                    >
                      {status.label}
                    </span>
                  </div>

                  <div className="order-card__body">
                    <div className="order-card__meta">
                      <span>{order.item_count} item{order.item_count !== 1 ? 's' : ''}</span>
                      <span className="order-card__total">
                        ₹{Number(order.total_amount).toFixed(2)}
                      </span>
                    </div>
                    <div className="order-card__address">
                      {order.delivery_city}, {order.delivery_state} — {order.delivery_pincode}
                    </div>
                  </div>

                  <div className="order-card__footer">
                    <span className="order-card__view">View Details →</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
