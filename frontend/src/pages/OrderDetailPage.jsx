/**
 * OrderDetailPage — /orders/:id
 * Shows full order details with status tracking for the customer.
 */
import { useState, useEffect } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { getMyOrder } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './OrderDetailPage.css';

const STATUS_STEPS = [
  { key: 'pending', label: 'Order Placed' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'packed', label: 'Packed' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'out_for_delivery', label: 'Out for Delivery' },
  { key: 'delivered', label: 'Delivered' },
];

const STATUS_LABELS = {
  pending: { label: 'Pending', color: '#e67e22' },
  confirmed: { label: 'Confirmed', color: '#3498db' },
  packed: { label: 'Packed', color: '#9b59b6' },
  shipped: { label: 'Shipped', color: '#1abc9c' },
  out_for_delivery: { label: 'Out for Delivery', color: '#27ae60' },
  delivered: { label: 'Delivered', color: '#2ecc71' },
  cancelled: { label: 'Cancelled', color: '#e74c3c' },
};

export default function OrderDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isNewOrder = location.state?.newOrder;

  useEffect(() => {
    if (!isAuthenticated) return; // don't fire API — show login prompt below

    let cancelled = false;
    const load = async () => {
      try {
        const data = await getMyOrder(id);
        if (!cancelled) setOrder(data.order);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Order not found');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [id, isAuthenticated]);

  if (!isAuthenticated) return (
    <div className="od-page">
      <div className="container">
        <div className="od-error">
          <p>Please sign in to view this order.</p>
          <Link to="/login" state={{ from: `/orders/${id}` }} className="btn btn-primary">Sign In</Link>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="od-page">
        <div className="container">
          <div className="od-loading">Loading order details...</div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="od-page">
        <div className="container">
          <div className="od-error">
            <p>{error || 'Order not found'}</p>
            <Link to="/orders" className="btn btn-outline">Back to Orders</Link>
          </div>
        </div>
      </div>
    );
  }

  const statusInfo = STATUS_LABELS[order.status] || { label: order.status, color: '#888' };
  const isCancelled = order.status === 'cancelled';
  const currentStepIndex = isCancelled ? -1 : STATUS_STEPS.findIndex((s) => s.key === order.status);

  return (
    <div className="od-page">
      <div className="container">
        {/* Success banner for new orders */}
        {isNewOrder && (
          <div className="od-success-banner">
            <span>🎉</span>
            <div>
              <strong>Order placed successfully!</strong>
              <p>Thank you for your purchase. We'll deliver it soon.</p>
            </div>
          </div>
        )}

        {/* Breadcrumb */}
        <nav className="od-breadcrumb">
          <Link to="/orders">My Orders</Link>
          <span>›</span>
          <span>Order #{order.id.slice(0, 8).toUpperCase()}</span>
        </nav>

        <div className="od-header">
          <div>
            <h1 className="od-header__title">Order Details</h1>
            <p className="od-header__date">
              Placed on {new Date(order.created_at).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
              })}
            </p>
          </div>
          <span
            className="od-header__status"
            style={{ color: statusInfo.color, borderColor: statusInfo.color, background: `${statusInfo.color}12` }}
          >
            {statusInfo.label}
          </span>
        </div>

        {/* Status Tracker */}
        {!isCancelled && (
          <div className="od-tracker">
            {STATUS_STEPS.map((step, i) => {
              const isDone = i <= currentStepIndex;
              const isCurrent = i === currentStepIndex;
              return (
                <div key={step.key} className={`od-tracker__step ${isDone ? 'od-tracker__step--done' : ''} ${isCurrent ? 'od-tracker__step--current' : ''}`}>
                  <div className="od-tracker__dot">
                    {isDone && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>}
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <div className={`od-tracker__line ${i < currentStepIndex ? 'od-tracker__line--done' : ''}`} />
                  )}
                  <span className="od-tracker__label">{step.label}</span>
                </div>
              );
            })}
          </div>
        )}

        {isCancelled && (
          <div className="od-cancelled">Order has been cancelled.</div>
        )}

        <div className="od-layout">
          {/* Items */}
          <div className="od-items">
            <h2 className="od-section-title">Items Ordered</h2>
            {(order.items || []).map((item) => (
              <div key={item.id} className="od-item">
                <div className="od-item__img-wrap">
                  {item.product_image
                    ? <img src={item.product_image} alt={item.product_name} className="od-item__img" loading="lazy" />
                    : <div className="od-item__img-placeholder">📦</div>
                  }
                </div>
                <div className="od-item__info">
                  <span className="od-item__name">{item.product_name}</span>
                  {Object.entries(item.selected_attributes || {}).map(([k, v]) => (
                    <span key={k} className="od-item__attr">{k}: {v}</span>
                  ))}
                  <span className="od-item__qty">Qty: {item.quantity} × ₹{item.unit_price}</span>
                </div>
                <span className="od-item__subtotal">₹{item.subtotal.toFixed(2)}</span>
              </div>
            ))}

            {/* Totals */}
            <div className="od-totals">
              <div className="od-totals__row">
                <span>Subtotal</span>
                <span>₹{order.subtotal.toFixed(2)}</span>
              </div>
              <div className="od-totals__row">
                <span>Delivery</span>
                <span className={order.delivery_charge === 0 ? 'od-totals__free' : ''}>
                  {order.delivery_charge === 0 ? 'FREE' : `₹${order.delivery_charge.toFixed(2)}`}
                </span>
              </div>
              <div className="od-totals__row od-totals__row--total">
                <span>Total</span>
                <span>₹{order.total_amount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Delivery Info */}
          <div className="od-delivery">
            <h2 className="od-section-title">Delivery Address</h2>
            <div className="od-address">
              <strong>{order.delivery_name}</strong>
              <span>+91 {order.delivery_mobile}</span>
              <span>{order.delivery_address}</span>
              {order.delivery_address2 && <span>{order.delivery_address2}</span>}
              {order.delivery_landmark && <span>Near {order.delivery_landmark}</span>}
              <span>{order.delivery_city}, {order.delivery_state} — {order.delivery_pincode}</span>
            </div>
            {order.notes && (
              <div className="od-notes">
                <strong>Notes:</strong> {order.notes}
              </div>
            )}
            <div className="od-payment-method">
              <span>💵</span>
              <span>Cash on Delivery</span>
            </div>
          </div>
        </div>

        <div className="od-actions">
          <Link to="/orders" className="btn btn-outline">← Back to Orders</Link>
          <Link to="/" className="btn btn-primary">Continue Shopping</Link>
        </div>
      </div>
    </div>
  );
}
