/**
 * ProductCard — Reusable product card component.
 * Displays product image, name, price (with discount), and action buttons.
 * Products are admin-managed only; customers can only view and add to cart.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import './ProductCard.css';

export default function ProductCard({ product }) {
  const [wishlisted, setWishlisted] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const {
    id,
    name,
    slug,
    image,
    price,
    originalPrice,
    discount,
    inStock = true,
  } = product;

  return (
    <div className="product-card" id={`product-${id}`}>
      {/* Image Container */}
      <Link to={`/products/${slug || id}`} className="product-card__image-wrap">
        {!imageLoaded && <div className="product-card__shimmer"></div>}
        <img
          src={image}
          alt={name}
          className={`product-card__image ${imageLoaded ? 'loaded' : ''}`}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
        />

        {/* Discount Badge */}
        {discount > 0 && (
          <span className="product-card__discount-badge">
            {discount}% OFF
          </span>
        )}

        {/* Wishlist Button */}
        <button
          className={`product-card__wishlist ${wishlisted ? 'product-card__wishlist--active' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setWishlisted(!wishlisted);
          }}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill={wishlisted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>

        {/* Out of stock overlay */}
        {!inStock && (
          <div className="product-card__out-of-stock">
            <span>Out of Stock</span>
          </div>
        )}
      </Link>

      {/* Product Info */}
      <div className="product-card__info">
        <Link to={`/products/${slug || id}`} className="product-card__name">
          {name}
        </Link>

        <div className="product-card__pricing">
          <span className="product-card__price">₹{price}</span>
          {originalPrice > price && (
            <>
              <span className="product-card__original-price">₹{originalPrice}</span>
              <span className="product-card__discount-text">{discount}% off</span>
            </>
          )}
        </div>

        <button
          className={`product-card__add-btn ${!inStock ? 'product-card__add-btn--disabled' : ''}`}
          disabled={!inStock}
          onClick={() => {
            // Cart logic will be implemented in Sprint 3
            console.log('Add to cart:', id);
          }}
        >
          {inStock ? 'Add to Cart' : 'Notify Me'}
        </button>
      </div>
    </div>
  );
}
