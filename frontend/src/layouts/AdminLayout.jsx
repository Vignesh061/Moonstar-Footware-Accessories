/**
 * AdminLayout — Sidebar layout for admin panel.
 * Protected: redirects to /admin/login if no token.
 */
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import './AdminLayout.css';

const NAV_ITEMS = [
  { path: '/admin', label: 'Dashboard', icon: '📊' },
  { path: '/admin/products', label: 'Products', icon: '📦' },
  { path: '/admin/categories', label: 'Categories', icon: '🏷️' },
  { path: '/admin/orders', label: 'Orders', icon: '🛒' },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [admin, setAdmin] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    const user = localStorage.getItem('admin_user');
    if (!token) {
      navigate('/admin/login', { replace: true });
      return;
    }
    if (user) {
      try { setAdmin(JSON.parse(user)); } catch { setAdmin({ username: 'Admin' }); }
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    navigate('/admin/login', { replace: true });
  };

  const isActive = (path) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="admin-layout">
      {/* Mobile top bar */}
      <div className="admin-topbar">
        <button className="admin-topbar__menu" onClick={() => setSidebarOpen(!sidebarOpen)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
        <span className="admin-topbar__title">MoonStar Admin</span>
        <button className="admin-topbar__logout" onClick={handleLogout}>Logout</button>
      </div>

      {/* Sidebar */}
      {sidebarOpen && <div className="admin-overlay" onClick={() => setSidebarOpen(false)} />}
      <aside className={`admin-sidebar ${sidebarOpen ? 'admin-sidebar--open' : ''}`}>
        <div className="admin-sidebar__header">
          <img src="/logo.png" alt="MoonStar" className="admin-sidebar__logo" />
          <h2 className="admin-sidebar__brand">MoonStar</h2>
          <span className="admin-sidebar__badge">Admin</span>
        </div>

        <nav className="admin-sidebar__nav">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`admin-sidebar__link ${isActive(item.path) ? 'admin-sidebar__link--active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="admin-sidebar__link-icon">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="admin-sidebar__footer">
          <div className="admin-sidebar__user">
            <div className="admin-sidebar__avatar">
              {admin?.username?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="admin-sidebar__user-info">
              <span className="admin-sidebar__user-name">{admin?.username || 'Admin'}</span>
              <span className="admin-sidebar__user-role">Administrator</span>
            </div>
          </div>
          <button className="admin-sidebar__logout" onClick={handleLogout}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
