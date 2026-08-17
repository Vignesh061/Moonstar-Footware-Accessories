/**
 * Admin Products Page — Full product CRUD with image upload and flexible attributes.
 * Only admins can create, edit, delete products.
 */
import { useState, useEffect, useRef } from 'react';
import {
  getProducts, getProduct, createProduct, updateProduct, deleteProduct,
  uploadProductImage, deleteProductImage, getCategories
} from '../../services/adminApi';
import './Products.css';

const EMPTY_FORM = {
  name: '', description: '', price: '', original_price: '',
  category_id: '', brand: '', stock: '0', is_active: true, is_featured: false,
  attributes: [],
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({});
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const [editProductId, setEditProductId] = useState(null);
  const [editImages, setEditImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, [page, search]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const params = { page, per_page: 20, show_inactive: 'true' };
      if (search) params.search = search;
      const data = await getProducts(params);
      setProducts(data.products);
      setMeta(data.meta);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await getCategories({ show_inactive: 'true' });
      setCategories(data.categories || []);
    } catch { /* ignore */ }
  };

  const openCreate = () => {
    setForm({ ...EMPTY_FORM });
    setEditMode(false);
    setEditProductId(null);
    setEditImages([]);
    setFormError('');
    setShowModal(true);
  };

  const openEdit = async (productId) => {
    try {
      const data = await getProduct(productId);
      const p = data.product;
      setForm({
        name: p.name,
        description: p.description || '',
        price: String(p.price),
        original_price: p.original_price ? String(p.original_price) : '',
        category_id: p.category_id || '',
        brand: p.brand || '',
        stock: String(p.stock),
        is_active: p.is_active,
        is_featured: p.is_featured,
        attributes: p.attributes || [],
      });
      setEditProductId(productId);
      setEditImages(p.images || []);
      setEditMode(true);
      setFormError('');
      setShowModal(true);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.name.trim()) return setFormError('Product name is required');
    if (!form.price || isNaN(form.price)) return setFormError('Valid price is required');

    setSaving(true);
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        original_price: form.original_price ? parseFloat(form.original_price) : null,
        stock: parseInt(form.stock) || 0,
        category_id: form.category_id || null,
        brand: form.brand.trim() || null,
        // Filter out incomplete attributes
        attributes: form.attributes.filter(
          (a) => a.attribute_name?.trim() && a.attribute_value?.trim()
        ),
      };

      if (editMode && editProductId) {
        await updateProduct(editProductId, payload);
        await loadProducts();
      } else {
        const data = await createProduct(payload);
        setEditProductId(data.product.id);
        setEditMode(true);
        await loadProducts();
      }
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteProduct(deleteId);
      setDeleteId(null);
      loadProducts();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !editProductId) return;
    setUploading(true);
    try {
      const data = await uploadProductImage(editProductId, file, editImages.length === 0);
      setEditImages([...editImages, data.image]);
      // Refresh the product table so the thumbnail appears immediately
      await loadProducts();
    } catch (err) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleImageDelete = async (imageId) => {
    if (!editProductId) return;
    try {
      await deleteProductImage(editProductId, imageId);
      setEditImages(editImages.filter((img) => img.id !== imageId));
      // Refresh table so the thumbnail updates
      await loadProducts();
    } catch (err) {
      alert(err.message);
    }
  };

  // Attribute management
  const addAttribute = () => {
    setForm({ ...form, attributes: [...form.attributes, { attribute_name: '', attribute_value: '' }] });
  };

  const updateAttribute = (index, field, value) => {
    const updated = [...form.attributes];
    updated[index] = { ...updated[index], [field]: value };
    setForm({ ...form, attributes: updated });
  };

  const removeAttribute = (index) => {
    setForm({ ...form, attributes: form.attributes.filter((_, i) => i !== index) });
  };

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div>
          <h1 className="admin-page__title">Products</h1>
          <p className="admin-page__subtitle">{meta.total || 0} total products</p>
        </div>
        <button className="admin-btn admin-btn--primary" onClick={openCreate}>+ Add Product</button>
      </div>

      <div className="admin-toolbar">
        <input
          type="text"
          className="admin-search"
          placeholder="Search products..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      <div className="admin-table-wrap">
        {loading ? (
          <div className="admin-loading">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="admin-empty">
            <p>No products found.</p>
            <button className="admin-btn admin-btn--primary" onClick={openCreate}>Add your first product</button>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Category</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className={!p.is_active ? 'row-inactive' : ''}>
                  <td>
                    <div className="admin-table__img" style={{ backgroundImage: p.image ? `url(${p.image})` : 'none' }}>
                      {!p.image && '📷'}
                    </div>
                  </td>
                  <td>
                    <span className="admin-table__name">{p.name}</span>
                    {p.brand && <span style={{ display: 'block', fontSize: '0.72rem', color: '#888' }}>{p.brand}</span>}
                    {p.is_featured && <span className="featured-tag">⭐</span>}
                  </td>
                  <td>
                    <span className="admin-table__price">₹{p.price}</span>
                    {p.original_price && <span className="admin-table__original">₹{p.original_price}</span>}
                    {p.discount_percent > 0 && <span className="admin-table__discount">{p.discount_percent}% off</span>}
                  </td>
                  <td>
                    <span className={`stock-badge ${p.stock === 0 ? 'stock-badge--out' : p.stock < 10 ? 'stock-badge--low' : 'stock-badge--ok'}`}>
                      {p.stock}
                    </span>
                  </td>
                  <td>{categories.find((c) => c.id === p.category_id)?.name || '—'}</td>
                  <td>
                    <span className={`status-badge ${p.is_active ? 'status-badge--active' : 'status-badge--inactive'}`}>
                      {p.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="admin-table__actions">
                      <button className="action-btn" onClick={() => openEdit(p.id)} title="Edit">✏️</button>
                      <button className="action-btn" onClick={() => setDeleteId(p.id)} title="Delete">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {meta.pages > 1 && (
        <div className="admin-pagination">
          <button disabled={!meta.has_prev} onClick={() => setPage(page - 1)}>← Prev</button>
          <span>Page {meta.page} of {meta.pages}</span>
          <button disabled={!meta.has_next} onClick={() => setPage(page + 1)}>Next →</button>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h2>{editMode ? 'Edit Product' : 'Add Product'}</h2>
              <button className="admin-modal__close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSave} className="admin-modal__body">
              {formError && <div className="admin-login__error">{formError}</div>}

              {/* Basic Info */}
              <div className="form-row">
                <div className="form-group">
                  <label>Product Name *</label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Brand</label>
                  <input type="text" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="e.g. XYZ Brand" />
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea rows="3" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>

              <div className="form-row form-row--3">
                <div className="form-group">
                  <label>Selling Price (₹) *</label>
                  <input type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Original Price (₹)</label>
                  <input type="number" step="0.01" min="0" value={form.original_price} onChange={(e) => setForm({ ...form, original_price: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Stock</label>
                  <input type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                    <option value="">— No Category —</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group form-group--checkboxes">
                  <label className="checkbox-label">
                    <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                    Active
                  </label>
                  <label className="checkbox-label">
                    <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} />
                    Featured
                  </label>
                </div>
              </div>

              {/* Flexible Attributes */}
              <div className="form-section">
                <div className="form-section__header">
                  <label>Product Attributes</label>
                  <button type="button" className="admin-btn admin-btn--sm" onClick={addAttribute}>+ Add Attribute</button>
                </div>
                <p style={{ fontSize: '0.75rem', color: '#888', marginBottom: 8 }}>
                  e.g. Color = Black, Size = 32, Material = Leather, Volume = 100ml
                </p>
                {form.attributes.map((attr, i) => (
                  <div key={i} className="variant-row">
                    <input
                      type="text"
                      placeholder="Attribute Name (e.g. Color)"
                      value={attr.attribute_name}
                      onChange={(e) => updateAttribute(i, 'attribute_name', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Value (e.g. Black)"
                      value={attr.attribute_value}
                      onChange={(e) => updateAttribute(i, 'attribute_value', e.target.value)}
                    />
                    <button type="button" className="variant-remove" onClick={() => removeAttribute(i)}>✕</button>
                  </div>
                ))}
                {form.attributes.length === 0 && (
                  <p style={{ fontSize: '0.78rem', color: '#bbb' }}>No attributes. Click "+ Add Attribute" to add.</p>
                )}
              </div>

              {/* Image Upload (edit mode only) */}
              {editMode && editProductId && (
                <div className="form-section">
                  <label>Product Images</label>
                  <div className="image-gallery">
                    {editImages.map((img) => (
                      <div key={img.id} className="image-gallery__item">
                        <img src={img.image_url} alt={img.alt_text || 'Product'} />
                        {img.is_primary && <span className="image-gallery__primary">Primary</span>}
                        <button className="image-gallery__delete" onClick={() => handleImageDelete(img.id)}>✕</button>
                      </div>
                    ))}
                    <div className="image-gallery__upload" onClick={() => fileRef.current?.click()}>
                      {uploading ? '⏳' : '+ Upload'}
                    </div>
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
                </div>
              )}

              {!editMode && (
                <div style={{ padding: '10px 12px', background: '#f8f8f8', borderRadius: 8, fontSize: '0.78rem', color: '#888' }}>
                  💡 After creating the product, you can upload images in edit mode.
                </div>
              )}

              <div className="admin-modal__footer">
                <button type="button" className="admin-btn admin-btn--secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
                  {saving ? 'Saving...' : editMode ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteId && (
        <div className="admin-modal-overlay" onClick={() => setDeleteId(null)}>
          <div className="admin-modal admin-modal--sm" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header"><h2>Confirm Delete</h2></div>
            <div className="admin-modal__body">
              <p>This will deactivate the product and hide it from customers.</p>
            </div>
            <div className="admin-modal__footer">
              <button className="admin-btn admin-btn--secondary" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="admin-btn admin-btn--danger" onClick={handleDelete}>Deactivate</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
