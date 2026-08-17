/**
 * MainLayout — Clean e-commerce layout for men's accessories store.
 *
 * Navbar: Logo | centered nav links | search, cart (with live count), account icons
 * Mobile: hamburger | logo | icons
 * Footer: Brand, Shop links, Policies, Contact, Social
 */
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { googleAuthLogin } from '../services/api';
import './MainLayout.css';

const GOOGLE_ENABLED = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

// Only load GoogleLoginButton when Google OAuth is configured
const GoogleLoginButtonLazy = GOOGLE_ENABLED
  ? lazy(() => import('../components/GoogleLoginButton'))
  : null;

const NAV_LINKS = [
  { path: '/', label: 'Home' },
  { path: '/search', label: 'Shop' },
  { path: '/search', label: 'New Arrivals' },
];

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { totalItems } = useCart();
  const { isAuthenticated, user, logout, login } = useAuth();

  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [accountOpen, setAccountOpen] = useState(false);
  const searchInputRef = useRef(null);
  const accountRef = useRef(null);

  // No inline Google handler needed — handled by GoogleLoginButton component

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
    setAccountOpen(false);
  }, [location.pathname]);

  // Close account dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) {
        setAccountOpen(false);
      }
    };
    if (accountOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [accountOpen]);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <div className="layout">
      {/* ── Navbar ── */}
      <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`} id="main-navbar">
        <div className="navbar__inner container">
          {/* Mobile Hamburger */}
          <button
            className="navbar__hamburger"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            id="mobile-menu-toggle"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              {mobileMenuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>

          {/* Logo */}
          <Link to="/" className="navbar__logo" id="logo-link">
            <img src="/logo.png" alt="MoonStar" className="navbar__logo-img" />
          </Link>

          {/* Desktop Nav Links */}
          <div className="navbar__links">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                to={link.path}
                className={`navbar__link ${location.pathname === link.path ? 'navbar__link--active' : ''}`}
              >
                {link.label}
              </Link>
            ))}

            {/* Categories Dropdown */}
            <div className="nav-dropdown">
              <button className="navbar__link nav-dropdown__trigger" aria-haspopup="true">
                Categories
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              <div className="nav-dropdown__menu" role="menu">
                <div className="nav-dropdown__menu-inner">
                  <div className="nav-dropdown__grid">
                    <div className="nav-dropdown__col">
                      <Link to="/category/belts"       className="nav-dropdown__item" role="menuitem">Belts</Link>
                      <Link to="/category/socks"       className="nav-dropdown__item" role="menuitem">Socks</Link>
                      <Link to="/category/perfumes"    className="nav-dropdown__item" role="menuitem">Perfumes</Link>
                      <Link to="/category/shoe-polish" className="nav-dropdown__item" role="menuitem">Shoe Polish</Link>
                    </div>
                    <div className="nav-dropdown__col">
                      <Link to="/category/locks"       className="nav-dropdown__item" role="menuitem">Locks</Link>
                      <Link to="/category/mens-purses" className="nav-dropdown__item" role="menuitem">Men's Purse</Link>
                      <Link to="/category/slippers"    className="nav-dropdown__item" role="menuitem">Slippers</Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Icons */}
          <div className="navbar__actions">
            {/* Search */}
            <button
              className="navbar__icon-btn"
              onClick={() => setSearchOpen(!searchOpen)}
              aria-label="Search"
              id="search-button"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>

            {/* Wishlist */}
            <Link to="/wishlist" className="navbar__icon-btn" aria-label="Wishlist" id="wishlist-button">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
            </Link>

            {/* Cart */}
            <Link to="/cart" className="navbar__icon-btn navbar__icon-btn--cart" aria-label="Cart" id="cart-button">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              <span className="navbar__cart-count" id="cart-badge">{totalItems > 0 ? totalItems : ''}</span>
            </Link>

            {/* Account Dropdown */}
            <div className="acct-dropdown" ref={accountRef}>
              <button
                className="navbar__icon-btn navbar__icon-btn--desktop-only"
                aria-label="Account"
                aria-expanded={accountOpen}
                onClick={() => setAccountOpen(!accountOpen)}
              >
                {isAuthenticated && user?.name ? (
                  <span className="acct-dropdown__avatar">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                )}
              </button>

              {accountOpen && (
                <div className="acct-dropdown__panel" role="menu">

                  {isAuthenticated ? (
                    /* ── Logged in state ── */
                    <>
                      <div className="acct-dropdown__user">
                        <div className="acct-dropdown__user-avatar">
                          {user?.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div className="acct-dropdown__user-info">
                          <span className="acct-dropdown__user-name">{user?.name || 'Customer'}</span>
                          <span className="acct-dropdown__user-email">{user?.email || user?.mobile}</span>
                        </div>
                      </div>

                      <div className="acct-dropdown__divider" />

                      <Link
                        to="/orders"
                        className="acct-dropdown__item"
                        onClick={() => setAccountOpen(false)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        My Orders
                      </Link>

                      <div className="acct-dropdown__divider" />

                      <button
                        className="acct-dropdown__item acct-dropdown__item--danger"
                        onClick={() => { logout(); setAccountOpen(false); navigate('/'); }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                        Sign Out
                      </button>
                    </>
                  ) : (
                    /* ── Logged out state ── */
                    <>
                      <div className="acct-dropdown__header">
                        <p className="acct-dropdown__header-title">Welcome!</p>
                        <p className="acct-dropdown__header-sub">Sign in to your account</p>
                      </div>

                      <div className="acct-dropdown__divider" />

                      {/* Continue with Google */}
                      {GOOGLE_ENABLED && GoogleLoginButtonLazy && (
                        <>
                          <Suspense fallback={null}>
                            <GoogleLoginButtonLazy
                              onSuccess={(data) => {
                                login(data.access_token, data.customer, data.profile || null);
                                setAccountOpen(false);
                              }}
                              onError={(err) => console.error('Google login failed:', err)}
                            />
                          </Suspense>
                          <div className="acct-dropdown__or">
                            <span>or</span>
                          </div>
                        </>
                      )}

                      <Link
                        to="/login"
                        className="acct-dropdown__signin-btn"
                        onClick={() => setAccountOpen(false)}
                      >
                        Sign In with Email
                      </Link>

                      <p className="acct-dropdown__register">
                        New customer?{' '}
                        <Link
                          to="/login"
                          state={{ tab: 'register' }}
                          onClick={() => setAccountOpen(false)}
                        >
                          Create account
                        </Link>
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search Bar (expandable) */}
        {searchOpen && (
          <div className="navbar__search-bar animate-fade-in">
            <div className="container">
              <form onSubmit={handleSearchSubmit} className="navbar__search-input-wrap">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  ref={searchInputRef}
                  type="search"
                  className="navbar__search-input"
                  placeholder="Search belts, perfumes, wallets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search products"
                  id="search-input"
                />
                <button type="submit" className="navbar__search-close" aria-label="Search">🔍</button>
                <button type="button" className="navbar__search-close" onClick={() => setSearchOpen(false)} aria-label="Close search">✕</button>
              </form>
            </div>
          </div>
        )}
      </nav>

      {/* ── Mobile Sidebar Menu ── */}
      {mobileMenuOpen && (
        <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)} />
      )}
      <aside className={`mobile-sidebar ${mobileMenuOpen ? 'mobile-sidebar--open' : ''}`} id="mobile-menu">
        <div className="mobile-sidebar__header">
          <h3 className="mobile-sidebar__title">Menu</h3>
          <button className="mobile-sidebar__close" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="mobile-sidebar__links">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              to={link.path}
              className={`mobile-sidebar__link ${location.pathname === link.path ? 'mobile-sidebar__link--active' : ''}`}
            >
              {link.label}
            </Link>
          ))}

          {/* Mobile Categories */}
          <div className="mobile-sidebar__section-title">Categories</div>
          <Link to="/category/belts"        className="mobile-sidebar__link mobile-sidebar__cat-link">Belts</Link>
          <Link to="/category/socks"        className="mobile-sidebar__link mobile-sidebar__cat-link">Socks</Link>
          <Link to="/category/perfumes"     className="mobile-sidebar__link mobile-sidebar__cat-link">Perfumes</Link>
          <Link to="/category/shoe-polish"  className="mobile-sidebar__link mobile-sidebar__cat-link">Shoe Polish</Link>
          <Link to="/category/locks"        className="mobile-sidebar__link mobile-sidebar__cat-link">Locks</Link>
          <Link to="/category/mens-purses"  className="mobile-sidebar__link mobile-sidebar__cat-link">Men's Purse</Link>
          <Link to="/category/slippers"     className="mobile-sidebar__link mobile-sidebar__cat-link">Slippers</Link>

          <hr className="mobile-sidebar__divider" />
          <Link to="/cart" className="mobile-sidebar__link">🛒 Cart {totalItems > 0 && `(${totalItems})`}</Link>
          {isAuthenticated ? (
            <>
              <Link to="/orders" className="mobile-sidebar__link">📦 My Orders</Link>
              <button className="mobile-sidebar__link" onClick={logout} style={{ textAlign: 'left' }}>Sign Out</button>
            </>
          ) : (
            <Link to="/login" className="mobile-sidebar__link">👤 Sign In</Link>
          )}
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* ── Footer ── */}
      <footer className="footer" id="main-footer">
        <div className="footer__inner container">
          <div className="footer__top">
            {/* Brand */}
            <div className="footer__brand">
              <img src="/logo.png" alt="MoonStar" className="footer__logo-img" />
              <p className="footer__tagline">Men's Accessories Store</p>
              <p className="footer__desc">
                Premium belts, perfumes, wallets, and accessories for the modern man.
                Quality products delivered to your doorstep across India.
              </p>
            </div>

            {/* Links Grid */}
            <div className="footer__links-grid">
              <div className="footer__col">
                <h4 className="footer__col-title">Shop</h4>
                <Link to="/search" className="footer__link">All Products</Link>
                <Link to="/search?featured=true" className="footer__link">Featured</Link>
                <Link to="/search" className="footer__link">New Arrivals</Link>
              </div>
              <div className="footer__col">
                <h4 className="footer__col-title">Customer Care</h4>
                <a href="tel:+918438522981" className="footer__link">📞 84385 22981</a>
                <a href="https://wa.me/918438522981" className="footer__link" target="_blank" rel="noopener noreferrer">💬 WhatsApp Us</a>
                <Link to="/orders" className="footer__link">Track Order</Link>
              </div>
              <div className="footer__col">
                <h4 className="footer__col-title">Policies</h4>
                <a href="#" className="footer__link">Shipping Policy</a>
                <a href="#" className="footer__link">Return & Refund</a>
                <a href="#" className="footer__link">Privacy Policy</a>
                <a href="#" className="footer__link">Terms & Conditions</a>
              </div>
            </div>
          </div>

          {/* Social + Copyright */}
          <div className="footer__bottom">
            <div className="footer__social">
              <a href="https://www.instagram.com/moon_star.jayankondam?igsh=MTFrYXN1dmQ0YjZnOA==" className="footer__social-icon" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
              <a href="https://wa.me/918438522981" className="footer__social-icon" aria-label="WhatsApp" target="_blank" rel="noopener noreferrer">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
                </svg>
              </a>
            </div>
            <p className="footer__copyright">
              © 2026 MoonStar Footwear & Accessories. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* ── WhatsApp Float Button ── */}
      <a
        href="https://wa.me/918438522981"
        className="whatsapp-float"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        id="whatsapp-float"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="#ffffff">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
        </svg>
      </a>
    </div>
  );
}
