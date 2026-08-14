/**
 * Home Page — BuyBoys-inspired e-commerce landing page.
 *
 * Sections:
 * 1. Hero Banner Carousel (full-width, auto-play)
 * 2. Category Product Sections (admin-uploaded products, demo data for now)
 * 3. Trust Badges Strip
 *
 * Products are admin-managed only — customers can browse and add to cart.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import ProductCard from '../components/ProductCard';
import './Home.css';

/* ── Demo product data (will be replaced by API calls in Sprint 2) ── */
const DEMO_PRODUCTS = {
  'Men\'s Slippers': [
    { id: 1, name: 'Premium Leather Flip Flops — Brown', slug: 'leather-flip-flops-brown', image: 'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=500&h=500&fit=crop', price: 599, originalPrice: 999, discount: 40 },
    { id: 2, name: 'Casual Comfort Slides — Navy Blue', slug: 'comfort-slides-navy', image: 'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=500&h=500&fit=crop', price: 449, originalPrice: 799, discount: 44 },
    { id: 3, name: 'Ortho Arch Support Chappal', slug: 'ortho-arch-support', image: 'https://images.unsplash.com/photo-1575537302964-96cd47c06b1b?w=500&h=500&fit=crop', price: 799, originalPrice: 1299, discount: 38 },
    { id: 4, name: 'Classic Rubber Slippers — Black', slug: 'classic-rubber-black', image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=500&h=500&fit=crop', price: 299, originalPrice: 499, discount: 40 },
  ],
  'Women\'s Slippers': [
    { id: 5, name: 'Floral Print Slides — Pink', slug: 'floral-slides-pink', image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=500&h=500&fit=crop', price: 549, originalPrice: 899, discount: 39 },
    { id: 6, name: 'Cushioned Home Slippers — Lavender', slug: 'cushioned-home-lavender', image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=500&h=500&fit=crop', price: 399, originalPrice: 699, discount: 43 },
    { id: 7, name: 'Wedge Heel Chappal — Gold', slug: 'wedge-heel-gold', image: 'https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=500&h=500&fit=crop', price: 699, originalPrice: 1199, discount: 42 },
    { id: 8, name: 'Strappy Casual Sandals — Tan', slug: 'strappy-casual-tan', image: 'https://images.unsplash.com/photo-1562183241-b937e95585b6?w=500&h=500&fit=crop', price: 649, originalPrice: 999, discount: 35 },
  ],
  'Kids Slippers': [
    { id: 9, name: 'Cartoon Character Flip Flops', slug: 'cartoon-flip-flops', image: 'https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=500&h=500&fit=crop', price: 249, originalPrice: 499, discount: 50 },
    { id: 10, name: 'Soft Foam Slides — Multi Color', slug: 'soft-foam-multicolor', image: 'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=500&h=500&fit=crop', price: 199, originalPrice: 399, discount: 50 },
    { id: 11, name: 'Velcro Strap Sandals — Blue', slug: 'velcro-sandals-blue', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop', price: 349, originalPrice: 599, discount: 42 },
    { id: 12, name: 'Sports Slides — Red & White', slug: 'sports-slides-red', image: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=500&h=500&fit=crop', price: 299, originalPrice: 549, discount: 46 },
  ],
  'Sports & Outdoor': [
    { id: 13, name: 'Grip Sole Outdoor Sandals', slug: 'grip-outdoor-sandals', image: 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=500&h=500&fit=crop', price: 899, originalPrice: 1499, discount: 40 },
    { id: 14, name: 'Quick Dry Beach Slippers', slug: 'quick-dry-beach', image: 'https://images.unsplash.com/photo-1584735175315-9d5df23be617?w=500&h=500&fit=crop', price: 499, originalPrice: 899, discount: 44 },
    { id: 15, name: 'EVA Memory Foam Slides', slug: 'eva-memory-foam', image: 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=500&h=500&fit=crop', price: 599, originalPrice: 999, discount: 40 },
    { id: 16, name: 'Trekking Sandals — Olive Green', slug: 'trekking-olive', image: 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=500&h=500&fit=crop', price: 1099, originalPrice: 1799, discount: 39 },
  ],
};

const HERO_BANNERS = [
  { id: 1, image: 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=1400&h=500&fit=crop', alt: 'New Arrivals Collection' },
  { id: 2, image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=1400&h=500&fit=crop', alt: 'Premium Comfort Slippers' },
  { id: 3, image: 'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=1400&h=500&fit=crop', alt: 'Sports Collection' },
];

const TRUST_BADGES = [
  { icon: '🚚', title: 'Free Delivery', desc: 'On orders above ₹499' },
  { icon: '💵', title: 'Cash on Delivery', desc: 'Pay when you receive' },
  { icon: '↩️', title: 'Easy Returns', desc: '7 day return policy' },
  { icon: '🔒', title: 'Secure Payments', desc: '100% protected' },
];

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slideInterval = useRef(null);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % HERO_BANNERS.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + HERO_BANNERS.length) % HERO_BANNERS.length);
  }, []);

  // Auto-play carousel
  useEffect(() => {
    slideInterval.current = setInterval(nextSlide, 4000);
    return () => clearInterval(slideInterval.current);
  }, [nextSlide]);

  const resetAutoPlay = () => {
    clearInterval(slideInterval.current);
    slideInterval.current = setInterval(nextSlide, 4000);
  };

  return (
    <div className="home">
      {/* ── Hero Banner Carousel ── */}
      <section className="hero-carousel" id="hero-carousel">
        <div className="hero-carousel__track" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
          {HERO_BANNERS.map((banner) => (
            <div className="hero-carousel__slide" key={banner.id}>
              <img src={banner.image} alt={banner.alt} className="hero-carousel__image" />
              <div className="hero-carousel__overlay">
                <div className="container">
                  <h2 className="hero-carousel__title">{banner.alt}</h2>
                  <a href="/products" className="btn btn-primary btn-lg">Shop Now</a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Arrows */}
        <button className="hero-carousel__arrow hero-carousel__arrow--prev" onClick={() => { prevSlide(); resetAutoPlay(); }} aria-label="Previous">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <button className="hero-carousel__arrow hero-carousel__arrow--next" onClick={() => { nextSlide(); resetAutoPlay(); }} aria-label="Next">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        {/* Dots */}
        <div className="hero-carousel__dots">
          {HERO_BANNERS.map((_, i) => (
            <button
              key={i}
              className={`hero-carousel__dot ${i === currentSlide ? 'hero-carousel__dot--active' : ''}`}
              onClick={() => { setCurrentSlide(i); resetAutoPlay(); }}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </section>

      {/* ── Trust Badges ── */}
      <section className="trust-strip" id="trust-badges">
        <div className="container">
          <div className="trust-strip__grid">
            {TRUST_BADGES.map((badge) => (
              <div className="trust-strip__item" key={badge.title}>
                <span className="trust-strip__icon">{badge.icon}</span>
                <div className="trust-strip__text">
                  <span className="trust-strip__title">{badge.title}</span>
                  <span className="trust-strip__desc">{badge.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Category Product Sections ── */}
      {Object.entries(DEMO_PRODUCTS).map(([category, products]) => (
        <section className="category-section" key={category} id={`cat-${category.replace(/[^a-zA-Z]/g, '-').toLowerCase()}`}>
          <div className="container">
            <div className="category-section__header">
              <h2 className="category-section__title">{category}</h2>
            </div>
            <div className="product-grid">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <div className="category-section__footer">
              <a href={`/categories/${category.replace(/[^a-zA-Z]/g, '-').toLowerCase()}`} className="view-all-btn">
                View All
              </a>
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
