/**
 * LoginPage — /login
 * Email + password authentication with Sign In / Register tabs.
 */
import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { loginCustomer, registerCustomer } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const redirectTo = location.state?.from || '/';
  const isExpired = new URLSearchParams(location.search).get('expired') === '1';

  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Shared fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  // Register-only fields
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const switchTab = (t) => {
    setTab(t);
    setError('');
    setSuccess('');
    setPassword('');
    setConfirmPassword('');
    setShowPass(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) return setError('Email and password are required');

    setLoading(true);
    try {
      const data = await loginCustomer(email.trim(), password);
      login(data.access_token, data.customer, data.profile || null);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message || 'Incorrect email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) return setError('Name is required');
    if (!email.trim()) return setError('Email is required');
    if (password.length < 6) return setError('Password must be at least 6 characters');
    if (password !== confirmPassword) return setError('Passwords do not match');
    if (mobile && (mobile.replace(/\D/g, '').length !== 10))
      return setError('Enter a valid 10-digit mobile number');

    setLoading(true);
    try {
      const data = await registerCustomer({
        name: name.trim(),
        email: email.trim(),
        password,
        mobile: mobile.replace(/\D/g, '') || undefined,
      });
      login(data.access_token, data.customer, data.profile || null);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Header */}
        <div className="login-card__header">
          <Link to="/" className="login-card__logo">
            <img src="/logo.png" alt="MoonStar" className="login-card__logo-img" />
          </Link>
          <h1 className="login-card__title">
            {tab === 'login' ? 'Sign In' : 'Create Account'}
          </h1>
          <p className="login-card__subtitle">
            {tab === 'login'
              ? 'Welcome back! Sign in to your account'
              : 'New here? Create your free account'}
          </p>
          {isExpired && (
            <div className="login-expired-banner">
              Your session expired — please sign in again.
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="login-tabs">
          <button
            className={`login-tab ${tab === 'login' ? 'login-tab--active' : ''}`}
            onClick={() => switchTab('login')}
            type="button"
          >
            Sign In
          </button>
          <button
            className={`login-tab ${tab === 'register' ? 'login-tab--active' : ''}`}
            onClick={() => switchTab('register')}
            type="button"
          >
            Register
          </button>
        </div>

        {/* ── Sign In Form ── */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="login-form" noValidate>
            {error && <div className="login-error">{error}</div>}
            {success && <div className="login-success">{success}</div>}

            <div className="login-form__field">
              <label htmlFor="login-email">Email Address</label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                required
              />
            </div>

            <div className="login-form__field">
              <label htmlFor="login-password">Password</label>
              <div className="login-form__pass-wrap">
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="login-form__eye"
                  onClick={() => setShowPass(!showPass)}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg login-form__submit"
              disabled={loading}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>

            <p className="login-form__switch">
              Don't have an account?{' '}
              <button type="button" className="login-form__switch-btn" onClick={() => switchTab('register')}>
                Register here
              </button>
            </p>
          </form>
        )}

        {/* ── Register Form ── */}
        {tab === 'register' && (
          <form onSubmit={handleRegister} className="login-form" noValidate>
            {error && <div className="login-error">{error}</div>}

            <div className="login-form__field">
              <label htmlFor="reg-name">Full Name *</label>
              <input
                id="reg-name"
                type="text"
                autoComplete="name"
                placeholder="e.g. Vignesh Kumar"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                required
              />
            </div>

            <div className="login-form__field">
              <label htmlFor="reg-email">Email Address *</label>
              <input
                id="reg-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="login-form__field">
              <label htmlFor="reg-mobile">
                Mobile Number <span className="login-form__optional">(optional)</span>
              </label>
              <div className="login-form__phone-wrap">
                <span className="login-form__country-code">+91</span>
                <input
                  id="reg-mobile"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="10-digit mobile"
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                />
              </div>
            </div>

            <div className="login-form__field">
              <label htmlFor="reg-password">Password * <span className="login-form__optional">(min 6 chars)</span></label>
              <div className="login-form__pass-wrap">
                <input
                  id="reg-password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="login-form__eye"
                  onClick={() => setShowPass(!showPass)}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div className="login-form__field">
              <label htmlFor="reg-confirm">Confirm Password *</label>
              <input
                id="reg-confirm"
                type={showPass ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg login-form__submit"
              disabled={loading}
            >
              {loading ? 'Creating account…' : 'Create Account'}
            </button>

            <p className="login-form__switch">
              Already have an account?{' '}
              <button type="button" className="login-form__switch-btn" onClick={() => switchTab('login')}>
                Sign in here
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
