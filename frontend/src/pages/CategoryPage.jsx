/**
 * CategoryPage — /category/:slug
 * Shows all products for a given category with search, sort, and filters.
 */
import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { getCategoryProducts, getCategory } from '../services/api';
import './CategoryPage.css';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_low', label: 'Price: Low → High' },
  { value: 'price_high', label: 'Price: High → Low' },
  { value: 'name', label: 'Name A–Z' },
  { value: 'discount', label: 'Best Discount' },
];

export default function CategoryPage() {
  const { slug } = useParams();

  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [page, setPage] = useState(1);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { sort, page, per_page: 12 };
      if (search) params.search = search;
      if (inStockOnly) params.in_stock = 'true';
      if (minPrice) params.min_price = minPrice;
      if (maxPrice) params.max_price = maxPrice;

      const [catData, prodData] = await Promise.all([
        getCategory(slug),
        getCategoryProducts(slug, params),
      ]);
      setCategory(catData.category);
      setProducts(prodData.products || []);
      setMeta(prodData.meta || {});
    } catch (err) {
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [slug, sort, page, search, inStockOnly, minPrice, maxPrice]);

  useEffect(() => {
    setPage(1);
  }, [slug, sort, search, inStockOnly, minPrice, maxPrice]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
  };

  return (
    <div className="cat-page">
      <div className="container">
        {/* Breadcrumb */}
        <nav className="cat-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span>›</span>
          <span>{category?.name || slug}</span>
        </nav>

        {/* Category Header */}
        <div className="cat-header">
          <div className="cat-header__text">
            <h1 className="cat-header__title">{category?.name || 'Category'}</h1>
            {category?.description && (
              <p className="cat-header__desc">{category.description}</p>
            )}
            {meta.total != null && (
              <p className="cat-header__count">{meta.total} products</p>
            )}
          </div>
        </div>

        <div className="cat-layout">
          {/* ── Sidebar Filters ── */}
          <aside className="cat-filters" aria-label="Filters">
            <h3 className="cat-filters__title">Filters</h3>

            <div className="cat-filter-group">
              <label className="cat-filter-group__label">Sort By</label>
              <select
                className="cat-filter-group__select"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div className="cat-filter-group">
              <label className="cat-filter-group__label">Price Range</label>
              <div className="cat-filter-group__price">
                <input
                  type="number"
                  placeholder="Min ₹"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="cat-filter-group__price-input"
                  min="0"
                />
                <span>–</span>
                <input
                  type="number"
                  placeholder="Max ₹"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="cat-filter-group__price-input"
                  min="0"
                />
              </div>
            </div>

            <div className="cat-filter-group">
              <label className="cat-filter-group__checkbox">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                />
                In Stock Only
              </label>
            </div>

            {(minPrice || maxPrice || inStockOnly) && (
              <button
                className="cat-filter-group__clear"
                onClick={() => { setMinPrice(''); setMaxPrice(''); setInStockOnly(false); }}
              >
                Clear Filters
              </button>
            )}
          </aside>

          {/* ── Products ── */}
          <div className="cat-products">
            {/* Search bar */}
            <form onSubmit={handleSearchSubmit} className="cat-search">
              <input
                type="search"
                className="cat-search__input"
                placeholder={`Search in ${category?.name || 'this category'}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search products"
              />
            </form>

            {error && (
              <div className="cat-error">⚠️ {error}</div>
            )}

            {loading ? (
              <div className="cat-grid">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="product-skeleton" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="cat-empty">
                <p>No products found{search ? ` for "${search}"` : ''}.</p>
                {search && (
                  <button className="btn btn-outline btn-sm" onClick={() => setSearch('')}>
                    Clear Search
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="cat-grid">
                  {products.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>

                {/* Pagination */}
                {meta.pages > 1 && (
                  <div className="cat-pagination">
                    <button
                      disabled={!meta.has_prev}
                      onClick={() => setPage((p) => p - 1)}
                      className="cat-pagination__btn"
                    >
                      ← Prev
                    </button>
                    <span className="cat-pagination__info">
                      Page {meta.page} of {meta.pages}
                    </span>
                    <button
                      disabled={!meta.has_next}
                      onClick={() => setPage((p) => p + 1)}
                      className="cat-pagination__btn"
                    >
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
