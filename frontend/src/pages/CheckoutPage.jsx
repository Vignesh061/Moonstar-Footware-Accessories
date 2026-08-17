/**
 * CheckoutPage — /checkout
 *
 * Multi-step flow:
 *   STEP 1 — DELIVERY   : customer fills address form (pre-filled for returning users)
 *   STEP 2 — OTP        : OTP sent to the mobile number, customer verifies
 *   STEP 3 — REVIEW     : authenticated, shows order summary + delivery preview
 *   STEP 4 — CONFIRMED  : order placed successfully, shows confirmation
 *
 * No login required to reach checkout.
 * Authentication happens inline via OTP at step 2.
 * Order is only created after OTP is verified (step 3 → 4).
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { loginCustomer, registerCustomer, saveProfile, getMyProfile, placeOrder } from '../services/api';
import './CheckoutPage.css';

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa',
  'Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala',
  'Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland',
  'Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura',
  'Uttar Pradesh','Uttarakhand','West Bengal',
  'Delhi','Jammu and Kashmir','Ladakh','Puducherry','Chandigarh',
];

const EMPTY_DELIVERY = {
  name: '', mobile: '',
  address_line1: '', address_line2: '', landmark: '',
  city: '', state: '', pincode: '',
};

const STEPS = ['Delivery', 'Sign In', 'Review', 'Confirmed'];

// ── Helpers ──────────────────────────────────────────────────────────────────
function validateDelivery(d) {
  if (!d.name.trim()) return 'Full name is required';
  const mob = d.mobile.replace(/\D/g, '');
  if (mob.length !== 10) return 'Enter a valid 10-digit mobile number';
  if (!d.address_line1.trim()) return 'Address Line 1 is required';
  if (!d.city.trim()) return 'City is required';
  if (!d.state) return 'Please select a state';
  if (!/^\d{6}$/.test(d.pincode.trim())) return 'Enter a valid 6-digit pincode';
  return null;
}

// ── Sub-components ────────────────────────────────────────────────────────────
function StepIndicator({ current }) {
  return (
    <div className="co-steps">
      {STEPS.map((label, i) => (
        <div key={label} className={`co-step ${i === current ? 'co-step--active' : ''} ${i < current ? 'co-step--done' : ''}`}>
          <div className="co-step__dot">
            {i < current
              ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              : <span>{i + 1}</span>}
          </div>
          <span className="co-step__label">{label}</span>
          {i < STEPS.length - 1 && <div className="co-step__line" />}
        </div>
      ))}
    </div>
  );
}

function OrderSummaryPanel({ items, totalAmount }) {
  const deliveryCharge = totalAmount >= 499 ? 0 : 50;
  const orderTotal = totalAmount + deliveryCharge;
  return (
    <div className="checkout-summary">
      <h2 className="checkout-summary__title">Order Summary</h2>
      <div className="checkout-summary__items">
        {items.map((item) => (
          <div key={item.cartKey} className="checkout-item">
            <div className="checkout-item__img-wrap">
              {item.image
                ? <img src={item.image} alt={item.name} className="checkout-item__img" />
                : <div className="checkout-item__img-placeholder">📦</div>}
              <span className="checkout-item__qty">{item.quantity}</span>
            </div>
            <div className="checkout-item__info">
              <span className="checkout-item__name">{item.name}</span>
              {Object.entries(item.selectedAttributes || {}).map(([k, v]) => (
                <span key={k} className="checkout-item__attr">{k}: {v}</span>
              ))}
            </div>
            <span className="checkout-item__price">₹{(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>
      <div className="checkout-summary__rows">
        <div className="checkout-summary__row"><span>Subtotal</span><span>₹{totalAmount.toFixed(2)}</span></div>
        <div className="checkout-summary__row">
          <span>Delivery</span>
          <span className={deliveryCharge === 0 ? 'checkout-summary__free' : ''}>
            {deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}
          </span>
        </div>
        {deliveryCharge > 0 && (
          <div className="checkout-summary__note">Add ₹{(499 - totalAmount).toFixed(0)} more for free delivery</div>
        )}
        <div className="checkout-summary__row checkout-summary__row--total">
          <span>Total</span>
          <span>₹{orderTotal.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, totalAmount, clearCart } = useCart();
  const { isAuthenticated, user, login } = useAuth();

  const [step, setStep] = useState(0);
  const [delivery, setDelivery] = useState({ ...EMPTY_DELIVERY });
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Auth step state
  const [authTab, setAuthTab] = useState('login');   // 'login' | 'register'
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authConfirm, setAuthConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);

  // Confirmed order
  const [placedOrder, setPlacedOrder] = useState(null);

  const deliveryCharge = totalAmount >= 499 ? 0 : 50;
  const orderTotal = totalAmount + deliveryCharge;

  // ── Redirect if cart is empty ──
  useEffect(() => {
    if (items.length === 0 && step !== 3) navigate('/cart', { replace: true });
  }, [items, step, navigate]);

  // ── If already authenticated, pre-fill from saved profile ──
  useEffect(() => {
    if (isAuthenticated && step === 0) {
      const load = async () => {
        try {
          const data = await getMyProfile();
          const profile = data.profile;
          const customer = data.customer;
          if (profile || customer) {
            setDelivery((prev) => ({
              ...prev,
              name: profile?.name || customer?.name || prev.name,
              mobile: customer?.mobile || prev.mobile,
              address_line1: profile?.address_line1 || prev.address_line1,
              address_line2: profile?.address_line2 || prev.address_line2,
              landmark: profile?.landmark || prev.landmark,
              city: profile?.city || prev.city,
              state: profile?.state || prev.state,
              pincode: profile?.pincode || prev.pincode,
            }));
          }
        } catch {
          // ignore — non-critical
        }
      };
      load();
    }
  }, [isAuthenticated, step]);

  const setField = (field, value) => setDelivery((prev) => ({ ...prev, [field]: value }));

  // ── STEP 1 → 2 (or skip to 2 if already logged in) ──────────────────────
  const handleDeliveryContinue = async (e) => {
    e.preventDefault();
    setError('');
    const err = validateDelivery(delivery);
    if (err) return setError(err);
    setStep(isAuthenticated ? 2 : 1);
  };

  // ── STEP 2 → 3: Sign In ───────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!authEmail.trim() || !authPassword)
      return setError('Email and password are required');

    setLoading(true);
    try {
      const res = await loginCustomer(authEmail.trim(), authPassword);
      login(res.access_token, res.customer, res.profile || null);
      if (res.profile) {
        setDelivery((prev) => ({
          ...prev,
          name: prev.name || res.profile.name || '',
          address_line1: prev.address_line1 || res.profile.address_line1 || '',
          address_line2: prev.address_line2 || res.profile.address_line2 || '',
          landmark: prev.landmark || res.profile.landmark || '',
          city: prev.city || res.profile.city || '',
          state: prev.state || res.profile.state || '',
          pincode: prev.pincode || res.profile.pincode || '',
        }));
      }
      setStep(2);
    } catch (err) {
      setError(err.message || 'Incorrect email or password');
    } finally {
      setLoading(false);
    }
  };

  // ── STEP 2 → 3: Register ──────────────────────────────────────────────────
  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (!authName.trim()) return setError('Name is required');
    if (!authEmail.trim()) return setError('Email is required');
    if (authPassword.length < 6) return setError('Password must be at least 6 characters');
    if (authPassword !== authConfirm) return setError('Passwords do not match');

    setLoading(true);
    try {
      const res = await registerCustomer({
        name: authName.trim(),
        email: authEmail.trim(),
        password: authPassword,
        mobile: delivery.mobile.replace(/\D/g, '') || undefined,
      });
      login(res.access_token, res.customer, res.profile || null);
      setStep(2);
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // ── STEP 3 → 4: Place order ───────────────────────────────────────────────
  const handlePlaceOrder = async () => {
    setError('');
    setLoading(true);
    try {
      // Save delivery profile in background (non-blocking for the user)
      saveProfile({
        name: delivery.name,
        address_line1: delivery.address_line1,
        address_line2: delivery.address_line2,
        landmark: delivery.landmark,
        city: delivery.city,
        state: delivery.state,
        pincode: delivery.pincode,
      }).catch(() => {});

      const payload = {
        delivery: {
          name: delivery.name.trim(),
          mobile: delivery.mobile.replace(/\D/g, ''),
          address_line1: delivery.address_line1.trim(),
          address_line2: delivery.address_line2.trim(),
          landmark: delivery.landmark.trim(),
          city: delivery.city.trim(),
          state: delivery.state,
          pincode: delivery.pincode.trim(),
        },
        items: items.map((item) => ({
          product_id: item.productId,
          quantity: item.quantity,
          selected_attributes: item.selectedAttributes || {},
        })),
        notes: notes.trim(),
      };

      const data = await placeOrder(payload);
      setPlacedOrder(data.order);
      clearCart();
      setStep(3);
    } catch (err) {
      setError(err.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── RENDER ────────────────────────────────────────────────────────────────

  // STEP 4: Confirmation screen
  if (step === 3 && placedOrder) {
    return (
      <div className="checkout-page">
        <div className="container">
          <div className="co-confirm">
            <div className="co-confirm__icon">🎉</div>
            <h1 className="co-confirm__title">Order Placed!</h1>
            <p className="co-confirm__subtitle">
              Thank you, <strong>{delivery.name}</strong>. Your order is confirmed.
            </p>

            <div className="co-confirm__id">
              Order ID: <strong>#{placedOrder.id.slice(0, 8).toUpperCase()}</strong>
            </div>

            {/* Items */}
            <div className="co-confirm__section">
              <h3>Items Ordered</h3>
              {(placedOrder.items || []).map((item) => (
                <div key={item.id} className="co-confirm__item">
                  {item.product_image && (
                    <img src={item.product_image} alt={item.product_name} className="co-confirm__item-img" />
                  )}
                  <div className="co-confirm__item-info">
                    <span className="co-confirm__item-name">{item.product_name}</span>
                    {Object.entries(item.selected_attributes || {}).map(([k, v]) => (
                      <span key={k} className="co-confirm__item-attr">{k}: {v}</span>
                    ))}
                    <span className="co-confirm__item-qty">Qty: {item.quantity}</span>
                  </div>
                  <span className="co-confirm__item-price">₹{item.subtotal.toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="co-confirm__totals">
              <div className="co-confirm__total-row"><span>Subtotal</span><span>₹{placedOrder.subtotal.toFixed(2)}</span></div>
              <div className="co-confirm__total-row"><span>Delivery</span><span>{placedOrder.delivery_charge === 0 ? 'FREE' : `₹${placedOrder.delivery_charge.toFixed(2)}`}</span></div>
              <div className="co-confirm__total-row co-confirm__total-row--bold"><span>Total Paid</span><span>₹{placedOrder.total_amount.toFixed(2)}</span></div>
            </div>

            {/* Delivery address */}
            <div className="co-confirm__section">
              <h3>Delivery Address</h3>
              <div className="co-confirm__address">
                <strong>{placedOrder.delivery_name}</strong>
                <span>+91 {placedOrder.delivery_mobile}</span>
                <span>{placedOrder.delivery_address}</span>
                {placedOrder.delivery_address2 && <span>{placedOrder.delivery_address2}</span>}
                {placedOrder.delivery_landmark && <span>Near {placedOrder.delivery_landmark}</span>}
                <span>{placedOrder.delivery_city}, {placedOrder.delivery_state} — {placedOrder.delivery_pincode}</span>
              </div>
            </div>

            {/* Status */}
            <div className="co-confirm__status">
              <span className="co-confirm__status-badge">⏳ {placedOrder.status.charAt(0).toUpperCase() + placedOrder.status.slice(1)}</span>
              <span>Cash on Delivery</span>
            </div>

            <div className="co-confirm__actions">
              <Link to={`/orders/${placedOrder.id}`} className="btn btn-primary btn-lg">Track Order</Link>
              <Link to="/" className="btn btn-outline">Continue Shopping</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="container">
        <nav className="checkout-breadcrumb">
          <Link to="/cart">Cart</Link>
          <span>›</span>
          <span>Checkout</span>
        </nav>

        <StepIndicator current={step} />

        <div className="checkout-layout">
          {/* ── LEFT PANEL ── */}
          <div className="checkout-left">

            {/* ── STEP 1: Delivery Details ── */}
            {step === 0 && (
              <form onSubmit={handleDeliveryContinue}>
                <div className="checkout-section">
                  <h2 className="checkout-section__title">
                    {isAuthenticated && user?.name
                      ? <>Welcome back, <strong>{user.name}</strong> 👋</>
                      : 'Delivery Details'}
                  </h2>

                  {error && <div className="checkout-error">{error}</div>}

                  <div className="checkout-fields">
                    {/* Full Name */}
                    <div className="form-group checkout-fields__full">
                      <label>Full Name *</label>
                      <input type="text" value={delivery.name}
                        onChange={(e) => setField('name', e.target.value)}
                        placeholder="e.g. Vignesh Kumar" autoComplete="name" />
                    </div>

                    {/* Mobile */}
                    <div className="form-group checkout-fields__full">
                      <label>Mobile Number *</label>
                      <div className="co-phone-wrap">
                        <span className="co-phone-code">+91</span>
                        <input type="tel" inputMode="numeric" maxLength={10}
                          value={delivery.mobile}
                          onChange={(e) => setField('mobile', e.target.value.replace(/\D/g, '').slice(0, 10))}
                          placeholder="10-digit mobile" autoComplete="tel" />
                      </div>
                    </div>

                    {/* Address Line 1 */}
                    <div className="form-group checkout-fields__full">
                      <label>Address Line 1 *</label>
                      <input type="text" value={delivery.address_line1}
                        onChange={(e) => setField('address_line1', e.target.value)}
                        placeholder="House no., Street, Locality" autoComplete="address-line1" />
                    </div>

                    {/* Address Line 2 */}
                    <div className="form-group checkout-fields__full">
                      <label>Address Line 2 <span className="co-optional">(optional)</span></label>
                      <input type="text" value={delivery.address_line2}
                        onChange={(e) => setField('address_line2', e.target.value)}
                        placeholder="Apartment, Floor, Building" autoComplete="address-line2" />
                    </div>

                    {/* Landmark */}
                    <div className="form-group checkout-fields__full">
                      <label>Landmark <span className="co-optional">(optional)</span></label>
                      <input type="text" value={delivery.landmark}
                        onChange={(e) => setField('landmark', e.target.value)}
                        placeholder="Near a school, temple, etc." />
                    </div>

                    {/* City */}
                    <div className="form-group">
                      <label>City *</label>
                      <input type="text" value={delivery.city}
                        onChange={(e) => setField('city', e.target.value)}
                        placeholder="City" autoComplete="address-level2" />
                    </div>

                    {/* Pincode */}
                    <div className="form-group">
                      <label>Pincode *</label>
                      <input type="text" inputMode="numeric" maxLength={6}
                        value={delivery.pincode}
                        onChange={(e) => setField('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                        placeholder="6-digit pincode" autoComplete="postal-code" />
                    </div>

                    {/* State */}
                    <div className="form-group checkout-fields__full">
                      <label>State *</label>
                      <select value={delivery.state}
                        onChange={(e) => setField('state', e.target.value)}
                        autoComplete="address-level1">
                        <option value="">— Select State —</option>
                        {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>

                    {/* Notes */}
                    <div className="form-group checkout-fields__full">
                      <label>Order Notes <span className="co-optional">(optional)</span></label>
                      <textarea rows={2} value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Any special instructions for delivery" />
                    </div>
                  </div>
                </div>

                <div className="checkout-payment-note">
                  <span className="checkout-payment-note__icon">💵</span>
                  <div>
                    <strong>Cash on Delivery</strong>
                    <p>Pay when your order arrives at your doorstep.</p>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary btn-lg checkout-submit" disabled={loading}>
                  {loading ? 'Please wait…' : isAuthenticated ? 'Review Order →' : 'Continue — Sign In →'}
                </button>
              </form>
            )}

            {/* ── STEP 2: Sign In / Register ── */}
            {step === 1 && (
              <div className="checkout-section">
                <h2 className="checkout-section__title">Sign In to Continue</h2>

                {/* Tab switcher */}
                <div className="co-auth-tabs">
                  <button
                    type="button"
                    className={`co-auth-tab ${authTab === 'login' ? 'co-auth-tab--active' : ''}`}
                    onClick={() => { setAuthTab('login'); setError(''); }}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    className={`co-auth-tab ${authTab === 'register' ? 'co-auth-tab--active' : ''}`}
                    onClick={() => { setAuthTab('register'); setError(''); }}
                  >
                    New Account
                  </button>
                </div>

                {error && <div className="checkout-error" style={{ marginTop: 14 }}>{error}</div>}

                {/* Sign In */}
                {authTab === 'login' && (
                  <form onSubmit={handleLogin} className="co-auth-form" noValidate>
                    <div className="co-auth-field">
                      <label>Email Address</label>
                      <input
                        type="email" autoComplete="email"
                        placeholder="you@example.com"
                        value={authEmail}
                        onChange={(e) => { setAuthEmail(e.target.value); setError(''); }}
                        autoFocus
                      />
                    </div>
                    <div className="co-auth-field">
                      <label>Password</label>
                      <div className="co-auth-pass">
                        <input
                          type={showPass ? 'text' : 'password'}
                          autoComplete="current-password"
                          placeholder="Your password"
                          value={authPassword}
                          onChange={(e) => { setAuthPassword(e.target.value); setError(''); }}
                        />
                        <button type="button" className="co-auth-eye" onClick={() => setShowPass(!showPass)}>
                          {showPass ? '🙈' : '👁️'}
                        </button>
                      </div>
                    </div>
                    <button type="submit" className="btn btn-primary btn-lg checkout-submit" disabled={loading}>
                      {loading ? 'Signing in…' : 'Sign In & Continue →'}
                    </button>
                    <p className="co-auth-switch">
                      Don't have an account?{' '}
                      <button type="button" onClick={() => { setAuthTab('register'); setError(''); }}>
                        Register here
                      </button>
                    </p>
                  </form>
                )}

                {/* Register */}
                {authTab === 'register' && (
                  <form onSubmit={handleRegister} className="co-auth-form" noValidate>
                    <div className="co-auth-field">
                      <label>Full Name *</label>
                      <input
                        type="text" autoComplete="name"
                        placeholder="e.g. Vignesh Kumar"
                        value={authName}
                        onChange={(e) => { setAuthName(e.target.value); setError(''); }}
                        autoFocus
                      />
                    </div>
                    <div className="co-auth-field">
                      <label>Email Address *</label>
                      <input
                        type="email" autoComplete="email"
                        placeholder="you@example.com"
                        value={authEmail}
                        onChange={(e) => { setAuthEmail(e.target.value); setError(''); }}
                      />
                    </div>
                    <div className="co-auth-field">
                      <label>Password * <span style={{ fontWeight: 400, fontSize: '0.7rem', color: '#888' }}>(min 6 chars)</span></label>
                      <div className="co-auth-pass">
                        <input
                          type={showPass ? 'text' : 'password'}
                          autoComplete="new-password"
                          placeholder="Create a password"
                          value={authPassword}
                          onChange={(e) => { setAuthPassword(e.target.value); setError(''); }}
                        />
                        <button type="button" className="co-auth-eye" onClick={() => setShowPass(!showPass)}>
                          {showPass ? '🙈' : '👁️'}
                        </button>
                      </div>
                    </div>
                    <div className="co-auth-field">
                      <label>Confirm Password *</label>
                      <input
                        type={showPass ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="Repeat password"
                        value={authConfirm}
                        onChange={(e) => { setAuthConfirm(e.target.value); setError(''); }}
                      />
                    </div>
                    <button type="submit" className="btn btn-primary btn-lg checkout-submit" disabled={loading}>
                      {loading ? 'Creating account…' : 'Create Account & Continue →'}
                    </button>
                    <p className="co-auth-switch">
                      Already have an account?{' '}
                      <button type="button" onClick={() => { setAuthTab('login'); setError(''); }}>
                        Sign in here
                      </button>
                    </p>
                  </form>
                )}
              </div>
            )}

            {/* ── STEP 3: Review & Place Order ── */}
            {step === 2 && (
              <div>
                <div className="checkout-section">
                  <h2 className="checkout-section__title">Review Your Order</h2>

                  {error && <div className="checkout-error">{error}</div>}

                  {/* Delivery preview */}
                  <div className="co-review-address">
                    <div className="co-review-address__header">
                      <span className="co-review-address__title">Delivery Address</span>
                      <button className="co-review-edit" onClick={() => { setStep(0); setError(''); }}>
                        Edit
                      </button>
                    </div>
                    <div className="co-review-address__body">
                      <strong>{delivery.name}</strong>
                      <span>+91 {delivery.mobile}</span>
                      <span>{delivery.address_line1}</span>
                      {delivery.address_line2 && <span>{delivery.address_line2}</span>}
                      {delivery.landmark && <span>Near {delivery.landmark}</span>}
                      <span>{delivery.city}, {delivery.state} — {delivery.pincode}</span>
                    </div>
                  </div>

                  {/* Items preview */}
                  <div className="co-review-items">
                    <div className="co-review-items__title">
                      {items.length} item{items.length !== 1 ? 's' : ''} in your cart
                    </div>
                    {items.map((item) => (
                      <div key={item.cartKey} className="co-review-item">
                        <div className="co-review-item__img">
                          {item.image
                            ? <img src={item.image} alt={item.name} />
                            : <span>📦</span>}
                        </div>
                        <div className="co-review-item__info">
                          <span className="co-review-item__name">{item.name}</span>
                          {Object.entries(item.selectedAttributes || {}).map(([k, v]) => (
                            <span key={k} className="co-review-item__attr">{k}: {v}</span>
                          ))}
                          <span className="co-review-item__qty">Qty: {item.quantity}</span>
                        </div>
                        <span className="co-review-item__price">₹{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div className="co-review-total">
                    <div className="co-review-total__row"><span>Subtotal</span><span>₹{totalAmount.toFixed(2)}</span></div>
                    <div className="co-review-total__row">
                      <span>Delivery</span>
                      <span className={deliveryCharge === 0 ? 'co-free' : ''}>
                        {deliveryCharge === 0 ? 'FREE' : `₹${deliveryCharge}`}
                      </span>
                    </div>
                    <div className="co-review-total__row co-review-total__row--total">
                      <span>Total</span>
                      <span>₹{orderTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="checkout-payment-note" style={{ marginTop: 16 }}>
                    <span className="checkout-payment-note__icon">💵</span>
                    <div>
                      <strong>Cash on Delivery</strong>
                      <p>Pay ₹{orderTotal.toFixed(2)} when your order arrives.</p>
                    </div>
                  </div>
                </div>

                <button
                  className="btn btn-primary btn-lg checkout-submit"
                  onClick={handlePlaceOrder}
                  disabled={loading}
                >
                  {loading ? 'Placing Order…' : `Confirm & Place Order — ₹${orderTotal.toFixed(2)}`}
                </button>
              </div>
            )}
          </div>

          {/* ── RIGHT PANEL: Order Summary (hidden on step 3 — it's already inline) ── */}
          {step !== 2 && (
            <OrderSummaryPanel items={items} totalAmount={totalAmount} />
          )}
        </div>
      </div>
    </div>
  );
}
