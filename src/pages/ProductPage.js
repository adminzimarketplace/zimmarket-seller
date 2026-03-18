import React, { useEffect, useState, useRef } from 'react';
import { Plus, Pencil, Trash2, X, Upload, Image, CheckCircle, Clock, XCircle } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const STATUS = {
  approved:  { label: 'Live',     color: 'bg-green-100 text-green-700',  icon: CheckCircle },
  pending:   { label: 'Pending',  color: 'bg-yellow-100 text-yellow-700', icon: Clock       },
  rejected:  { label: 'Rejected', color: 'bg-red-100 text-red-700',      icon: XCircle     },
};

const EMPTY = { name: '', description: '', price: '', stockQty: '', categoryId: '', images: [] };

export default function ProductsPage() {
  const [products, setProducts]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [editing, setEditing]       = useState(null); // product being edited
  const [form, setForm]             = useState(EMPTY);
  const [saving, setSaving]         = useState(false);
  const [uploading, setUploading]   = useState(false);
  const fileRef = useRef();

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/seller/products'),
      api.get('/products/categories'),
    ]).then(([p, c]) => {
      setProducts(p.data);
      setCategories(c.data);
    }).catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY);
    setShowForm(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({
      name:        p.name,
      description: p.description,
      price:       p.price,
      stockQty:    p.stockQty,
      categoryId:  p.categoryId || '',
      images:      p.images || [],
    });
    setShowForm(true);
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    if (form.images.length + files.length > 5) return toast.error('Maximum 5 images');
    setUploading(true);
    try {
      const uploads = await Promise.all(files.map(async (file) => {
        const fd = new FormData();
        fd.append('image', file);
        const { data } = await api.post('/upload/image', fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        return data.url;
      }));
      setForm(f => ({ ...f, images: [...f.images, ...uploads] }));
      toast.success('Images uploaded!');
    } catch {
      toast.error('Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (idx) => {
    setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));
  };

  const handleSave = async () => {
    if (!form.name || !form.price || !form.stockQty) return toast.error('Fill in name, price and stock');
    setSaving(true);
    try {
      if (editing) {
        await api.put('/products/' + editing.id, {
          ...form,
          price:    parseFloat(form.price),
          stockQty: parseInt(form.stockQty),
        });
        toast.success('Product updated!');
      } else {
        await api.post('/products', {
          ...form,
          price:    parseFloat(form.price),
          stockQty: parseInt(form.stockQty),
        });
        toast.success('Product submitted for approval!');
      }
      setShowForm(false);
      load();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this product?')) return;
    try {
      await api.delete('/products/' + id);
      toast.success('Product removed');
      load();
    } catch {
      toast.error('Failed to remove');
    }
  };

  const getStatus = (p) => {
    if (!p.isActive) return STATUS.rejected;
    if (p.isApproved) return STATUS.approved;
    return STATUS.pending;
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">My Products</h1>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-green-700 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-green-600 transition text-sm"
        >
          <Plus size={18}/> Add Product
        </button>
      </div>

      {/* Products list */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-xl h-32 animate-pulse shadow"/>)}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-xl font-semibold text-gray-700">No products yet</h3>
          <p className="text-gray-400 mt-2 mb-6">Add your first product to start selling</p>
          <button onClick={openNew} className="bg-green-700 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-600 transition">
            Add Product
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {products.map(p => {
            const st = getStatus(p);
            const Icon = st.icon;
            return (
              <div key={p.id} className="bg-white rounded-xl shadow p-4 flex gap-4">
                {/* Image */}
                <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                  {p.images?.[0]
                    ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover"/>
                    : <Image size={28} className="text-gray-300"/>}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-gray-800 truncate">{p.name}</h3>
                    <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${st.color}`}>
                      <Icon size={11}/>{st.label}
                    </span>
                  </div>
                  <p className="text-green-700 font-bold mt-1">${parseFloat(p.price).toFixed(2)}</p>
                  <p className="text-xs text-gray-400">Stock: {p.stockQty} · {p.category?.name || 'Uncategorised'}</p>
                  {/* Actions — allow edit even if pending */}
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => openEdit(p)}
                      className="flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition font-medium"
                    >
                      <Pencil size={12}/> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="flex items-center gap-1 text-xs bg-red-50 text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-100 transition font-medium"
                    >
                      <Trash2 size={12}/> Remove
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
          <div className="bg-white w-full md:max-w-lg md:rounded-2xl rounded-t-2xl max-h-[92vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white rounded-t-2xl">
              <h2 className="text-lg font-bold text-gray-800">
                {editing ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 transition">
                <X size={22}/>
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Image upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Images ({form.images.length}/5)
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {form.images.map((url, i) => (
                    <div key={i} className="relative w-20 h-20">
                      <img src={url} alt="" className="w-full h-full object-cover rounded-lg border"/>
                      <button
                        onClick={() => removeImage(i)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center shadow"
                      >
                        <X size={10}/>
                      </button>
                    </div>
                  ))}
                  {form.images.length < 5 && (
                    <button
                      onClick={() => fileRef.current.click()}
                      disabled={uploading}
                      className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-green-500 transition text-gray-400 hover:text-green-500"
                    >
                      {uploading ? <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin"/> : <><Upload size={18}/><span className="text-xs mt-1">Upload</span></>}
                    </button>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <p className="text-xs text-gray-400">Tap the + button to upload photos from your phone. Max 5 images, 5MB each.</p>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Fresh Tomatoes 1kg"
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Describe your product..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm resize-none"
                />
              </div>

              {/* Price & Stock */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (USD) *</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock Qty *</label>
                  <input
                    type="number"
                    value={form.stockQty}
                    onChange={e => setForm(f => ({ ...f, stockQty: e.target.value }))}
                    placeholder="0"
                    min="0"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={form.categoryId}
                  onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                >
                  <option value="">Select category...</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              {editing && !editing.isApproved && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-700">
                  ⏳ This product is pending approval. You can still edit it before the admin reviews it.
                </div>
              )}

              {/* Save button */}
              <button
                onClick={handleSave}
                disabled={saving || uploading}
                className="w-full bg-green-700 text-white py-3 rounded-xl font-semibold hover:bg-green-600 disabled:opacity-50 transition"
              >
                {saving ? 'Saving...' : editing ? 'Save Changes' : 'Submit for Approval'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
