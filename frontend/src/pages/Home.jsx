/**
 * Home Page — Men's Accessories Store
 *
 * Sections:
 * 1. Hero Banner Carousel
 * 2. Category Quick-Links Strip (trust-strip__grid)
 * 3. One section per category — Belts, Socks, Perfumes,
 *    Shoe Polish, Locks, Men's Purse, Slippers
 *    Each shows 4 products (real from API, fallback to demo)
 *    + "View More" button → /category/:slug
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { getProducts, getCategoryProducts } from '../services/api';
import './Home.css';

// ── Hero banners ─────────────────────────────────────────────────────────────
const HERO_BANNERS = [
  {
    id: 1,
    type: 'brand',
    tag: 'Welcome to MoonStar',
    title: "Premium Men's\nAccessories",
    subtitle: 'Belts · Perfumes · Wallets · Slippers & More',
    cta: 'Shop Now',
    ctaLink: '/search',
    // Dark navy brand slide — uses logo as the right-side visual
    bg: 'linear-gradient(120deg, #0d1b30 0%, #1B2A4A 55%, #243558 100%)',
    image: null,
    accent: '#C5983B',
  },
  {
    id: 2,
    type: 'product',
    tag: 'New Collection',
    title: 'Comfort Meets\nStyle',
    subtitle: 'Premium slippers for every occasion',
    cta: 'Shop Slippers',
    ctaLink: '/category/slippers',
    bg: 'linear-gradient(120deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)',
    image: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=700&h=600&fit=crop&q=80',
    accent: '#C5983B',
  },
  {
    id: 3,
    type: 'product',
    tag: 'Best Sellers',
    title: 'Signature\nFragrances',
    subtitle: 'Long-lasting perfumes crafted for modern men',
    cta: 'Shop Perfumes',
    ctaLink: '/category/perfumes',
    bg: 'linear-gradient(120deg, #1a0a2e 0%, #2d1b4a 60%, #3d2060 100%)',
    image: 'https://images.unsplash.com/photo-1541643600914-78b084683702?w=700&h=600&fit=crop&q=80',
    accent: '#a07cc5',
  },
  {
    id: 4,
    type: 'product',
    tag: 'Trending Now',
    title: "Genuine Leather\nWallets",
    subtitle: 'Handcrafted wallets & purses for the gentleman',
    cta: "Shop Men's Purse",
    ctaLink: '/category/mens-purses',
    bg: 'linear-gradient(120deg, #1a1200 0%, #2e2000 60%, #3d2c00 100%)',
    image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=700&h=600&fit=crop&q=80',
    accent: '#C5983B',
  },
];

// ── Category strip (quick-links bar) ─────────────────────────────────────────
const CATEGORY_STRIPS = [
  { icon: '👔', label: 'Belts',        slug: 'belts' },
  { icon: '🧦', label: 'Socks',        slug: 'socks' },
  { icon: '✨', label: 'Perfumes',     slug: 'perfumes' },
  { icon: '👞', label: 'Shoe Polish',  slug: 'shoe-polish' },
  { icon: '🔒', label: 'Locks',        slug: 'locks' },
  { icon: '👜', label: "Men's Purse",  slug: 'mens-purses' },
  { icon: '🩴', label: 'Slippers',     slug: 'slippers' },
];

// ── Demo products per category (shown when API is empty) ─────────────────────
const DEMO_BY_CATEGORY = {
  belts: [
    { id: 'b1', name: 'Premium Leather Belt', slug: 'b1', price: 599, original_price: 799, discount_percent: 25, stock: 10, in_stock: true, image: 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=400&h=400&fit=crop' },
    { id: 'b2', name: 'Reversible Canvas Belt', slug: 'b2', price: 349, original_price: 499, discount_percent: 30, stock: 20, in_stock: true, image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop' },
    { id: 'b3', name: 'Formal Leather Belt Black', slug: 'b3', price: 499, original_price: 699, discount_percent: 29, stock: 15, in_stock: true, image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=400&fit=crop' },
    { id: 'b4', name: 'Woven Fabric Belt Brown', slug: 'b4', price: 249, original_price: 349, discount_percent: 29, stock: 0, in_stock: false, image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=400&fit=crop' },
  ],
  socks: [
    { id: 's1', name: "Men's Cotton Socks Pack of 3", slug: 's1', price: 199, original_price: 299, discount_percent: 33, stock: 50, in_stock: true, image: 'https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=400&h=400&fit=crop' },
    { id: 's2', name: 'Ankle Sports Socks Pack of 6', slug: 's2', price: 299, original_price: 449, discount_percent: 33, stock: 30, in_stock: true, image: 'https://images.unsplash.com/photo-1607522370275-f6fd0be78f86?w=400&h=400&fit=crop' },
    { id: 's3', name: 'Woollen Winter Socks', slug: 's3', price: 149, original_price: 199, discount_percent: 25, stock: 40, in_stock: true, image: 'https://images.unsplash.com/photo-1560343776-97e7d202ff0e?w=400&h=400&fit=crop' },
    { id: 's4', name: 'No-Show Invisible Socks', slug: 's4', price: 99, original_price: 149, discount_percent: 34, stock: 60, in_stock: true, image: 'https://images.unsplash.com/photo-1617952986600-802814f8516d?w=400&h=400&fit=crop' },
  ],
  perfumes: [
    { id: 'p1', name: "Classic Men's Perfume 100ml", slug: 'p1', price: 799, original_price: 999, discount_percent: 20, stock: 15, in_stock: true, image: 'https://images.unsplash.com/photo-1541643600914-78b084683702?w=400&h=400&fit=crop' },
    { id: 'p2', name: 'Woody Oud Eau de Parfum', slug: 'p2', price: 1299, original_price: 1799, discount_percent: 28, stock: 8, in_stock: true, image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=400&h=400&fit=crop' },
    { id: 'p3', name: 'Fresh Aqua Body Spray', slug: 'p3', price: 349, original_price: 449, discount_percent: 22, stock: 25, in_stock: true, image: 'https://images.unsplash.com/photo-1563170351-be82bc888aa4?w=400&h=400&fit=crop' },
    { id: 'p4', name: 'Spicy Musk Cologne 50ml', slug: 'p4', price: 599, original_price: 799, discount_percent: 25, stock: 0, in_stock: false, image: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?w=400&h=400&fit=crop' },
  ],
  'shoe-polish': [
    { id: 'sp1', name: 'Black Shoe Polish 50g', slug: 'sp1', price: 99, original_price: 120, discount_percent: 17, stock: 100, in_stock: true, image: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=400&h=400&fit=crop' },
    { id: 'sp2', name: 'Brown Leather Shoe Cream', slug: 'sp2', price: 129, original_price: 160, discount_percent: 19, stock: 60, in_stock: true, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop' },
    { id: 'sp3', name: 'Neutral Shoe Wax Polish', slug: 'sp3', price: 89, original_price: 110, discount_percent: 19, stock: 80, in_stock: true, image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400&h=400&fit=crop' },
    { id: 'sp4', name: 'Shoe Shine Brush Set', slug: 'sp4', price: 199, original_price: 249, discount_percent: 20, stock: 35, in_stock: true, image: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=400&h=400&fit=crop' },
  ],
  locks: [
    { id: 'l1', name: 'Heavy Duty Padlock', slug: 'l1', price: 299, original_price: 399, discount_percent: 25, stock: 30, in_stock: true, image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop' },
    { id: 'l2', name: '4-Digit Combination Lock', slug: 'l2', price: 199, original_price: 299, discount_percent: 33, stock: 45, in_stock: true, image: 'https://images.unsplash.com/photo-1616198814651-e71f960c3180?w=400&h=400&fit=crop' },
    { id: 'l3', name: 'Steel Door Padlock 60mm', slug: 'l3', price: 449, original_price: 599, discount_percent: 25, stock: 20, in_stock: true, image: 'https://images.unsplash.com/photo-1609743522653-52354461eb27?w=400&h=400&fit=crop' },
    { id: 'l4', name: 'Travel Luggage Lock TSA', slug: 'l4', price: 249, original_price: 349, discount_percent: 29, stock: 50, in_stock: true, image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=400&fit=crop' },
  ],
  'mens-purses': [
    { id: 'mp1', name: "Leather Men's Bifold Wallet", slug: 'mp1', price: 699, original_price: 899, discount_percent: 22, stock: 20, in_stock: true, image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=400&h=400&fit=crop' },
    { id: 'mp2', name: 'Slim Card Holder Wallet', slug: 'mp2', price: 399, original_price: 549, discount_percent: 27, stock: 35, in_stock: true, image: 'https://images.unsplash.com/photo-1601592715327-a99b3f3d6d28?w=400&h=400&fit=crop' },
    { id: 'mp3', name: 'RFID Blocking Wallet Brown', slug: 'mp3', price: 849, original_price: 1099, discount_percent: 23, stock: 12, in_stock: true, image: 'https://images.unsplash.com/photo-1512486130939-2c4f79935e4f?w=400&h=400&fit=crop' },
    { id: 'mp4', name: 'Long Clutch Purse Black', slug: 'mp4', price: 549, original_price: 749, discount_percent: 27, stock: 0, in_stock: false, image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400&h=400&fit=crop' },
  ],
  slippers: [
    { id: 'sl1', name: 'Comfort Foam Slippers', slug: 'sl1', price: 449, original_price: 699, discount_percent: 36, stock: 25, in_stock: true, image: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=400&h=400&fit=crop' },
    { id: 'sl2', name: 'Anti-Slip Home Slippers', slug: 'sl2', price: 299, original_price: 399, discount_percent: 25, stock: 40, in_stock: true, image: 'https://images.unsplash.com/photo-1512374382149-233c42b6a83b?w=400&h=400&fit=crop' },
    { id: 'sl3', name: 'EVA Flip Flops Beach', slug: 'sl3', price: 199, original_price: 249, discount_percent: 20, stock: 60, in_stock: true, image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=400&fit=crop' },
    { id: 'sl4', name: 'Memory Foam Indoor Slipper', slug: 'sl4', price: 599, original_price: 799, discount_percent: 25, stock: 18, in_stock: true, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop' },
  ],
};

// ── CategorySection component ─────────────────────────────────────────────────
function CategorySection({ cat, products, loading, isAlt }) {
  const displayProducts = products.length > 0 ? products : DEMO_BY_CATEGORY[cat.slug] || [];

  return (
    <section
      className={`products-section${isAlt ? ' products-section--alt' : ''}`}
      aria-label={cat.label}
    >
      <div className="container">
        <div className="section-header">
          <div className="section-header__left">
            <span className="section-header__icon" aria-hidden="true">{cat.icon}</span>
            <h2 className="section-title">{cat.label}</h2>
          </div>
          <Link to={`/category/${cat.slug}`} className="view-more-btn">
            View More
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        </div>

        {loading ? (
          <div className="products-loading">
            {[...Array(4)].map((_, i) => <div key={i} className="product-skeleton" />)}
          </div>
        ) : (
          <div className="product-grid">
            {displayProducts.slice(0, 4).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}

        {/* Bottom View More button */}
        <div className="section-footer">
          <Link to={`/category/${cat.slug}`} className="btn btn-outline">
            View All {cat.label}
          </Link>
        </div>
      </div>
    </section>
  );
}

// ── Main Home component ───────────────────────────────────────────────────────
export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slideInterval = useRef(null);

  // Per-category product lists from API
  const [categoryProducts, setCategoryProducts] = useState({});
  const [loading, setLoading] = useState(true);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % HERO_BANNERS.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + HERO_BANNERS.length) % HERO_BANNERS.length);
  }, []);

  useEffect(() => {
    slideInterval.current = setInterval(nextSlide, 4500);
    return () => clearInterval(slideInterval.current);
  }, [nextSlide]);

  const resetAutoPlay = () => {
    clearInterval(slideInterval.current);
    slideInterval.current = setInterval(nextSlide, 4500);
  };

  // Fetch 4 products per category in parallel
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const results = await Promise.allSettled(
          CATEGORY_STRIPS.map((cat) =>
            getCategoryProducts(cat.slug, { per_page: 4, sort: 'newest' })
              .then((d) => ({ slug: cat.slug, products: d.products || [] }))
              .catch(() => ({ slug: cat.slug, products: [] }))
          )
        );
        const map = {};
        results.forEach((r) => {
          if (r.status === 'fulfilled') {
            map[r.value.slug] = r.value.products;
          }
        });
        setCategoryProducts(map);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="home">

        {/* ── 1. Hero Carousel ── */}
      <section className="hero-carousel" aria-label="Hero banners">
        <div
          className="hero-carousel__track"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {HERO_BANNERS.map((banner) => (
            <div
              key={banner.id}
              className="hero-carousel__slide hero-carousel__slide--gradient"
              style={{ background: banner.bg }}
            >
              {/* Dark overlay for text contrast */}
              <div className="hero-slide__overlay" />

              <div className="hero-slide__inner container">
                {/* ── Left: Text ── */}
                <div className="hero-slide__text">
                  <span
                    className="hero-slide__tag"
                    style={{ color: banner.accent, borderColor: banner.accent }}
                  >
                    {banner.tag}
                  </span>

                  <h1 className="hero-carousel__title">
                    {banner.title.split('\n').map((line, i) => (
                      <span key={i}>
                        {line}
                        {i < banner.title.split('\n').length - 1 && <br />}
                      </span>
                    ))}
                  </h1>

                  <p className="hero-carousel__subtitle">{banner.subtitle}</p>

                  <Link
                    to={banner.ctaLink}
                    className="hero-slide__cta"
                    style={{ background: banner.accent }}
                  >
                    {banner.cta}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </Link>
                </div>

                {/* ── Right: Image or Logo ── */}
                <div className="hero-slide__visual">
                  {banner.image ? (
                    <div className="hero-slide__img-wrap">
                      <img
                        src={banner.image}
                        alt={banner.title}
                        className="hero-slide__img"
                        loading="eager"
                      />
                      {/* Glow ring behind product image */}
                      <div
                        className="hero-slide__img-glow"
                        style={{ background: `radial-gradient(circle, ${banner.accent}30 0%, transparent 70%)` }}
                      />
                    </div>
                  ) : (
                    /* Brand slide — show the MoonStar logo large */
                    <div className="hero-slide__logo-wrap">
                      <img src="/logo.png" alt="MoonStar" className="hero-slide__logo" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <button className="hero-carousel__arrow hero-carousel__arrow--prev" onClick={() => { prevSlide(); resetAutoPlay(); }} aria-label="Previous slide">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
        </button>
        <button className="hero-carousel__arrow hero-carousel__arrow--next" onClick={() => { nextSlide(); resetAutoPlay(); }} aria-label="Next slide">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
        </button>

        <div className="hero-carousel__dots" role="tablist">
          {HERO_BANNERS.map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === currentSlide}
              className={`hero-carousel__dot ${i === currentSlide ? 'hero-carousel__dot--active' : ''}`}
              onClick={() => { setCurrentSlide(i); resetAutoPlay(); }}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </section>

      {/* ── 2. Category Quick-Links Strip ── */}
      <section className="trust-strip" aria-label="Shop by category">
        <div className="container">
          <div className="trust-strip__grid">
            {CATEGORY_STRIPS.map((cat) => (
              <Link
                key={cat.slug}
                to={`/category/${cat.slug}`}
                className="trust-strip__item trust-strip__item--link"
                aria-label={`Shop ${cat.label}`}
              >
                <span className="trust-strip__icon" aria-hidden="true">{cat.icon}</span>
                <div className="trust-strip__text">
                  <span className="trust-strip__title">{cat.label}</span>
                  <span className="trust-strip__desc">Shop Now →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. One section per category ── */}
      {CATEGORY_STRIPS.map((cat, i) => (
        <CategorySection
          key={cat.slug}
          cat={cat}
          products={categoryProducts[cat.slug] || []}
          loading={loading}
          isAlt={i % 2 !== 0}
        />
      ))}

    </div>
  );
}
