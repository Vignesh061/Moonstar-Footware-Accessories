/**
 * ProductDetail Page — /products/:id
 * Shows full product info, images, attributes, quantity selector, add to cart.
 */
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getProduct } from '../services/api';
import { useCart } from '../context/CartContext';
import './ProductDetail.css';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedAttrs, setSelectedAttrs] = useState({});
  const [addedMsg, setAddedMsg] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getProduct(id);
        setProduct(data.product);
        setActiveImage(0);
        setQuantity(1);
        setSelectedAttrs({});
      } catch (err) {
        setError(err.message || 'Product not found');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="pd-page">
        <div className="container">
          <div className="pd-skeleton">
            <div className="pd-skeleton__image" />
            <div className="pd-skeleton__info">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="pd-skeleton__line" style={{ width: `${80 - i * 10}%` }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="pd-page">
        <div className="container">
          <div className="pd-error">
            <h2>Product not found</h2>
            <p>{error || 'This product may no longer be available.'}</p>
            <button onClick={() => navigate(-1)} className="btn btn-outline">Go Back</button>
          </div>
        </div>
      </div>
    );
  }

  const images = product.images?.length > 0
    ? product.images
    : [{ image_url: product.image, id: 'main', is_primary: true }];

  const inStock = product.stock > 0;

  // Group attributes by name for display
  const attrGroups = {};
  (product.attributes || []).forEach((a) => {
    if (!attrGroups[a.attribute_name]) attrGroups[a.attribute_name] = [];
    attrGroups[a.attribute_name].push(a.attribute_value);
  });

  const handleAttrSelect = (name, value) => {
    setSelectedAttrs((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddToCart = () => {
    if (!inStock) return;
    addItem(
      {
        id: product.id,
        name: product.name,
        slug: product.slug,
        image: images[0]?.image_url,
        price: product.price,
        original_price: product.original_price,
        discount_percent: product.discount_percent,
        stock: product.stock,
      },
      quantity,
      selectedAttrs
    );
    setAddedMsg('Added to cart!');
    setTimeout(() => setAddedMsg(''), 2500);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate('/cart');
  };

  return (
    <div className="pd-page">
      <div className="container">
        {/* Breadcrumb */}
        <nav className="pd-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span>›</span>
          {product.category && (
            <>
              <Link to={`/category/${product.category.slug}`}>{product.category.name}</Link>
              <span>›</span>
            </>
          )}
          <span>{product.name}</span>
        </nav>

        <div className="pd-layout">
          {/* ── Images ── */}
          <div className="pd-images">
            <div className="pd-images__main">
              {images[activeImage]?.image_url ? (
                <img
                  src={images[activeImage].image_url}
                  alt={product.name}
                  className="pd-images__main-img"
                />
              ) : (
                <div className="pd-images__placeholder">No Image</div>
              )}
              {product.discount_percent > 0 && (
                <span className="pd-images__badge">{product.discount_percent}% OFF</span>
              )}
            </div>
            {images.length > 1 && (
              <div className="pd-images__thumbnails" role="list">
                {images.map((img, i) => (
                  <button
                    key={img.id || i}
                    role="listitem"
                    className={`pd-images__thumb ${i === activeImage ? 'pd-images__thumb--active' : ''}`}
                    onClick={() => setActiveImage(i)}
                    aria-label={`View image ${i + 1}`}
                  >
                    <img src={img.image_url} alt={`${product.name} ${i + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Info ── */}
          <div className="pd-info">
            {product.category && (
              <Link to={`/category/${product.category.slug}`} className="pd-info__category">
                {product.category.name}
              </Link>
            )}

            <h1 className="pd-info__name">{product.name}</h1>

            {product.brand && (
              <p className="pd-info__brand">Brand: <strong>{product.brand}</strong></p>
            )}

            {/* Pricing */}
            <div className="pd-info__pricing">
              <span className="pd-info__price">₹{product.price}</span>
              {product.original_price > product.price && (
                <>
                  <span className="pd-info__original">₹{product.original_price}</span>
                  <span className="pd-info__discount">{product.discount_percent}% OFF</span>
                </>
              )}
            </div>

            {/* Stock badge */}
            <div className="pd-info__stock">
              {inStock ? (
                <span className="pd-info__stock--in">✓ In Stock ({product.stock} available)</span>
              ) : (
                <span className="pd-info__stock--out">✗ Out of Stock</span>
              )}
            </div>

            {/* Attributes */}
            {Object.entries(attrGroups).map(([name, values]) => (
              <div key={name} className="pd-info__attr-group">
                <label className="pd-info__attr-label">{name}</label>
                {values.length === 1 ? (
                  <span className="pd-info__attr-single">{values[0]}</span>
                ) : (
                  <div className="pd-info__attr-options">
                    {values.map((val) => (
                      <button
                        key={val}
                        className={`pd-info__attr-btn ${selectedAttrs[name] === val ? 'pd-info__attr-btn--selected' : ''}`}
                        onClick={() => handleAttrSelect(name, val)}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Quantity */}
            {inStock && (
              <div className="pd-info__qty">
                <label className="pd-info__attr-label">Quantity</label>
                <div className="pd-info__qty-control">
                  <button
                    className="pd-info__qty-btn"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className="pd-info__qty-value">{quantity}</span>
                  <button
                    className="pd-info__qty-btn"
                    onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                    disabled={quantity >= product.stock}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Success message */}
            {addedMsg && <div className="pd-info__added">{addedMsg}</div>}

            {/* Action Buttons */}
            <div className="pd-info__actions">
              <button
                className="btn btn-primary btn-lg pd-info__cart-btn"
                onClick={handleAddToCart}
                disabled={!inStock}
              >
                {inStock ? 'Add to Cart' : 'Out of Stock'}
              </button>
              {inStock && (
                <button className="btn btn-secondary btn-lg" onClick={handleBuyNow}>
                  Buy Now
                </button>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div className="pd-info__description">
                <h3>Description</h3>
                <p>{product.description}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
