/**
 * SearchPage — /search
 * Global product search with sort, filter, and pagination.
 */
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { getProducts, getCategories } from '../services/api';
import './SearchPage.css';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price_low', label: 'Price: Low → High' },
  { value: 'price_high', label: 'Price: High → Low' },
  { value: 'name', label: 'Name A–Z' },
  { value: 'discount', label: 'Best Discount' },
];

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQ = searchParams.get('q') || '';
  const initialFeatured = searchParams.get('featured') === 'true';

  const [query, setQuery] = useState(initialQ);
  const [inputValue, setInputValue] = useState(initialQ);
  const [sort, setSort] = useState('newest');
  const [categoryId, setCategoryId] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [featuredOnly, setFeaturedOnly] = useState(initialFeatured);
  const [page, setPage] = useState(1);

  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({});
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load categories once
  useEffect(() => {
    getCategories()
      .then((d) => setCategories(d.categories || []))
      .catch(() => {});
  }, []);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { sort, page, per_page: 12 };
      if (query) params.search = query;
      if (categoryId) params.category_id = categoryId;
      if (inStockOnly) params.in_stock = 'true';
      if (featuredOnly) params.featured = 'true';

      const data = await getProducts(params);
      setProducts(data.products || []);
      setMeta(data.meta || {});
    } catch (err) {
      setError(err.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  }, [query, sort, page, categoryId, inStockOnly, featuredOnly]);

  useEffect(() => {
    setPage(1);
  }, [query, sort, categoryId, inStockOnly, featuredOnly]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleSearch = (e) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    setQuery(trimmed);
    setSearchParams(trimmed ? { q: trimmed } : {});
    setPage(1);
  };

  return (
    <div className="search-page">
      <div className="container">
        <h1 className="search-page__title">
          {query ? `Results for "${query}"` : featuredOnly ? 'Featured Products' : 'All Products'}
        </h1>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-form__wrap">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="search"
              className="search-form__input"
              placeholder="Search for belts, perfumes, wallets..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              autoFocus={!inputValue}
              aria-label="Search products"
            />
          </div>
          <button type="submit" className="btn btn-primary">Search</button>
        </form>

        {/* Filters bar */}
        <div className="search-filters">
          <select
            className="search-filters__select"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="Sort by"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <select
            className="search-filters__select"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            aria-label="Filter by category"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <label className="search-filters__checkbox">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
            />
            In Stock Only
          </label>

          <label className="search-filters__checkbox">
            <input
              type="checkbox"
              checked={featuredOnly}
              onChange={(e) => setFeaturedOnly(e.target.checked)}
            />
            Featured Only
          </label>
        </div>

        {/* Results */}
        {error && <div className="search-error">⚠️ {error}</div>}

        {!loading && meta.total != null && (
          <p className="search-count">{meta.total} product{meta.total !== 1 ? 's' : ''} found</p>
        )}

        {loading ? (
          <div className="search-grid">
            {[...Array(8)].map((_, i) => <div key={i} className="product-skeleton" />)}
          </div>
        ) : products.length === 0 ? (
          <div className="search-empty">
            <p>No products found{query ? ` for "${query}"` : ''}.</p>
            <p>Try a different search term or <Link to="/">browse categories</Link>.</p>
          </div>
        ) : (
          <>
            <div className="search-grid">
              {products.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>

            {meta.pages > 1 && (
              <div className="cat-pagination">
                <button disabled={!meta.has_prev} onClick={() => setPage((p) => p - 1)} className="cat-pagination__btn">← Prev</button>
                <span className="cat-pagination__info">Page {meta.page} of {meta.pages}</span>
                <button disabled={!meta.has_next} onClick={() => setPage((p) => p + 1)} className="cat-pagination__btn">Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
