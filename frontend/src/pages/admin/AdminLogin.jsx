/**
 * AdminLogin — Admin login page with username/password.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminLogin, seedAdmin } from '../../services/adminApi';
import './AdminLogin.css';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await adminLogin(username, password);
      localStorage.setItem('admin_token', data.token);
      localStorage.setItem('admin_user', JSON.stringify(data.admin));
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    setError('');
    try {
      await seedAdmin({ username: 'admin', password: 'admin123', email: 'admin@moonstar.com' });
      setUsername('admin');
      setPassword('admin123');
      setError('');
      alert('Admin account created! Username: admin, Password: admin123');
    } catch (err) {
      setError(err.message);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="admin-login">
      <div className="admin-login__card">
        <div className="admin-login__header">
          <img src="/logo.png" alt="MoonStar" className="admin-login__logo" />
          <h1 className="admin-login__title">Admin Panel</h1>
          <p className="admin-login__subtitle">MoonStar Footwear & Accessories</p>
        </div>

        <form onSubmit={handleLogin} className="admin-login__form">
          {error && <div className="admin-login__error">{error}</div>}

          <div className="admin-login__field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter admin username"
              required
              autoFocus
            />
          </div>

          <div className="admin-login__field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>

          <button type="submit" className="admin-login__btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="admin-login__footer">
          <p className="admin-login__help">First time? Create the initial admin account:</p>
          <button onClick={handleSeed} className="admin-login__seed-btn" disabled={seeding}>
            {seeding ? 'Creating...' : 'Create Admin Account'}
          </button>
        </div>
      </div>
    </div>
  );
}
