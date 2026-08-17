/**
 * ProductCard — Reusable product card component.
 * Displays product image, name, price (with discount), and action buttons.
 * Products are admin-managed only; customers can only view and add to cart.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './ProductCard.css';

export default function ProductCard({ product }) {
  const [wishlisted, setWishlisted] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();

  // Support both API response shape and legacy prop shape
  const id = product.id;
  const name = product.name;
  const slug = product.slug;
  const image = product.image;
  const price = product.price;
  const originalPrice = product.originalPrice ?? product.original_price;
  const discount = product.discount ?? product.discount_percent;
  const inStock = product.inStock ?? product.in_stock ?? (product.stock > 0);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!inStock) return;
    addItem(product, 1, {});
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="product-card" id={`product-${id}`}>
      {/* Image Container */}
      <Link to={`/products/${slug || id}`} className="product-card__image-wrap">
        {/* Shimmer shown until image loads, then fades out */}
        {!imageLoaded && image && <div className="product-card__shimmer" />}

        {image ? (
          <img
            src={image}
            alt={name}
            className="product-card__image"
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageLoaded(true)}
          />
        ) : (
          <div className="product-card__no-image">
            <span>No Image</span>
          </div>
        )}

        {/* Discount Badge */}
        {discount > 0 && (
          <span className="product-card__discount-badge">{discount}% OFF</span>
        )}

        {/* Wishlist Button */}
        <button
          className={`product-card__wishlist ${wishlisted ? 'product-card__wishlist--active' : ''}`}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setWishlisted(!wishlisted); }}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <svg width="20" height="20" viewBox="0 0 24 24"
            fill={wishlisted ? 'currentColor' : 'none'}
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
          className={`product-card__add-btn ${!inStock ? 'product-card__add-btn--disabled' : added ? 'product-card__add-btn--added' : ''}`}
          disabled={!inStock}
          onClick={handleAddToCart}
        >
          {!inStock ? 'Out of Stock' : added ? '✓ Added' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}
