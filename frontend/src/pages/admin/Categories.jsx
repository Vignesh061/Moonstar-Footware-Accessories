/**
 * Admin Categories Page — Category CRUD management.
 */
import { useState, useEffect } from 'react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../services/adminApi';
import './Categories.css';

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', sort_order: 0, is_active: true });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => { loadCategories(); }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await getCategories({ show_inactive: 'true' });
      setCategories(data.categories || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setForm({ name: '', description: '', sort_order: 0, is_active: true });
    setEditMode(false);
    setEditId(null);
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (cat) => {
    setForm({
      name: cat.name,
      description: cat.description || '',
      sort_order: cat.sort_order || 0,
      is_active: cat.is_active,
    });
    setEditMode(true);
    setEditId(cat.id);
    setFormError('');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.name.trim()) return setFormError('Category name is required');

    setSaving(true);
    try {
      if (editMode && editId) {
        await updateCategory(editId, form);
      } else {
        await createCategory(form);
      }
      setShowModal(false);
      loadCategories();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteCategory(deleteId);
      setDeleteId(null);
      loadCategories();
    } catch (err) {
      alert(err.message);
      setDeleteId(null);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <div>
          <h1 className="admin-page__title">Categories</h1>
          <p className="admin-page__subtitle">{categories.length} categories</p>
        </div>
        <button className="admin-btn admin-btn--primary" onClick={openCreate}>+ Add Category</button>
      </div>

      <div className="admin-table-wrap">
        {loading ? (
          <div className="admin-loading">Loading categories...</div>
        ) : categories.length === 0 ? (
          <div className="admin-empty">
            <p>No categories yet.</p>
            <button className="admin-btn admin-btn--primary" onClick={openCreate}>Create your first category</button>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Products</th>
                <th>Order</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id} className={!c.is_active ? 'row-inactive' : ''}>
                  <td><span className="admin-table__name">{c.name}</span></td>
                  <td><code className="slug-code">{c.slug}</code></td>
                  <td>{c.product_count ?? 0}</td>
                  <td>{c.sort_order}</td>
                  <td>
                    <span className={`status-badge ${c.is_active ? 'status-badge--active' : 'status-badge--inactive'}`}>
                      {c.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="admin-table__actions">
                      <button className="action-btn" onClick={() => openEdit(c)} title="Edit">✏️</button>
                      <button className="action-btn" onClick={() => setDeleteId(c.id)} title="Delete">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal admin-modal--sm" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal__header">
              <h2>{editMode ? 'Edit Category' : 'Add Category'}</h2>
              <button className="admin-modal__close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave} className="admin-modal__body">
              {formError && <div className="admin-login__error">{formError}</div>}

              <div className="form-group">
                <label>Category Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required autoFocus />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea rows="2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Sort Order</label>
                  <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="form-group form-group--checkboxes">
                  <label className="checkbox-label">
                    <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                    Active
                  </label>
                </div>
              </div>

              <div className="admin-modal__footer">
                <button type="button" className="admin-btn admin-btn--secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
                  {saving ? 'Saving...' : editMode ? 'Update' : 'Create'}
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
            <div className="admin-modal__header"><h2>Deactivate Category</h2></div>
            <div className="admin-modal__body">
              <p>This will deactivate the category. Categories with active products cannot be deactivated.</p>
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
