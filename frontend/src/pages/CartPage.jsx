/**
 * CartPage — /cart
 * Shows all cart items with quantity controls and checkout CTA.
 */
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './CartPage.css';

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalAmount, totalItems } = useCart();
  const navigate = useNavigate();

  const deliveryCharge = totalAmount >= 499 ? 0 : 50;
  const orderTotal = totalAmount + deliveryCharge;

  if (items.length === 0) {
    return (
      <div className="cart-page">
        <div className="container">
          <h1 className="cart-page__title">My Cart</h1>
          <div className="cart-empty">
            <div className="cart-empty__icon" aria-hidden="true">🛒</div>
            <h2>Your cart is empty</h2>
            <p>Add some products to get started.</p>
            <Link to="/" className="btn btn-primary btn-lg">Start Shopping</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="container">
        <h1 className="cart-page__title">
          My Cart <span className="cart-page__count">({totalItems} {totalItems === 1 ? 'item' : 'items'})</span>
        </h1>

        <div className="cart-layout">
          {/* ── Cart Items ── */}
          <div className="cart-items">
            {items.map((item) => (
              <div key={item.cartKey} className="cart-item">
                <div className="cart-item__image-wrap">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="cart-item__image" loading="lazy" />
                  ) : (
                    <div className="cart-item__image-placeholder">📦</div>
                  )}
                </div>

                <div className="cart-item__details">
                  <Link to={`/products/${item.slug || item.productId}`} className="cart-item__name">
                    {item.name}
                  </Link>

                  {/* Selected attributes */}
                  {Object.entries(item.selectedAttributes || {}).length > 0 && (
                    <div className="cart-item__attrs">
                      {Object.entries(item.selectedAttributes).map(([k, v]) => (
                        <span key={k} className="cart-item__attr">{k}: {v}</span>
                      ))}
                    </div>
                  )}

                  <div className="cart-item__pricing">
                    <span className="cart-item__price">₹{item.price}</span>
                    {item.originalPrice > item.price && (
                      <span className="cart-item__original">₹{item.originalPrice}</span>
                    )}
                  </div>
                </div>

                <div className="cart-item__controls">
                  {/* Quantity */}
                  <div className="cart-item__qty">
                    <button
                      className="cart-item__qty-btn"
                      onClick={() => updateQuantity(item.cartKey, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="cart-item__qty-value">{item.quantity}</span>
                    <button
                      className="cart-item__qty-btn"
                      onClick={() => updateQuantity(item.cartKey, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>

                  {/* Subtotal */}
                  <span className="cart-item__subtotal">₹{(item.price * item.quantity).toFixed(2)}</span>

                  {/* Remove */}
                  <button
                    className="cart-item__remove"
                    onClick={() => removeItem(item.cartKey)}
                    aria-label="Remove item"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* ── Order Summary ── */}
          <div className="cart-summary">
            <h2 className="cart-summary__title">Order Summary</h2>

            <div className="cart-summary__row">
              <span>Subtotal ({totalItems} items)</span>
              <span>₹{totalAmount.toFixed(2)}</span>
            </div>
            <div className="cart-summary__row">
              <span>Delivery Charge</span>
              <span className={deliveryCharge === 0 ? 'cart-summary__free' : ''}>
                {deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}
              </span>
            </div>
            {deliveryCharge === 0 && (
              <div className="cart-summary__note">✓ You qualify for free delivery!</div>
            )}
            {deliveryCharge > 0 && (
              <div className="cart-summary__note">
                Add ₹{(499 - totalAmount).toFixed(0)} more for free delivery
              </div>
            )}

            <div className="cart-summary__divider" />

            <div className="cart-summary__row cart-summary__row--total">
              <span>Total</span>
              <span>₹{orderTotal.toFixed(2)}</span>
            </div>

            <button
              className="btn btn-primary btn-lg cart-summary__checkout"
              onClick={() => navigate('/checkout')}
            >
              Proceed to Checkout
            </button>

            <Link to="/" className="cart-summary__continue">← Continue Shopping</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
