/**
 * Admin Orders Page — view all orders and update status.
 */
import { useState, useEffect } from 'react';
import { getAdminOrders, getAdminOrder, updateOrderStatus } from '../../services/adminApi';
import './Products.css'; // Reuse admin table styles

const ORDER_STATUSES = [
  'pending', 'confirmed', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'
];

const STATUS_COLORS = {
  pending: '#e67e22',
  confirmed: '#3498db',
  packed: '#9b59b6',
  shipped: '#1abc9c',
  out_for_delivery: '#27ae60',
  delivered: '#2ecc71',
  cancelled: '#e74c3c',
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  // Detail modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    loadOrders();
  }, [page, statusFilter, search]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const params = { page, per_page: 20 };
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      const data = await getAdminOrders(params);
      setOrders(data.orders || []);
      setMeta(data.meta || {});
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openOrder = async (orderId) => {
    setDetailLoading(true);
    try {
      const data = await getAdminOrder(orderId);
      setSelectedOrder(data.order);
      setNewStatus(data.order.status);
    } catch (err) {
      alert(err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedOrder || !newStatus) return;
    setUpdatingStatus(true);
    try {
      await updateOrderStatus(selectedOrder.id, newStatus);
      await loadOrders();
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const statusLabel = (s) => s?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || s;

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div>
          <h1 className="admin-page__title">Orders</h1>
          <p className="admin-page__subtitle">{meta.total || 0} total orders</p>
        </div>
      </div>

      {/* Filters */}
      <div className="admin-toolbar" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <input
          type="text"
          className="admin-search"
          placeholder="Search by customer name or mobile..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{ maxWidth: 300 }}
        />
        <select
          className="admin-search"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          style={{ maxWidth: 200 }}
        >
          <option value="">All Statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>{statusLabel(s)}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="admin-table-wrap">
        {loading ? (
          <div className="admin-loading">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="admin-empty"><p>No orders found.</p></div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>
                    <code style={{ fontSize: '0.78rem' }}>#{o.id.slice(0, 8).toUpperCase()}</code>
                  </td>
                  <td>
                    <div>
                      <div style={{ fontWeight: 500 }}>{o.delivery_name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#888' }}>{o.delivery_mobile}</div>
                    </div>
                  </td>
                  <td>{o.item_count} item{o.item_count !== 1 ? 's' : ''}</td>
                  <td><span className="admin-table__price">₹{Number(o.total_amount).toFixed(2)}</span></td>
                  <td>
                    <span
                      style={{
                        padding: '3px 10px',
                        borderRadius: '999px',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        color: STATUS_COLORS[o.status] || '#888',
                        background: `${STATUS_COLORS[o.status] || '#888'}15`,
                        border: `1.5px solid ${STATUS_COLORS[o.status] || '#888'}`,
                      }}
                    >
                      {statusLabel(o.status)}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: '#888' }}>
                    {new Date(o.created_at).toLocaleDateString('en-IN')}
                  </td>
                  <td>
                    <button className="action-btn" onClick={() => openOrder(o.id)} title="View Order">
                      👁️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {meta.pages > 1 && (
        <div className="admin-pagination">
          <button disabled={!meta.has_prev} onClick={() => setPage(page - 1)}>← Prev</button>
          <span>Page {meta.page} of {meta.pages}</span>
          <button disabled={!meta.has_next} onClick={() => setPage(page + 1)}>Next →</button>
        </div>
      )}

      {/* Order Detail Modal */}
      {(selectedOrder || detailLoading) && (
        <div className="admin-modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="admin-modal" style={{ maxWidth: 700 }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h2>
                {detailLoading ? 'Loading...' : `Order #${selectedOrder?.id.slice(0, 8).toUpperCase()}`}
              </h2>
              <button className="admin-modal__close" onClick={() => setSelectedOrder(null)}>✕</button>
            </div>

            {selectedOrder && !detailLoading && (
              <div className="admin-modal__body">
                {/* Customer Info */}
                <div className="form-row">
                  <div className="form-group">
                    <label>Customer</label>
                    <div style={{ fontSize: '0.9rem', color: '#333' }}>
                      {selectedOrder.delivery_name} — {selectedOrder.delivery_mobile}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Date</label>
                    <div style={{ fontSize: '0.9rem', color: '#333' }}>
                      {new Date(selectedOrder.created_at).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div className="form-group">
                  <label>Delivery Address</label>
                  <div style={{ fontSize: '0.85rem', color: '#333', lineHeight: 1.8, background: '#f8f8f8', padding: '10px 14px', borderRadius: 8 }}>
                    <strong style={{ display: 'block', fontSize: '0.9rem', marginBottom: 2 }}>{selectedOrder.delivery_name}</strong>
                    <span style={{ display: 'block', color: '#555', marginBottom: 4 }}>+91 {selectedOrder.delivery_mobile}</span>
                    <span style={{ display: 'block' }}>{selectedOrder.delivery_address}</span>
                    {selectedOrder.delivery_address2 && <span style={{ display: 'block' }}>{selectedOrder.delivery_address2}</span>}
                    {selectedOrder.delivery_landmark && <span style={{ display: 'block', color: '#888' }}>Near {selectedOrder.delivery_landmark}</span>}
                    <span style={{ display: 'block' }}>{selectedOrder.delivery_city}, {selectedOrder.delivery_state} — {selectedOrder.delivery_pincode}</span>
                  </div>
                </div>

                {/* Items */}
                <div className="form-group">
                  <label>Items</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(selectedOrder.items || []).map((item) => (
                      <div key={item.id} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px', background: '#f8f8f8', borderRadius: 6 }}>
                        {item.product_image && (
                          <img src={item.product_image} alt={item.product_name} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} />
                        )}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 500, fontSize: '0.85rem' }}>{item.product_name}</div>
                          {Object.entries(item.selected_attributes || {}).map(([k, v]) => (
                            <span key={k} style={{ fontSize: '0.7rem', color: '#888', marginRight: 8 }}>{k}: {v}</span>
                          ))}
                        </div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                          {item.quantity} × ₹{item.unit_price} = ₹{item.subtotal.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Totals */}
                <div style={{ background: '#f8f8f8', borderRadius: 8, padding: 14, fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span>Subtotal</span><span>₹{Number(selectedOrder.subtotal).toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span>Delivery</span>
                    <span>{Number(selectedOrder.delivery_charge) === 0 ? 'FREE' : `₹${Number(selectedOrder.delivery_charge).toFixed(2)}`}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '0.9rem', borderTop: '1px solid #ddd', paddingTop: 8 }}>
                    <span>Total</span><span>₹{Number(selectedOrder.total_amount).toFixed(2)}</span>
                  </div>
                </div>

                {/* Status Update */}
                <div className="form-group">
                  <label>Update Status</label>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <select
                      className="admin-search"
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      style={{ flex: 1 }}
                    >
                      {ORDER_STATUSES.map((s) => (
                        <option key={s} value={s}>{statusLabel(s)}</option>
                      ))}
                    </select>
                    <button
                      className="admin-btn admin-btn--primary"
                      onClick={handleStatusUpdate}
                      disabled={updatingStatus || newStatus === selectedOrder.status}
                    >
                      {updatingStatus ? 'Updating...' : 'Update'}
                    </button>
                  </div>
                </div>

                {selectedOrder.notes && (
                  <div className="form-group">
                    <label>Customer Notes</label>
                    <div style={{ fontSize: '0.85rem', color: '#555' }}>{selectedOrder.notes}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
