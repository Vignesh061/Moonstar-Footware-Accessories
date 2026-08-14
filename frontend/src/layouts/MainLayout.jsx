/**
 * MainLayout — BuyBoys-inspired clean e-commerce layout.
 *
 * Navbar: Logo | centered nav links | search, wishlist, cart, account icons
 * Mobile: hamburger | logo | search
 * Footer: Brand, Shop links, Policies, Contact, Social
 */
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './MainLayout.css';

const NAV_LINKS = [
  { path: '/', label: 'Home' },
  { path: '/products', label: 'Shop' },
  { path: '/categories', label: 'Categories' },
  { path: '/about', label: 'About Us' },
];

export default function MainLayout() {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

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
                key={link.path}
                to={link.path}
                className={`navbar__link ${location.pathname === link.path ? 'navbar__link--active' : ''}`}
              >
                {link.label}
              </Link>
            ))}
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
              <span className="navbar__cart-count" id="cart-badge">0</span>
            </Link>

            {/* Account */}
            <button className="navbar__icon-btn navbar__icon-btn--desktop-only" aria-label="Account" id="account-button">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Search Bar (expandable) */}
        {searchOpen && (
          <div className="navbar__search-bar animate-fade-in">
            <div className="container">
              <div className="navbar__search-input-wrap">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  className="navbar__search-input"
                  placeholder="Search for slippers, sandals, shoes..."
                  autoFocus
                  id="search-input"
                />
                <button className="navbar__search-close" onClick={() => setSearchOpen(false)} aria-label="Close search">
                  ✕
                </button>
              </div>
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
              key={link.path}
              to={link.path}
              className={`mobile-sidebar__link ${location.pathname === link.path ? 'mobile-sidebar__link--active' : ''}`}
            >
              {link.label}
            </Link>
          ))}
          <hr className="mobile-sidebar__divider" />
          <Link to="/wishlist" className="mobile-sidebar__link">Wishlist</Link>
          <Link to="/cart" className="mobile-sidebar__link">Cart</Link>
          <button className="mobile-sidebar__link" style={{ textAlign: 'left' }}>Account</button>
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
              <p className="footer__tagline">Footwear & Accessories</p>
              <p className="footer__desc">
                Premium quality slippers and footwear for the whole family.
                Shop online with doorstep delivery across India.
              </p>
            </div>

            {/* Links Grid */}
            <div className="footer__links-grid">
              <div className="footer__col">
                <h4 className="footer__col-title">Shop</h4>
                <Link to="/products" className="footer__link">All Products</Link>
                <Link to="/categories" className="footer__link">Categories</Link>
                <Link to="/products?sort=newest" className="footer__link">New Arrivals</Link>
              </div>
              <div className="footer__col">
                <h4 className="footer__col-title">Customer Care</h4>
                <a href="#" className="footer__link">Contact Us</a>
                <a href="#" className="footer__link">FAQ</a>
                <a href="#" className="footer__link">Track Order</a>
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
              <a href="#" className="footer__social-icon" aria-label="Instagram">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                </svg>
              </a>
              <a href="#" className="footer__social-icon" aria-label="Facebook">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                </svg>
              </a>
              <a href="https://wa.me/919876543210" className="footer__social-icon" aria-label="WhatsApp" target="_blank" rel="noopener noreferrer">
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
        href="https://wa.me/919876543210"
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
