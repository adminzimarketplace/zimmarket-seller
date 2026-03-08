// src/App.js
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { LayoutDashboard, Package, ShoppingCart, CreditCard, User, LogOut } from 'lucide-react';

// ─── API Client ──────────────────────────────────────────────────────────────
import axios from 'axios';
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';
const api = axios.create({ baseURL: API_BASE });
api.interceptors.request.use(config => {
  const token = localStorage.getItem('sellerToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(res => res, async err => {
  if (err.response?.status === 401) { localStorage.clear(); window.location.href = '/login'; }
  return Promise.reject(err);
});

// ─── Auth Context ─────────────────────────────────────────────────────────────
import { createContext, useContext, useState, useEffect } from 'react';
const AuthCtx = createContext();
const useAuth = () => useContext(AuthCtx);
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const s = localStorage.getItem('sellerUser');
    if (s) setUser(JSON.parse(s));
    setLoading(false);
  }, []);
  const login = async (phone, password) => {
    const { data } = await api.post('/auth/login', { phone, password });
    if (data.user.role !== 'SELLER') throw new Error('Not a seller account');
    localStorage.setItem('sellerToken', data.accessToken);
    localStorage.setItem('sellerUser', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };
  const logout = () => { localStorage.clear(); setUser(null); window.location.href = '/login'; };
  return <AuthCtx.Provider value={{ user, login, logout, loading }}>{children}</AuthCtx.Provider>;
};

// ─── Layout ───────────────────────────────────────────────────────────────────
const Layout = () => {
  const { user, logout } = useAuth();
  const { Outlet } = require('react-router-dom');
  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-60 bg-green-900 text-white flex flex-col shadow-xl">
        <div className="p-5 border-b border-green-700">
          <h1 className="text-lg font-bold">ZimMarket Pro</h1>
          <p className="text-green-300 text-xs mt-0.5">Seller Portal</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {[
            { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { to: '/products', icon: Package, label: 'My Products' },
            { to: '/orders', icon: ShoppingCart, label: 'Orders' },
            { to: '/payouts', icon: CreditCard, label: 'Payouts' },
            { to: '/profile', icon: User, label: 'Profile' },
          ].map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-green-700 text-white' : 'text-green-200 hover:bg-green-800'}`
            }>
              <Icon size={18} />{label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-green-700">
          <p className="text-sm font-medium text-white mb-1">{user?.seller?.businessName || user?.name}</p>
          <p className="text-xs text-green-300 mb-3">{user?.phone}</p>
          <button onClick={logout} className="flex items-center gap-2 text-green-300 hover:text-white text-sm">
            <LogOut size={16} />Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-6"><Outlet /></main>
    </div>
  );
};

// ─── Pages ────────────────────────────────────────────────────────────────────
import toast from 'react-hot-toast';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = require('react-router-dom').useNavigate();
  const [form, setForm] = useState({ phone: '', password: '' });
  const [loading, setLoading] = useState(false);
  const submit = async e => {
    e.preventDefault(); setLoading(true);
    try { await login(form.phone, form.password); navigate('/dashboard'); }
    catch (err) { toast.error(err.response?.data?.error || err.message || 'Login failed'); }
    finally { setLoading(false); }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 to-green-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-900">ZimMarket Pro</h1>
          <p className="text-gray-500 mt-1">Seller Portal</p>
        </div>
        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
              placeholder="+263771234567" required
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••" required
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-green-800 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-60">
            {loading ? 'Signing in...' : 'Sign In as Seller'}
          </button>
          <p className="text-center text-sm text-gray-500">
            Don't have an account? Contact ZimMarket Admin to register.
          </p>
        </form>
      </div>
    </div>
  );
};

const DashboardPage = () => {
  const [data, setData] = useState(null);
  useEffect(() => { api.get('/seller/dashboard').then(r => setData(r.data)).catch(console.error); }, []);
  if (!data) return <div className="text-gray-400 text-center py-20">Loading...</div>;
  const { stats, recentOrders } = data;
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Active Products', value: stats.activeProducts, color: 'bg-green-50 text-green-700' },
          { label: 'Pending Approval', value: stats.pendingProducts, color: 'bg-yellow-50 text-yellow-700' },
          { label: 'Total Earnings', value: `$${Number(stats.totalEarnings || 0).toFixed(2)}`, color: 'bg-blue-50 text-blue-700' },
          { label: 'Pending Payout', value: `$${Number(stats.pendingPayouts || 0).toFixed(2)}`, color: 'bg-orange-50 text-orange-700' },
        ].map(({ label, value, color }) => (
          <div key={label} className={`${color} rounded-xl p-5`}>
            <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Recent Orders</h3>
        <div className="space-y-3">
          {recentOrders?.map(item => (
            <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
              <div>
                <p className="font-medium">{item.product?.name}</p>
                <p className="text-xs text-gray-400">Qty: {item.qty} × ${item.unitPrice?.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">${item.subtotal?.toFixed(2)}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  item.order?.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                  item.order?.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                }`}>{item.order?.status?.replace(/_/g,' ')}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', price: '', stockQty: '', categoryId: '', images: [] });
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/seller/products').then(r => setProducts(r.data)).catch(console.error);
    api.get('/products/categories').then(r => setCategories(r.data)).catch(console.error);
  }, []);

  const addImage = () => {
    if (imageUrl.trim()) { setForm({ ...form, images: [...form.images, imageUrl.trim()] }); setImageUrl(''); }
  };

  const submit = async e => {
    e.preventDefault(); setLoading(true);
    try {
      await api.post('/products', form);
      toast.success('Product submitted for admin approval!');
      setShowForm(false);
      setForm({ name: '', description: '', price: '', stockQty: '', categoryId: '', images: [] });
      api.get('/seller/products').then(r => setProducts(r.data));
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  const updateStock = async (id, current) => {
    const qty = prompt(`New stock quantity (current: ${current}):`);
    if (!qty || isNaN(qty)) return;
    try { await api.put(`/products/${id}`, { stockQty: parseInt(qty) }); toast.success('Stock updated'); api.get('/seller/products').then(r => setProducts(r.data)); }
    catch { toast.error('Failed'); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">My Products</h2>
        <button onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-800">
          + Add Product
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">New Product</h3>
          <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: 'name', label: 'Product Name', type: 'text', required: true },
              { name: 'price', label: 'Price (USD)', type: 'number', step: '0.01', required: true },
              { name: 'stockQty', label: 'Stock Quantity', type: 'number', required: true },
            ].map(({ name, label, ...rest }) => (
              <div key={name}>
                <label className="text-xs text-gray-500 uppercase font-medium block mb-1">{label}</label>
                <input {...rest} value={form[name]} onChange={e => setForm({ ...form, [name]: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            ))}
            <div>
              <label className="text-xs text-gray-500 uppercase font-medium block mb-1">Category</label>
              <select value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                <option value="">Select category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-gray-500 uppercase font-medium block mb-1">Description</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                rows={3} required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-gray-500 uppercase font-medium block mb-1">Image URLs (paste Cloudinary/image links)</label>
              <div className="flex gap-2 mb-2">
                <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..."
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                <button type="button" onClick={addImage} className="px-3 py-2 bg-gray-100 rounded-lg text-sm">Add</button>
              </div>
              {form.images.map((url, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                  <img src={url} alt="" className="w-8 h-8 object-cover rounded" />
                  <span className="truncate">{url}</span>
                  <button type="button" onClick={() => setForm({ ...form, images: form.images.filter((_, j) => j !== i) })}
                    className="text-red-400 hover:text-red-600">✕</button>
                </div>
              ))}
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" disabled={loading}
                className="px-6 py-2 bg-green-700 text-white rounded-lg text-sm font-medium hover:bg-green-800 disabled:opacity-60">
                {loading ? 'Submitting...' : 'Submit for Approval'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="px-6 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {products.map(p => (
          <div key={p.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {p.images?.[0] && <img src={p.images[0]} alt={p.name} className="w-full h-36 object-cover" />}
            <div className="p-4">
              <div className="flex justify-between items-start mb-1">
                <h4 className="font-semibold text-gray-900">{p.name}</h4>
                <span className="text-green-700 font-bold">${p.price?.toFixed(2)}</span>
              </div>
              <p className="text-xs text-gray-400 mb-2">{p.category?.name || 'No category'}</p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Stock: <button onClick={() => updateStock(p.id, p.stockQty)} className="font-semibold text-blue-600 hover:underline">{p.stockQty} units</button></span>
                <span className={`px-2 py-0.5 rounded-full ${p.isApproved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {p.isApproved ? '✓ Live' : 'Pending approval'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const OrdersPage = () => {
  const [items, setItems] = useState([]);
  useEffect(() => { api.get('/seller/orders').then(r => setItems(r.data)).catch(console.error); }, []);
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Orders</h2>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 text-xs uppercase bg-gray-50">
              <th className="px-5 py-3">Order</th><th className="px-5 py-3">Product</th>
              <th className="px-5 py-3">Qty</th><th className="px-5 py-3">Value</th>
              <th className="px-5 py-3">Customer</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {items.length === 0 ? (
              <tr><td colSpan={7} className="py-10 text-center text-gray-400">No orders yet</td></tr>
            ) : items.map(item => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-5 py-4 font-mono font-semibold text-blue-700">#{item.order?.id?.slice(0,8).toUpperCase()}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    {item.product?.images?.[0] && <img src={item.product.images[0]} alt="" className="w-8 h-8 object-cover rounded" />}
                    <span className="font-medium">{item.product?.name}</span>
                  </div>
                </td>
                <td className="px-5 py-4">{item.qty}</td>
                <td className="px-5 py-4 font-semibold">${item.subtotal?.toFixed(2)}</td>
                <td className="px-5 py-4">
                  <p className="font-medium">{item.order?.customer?.name}</p>
                  <p className="text-xs text-gray-400">{item.order?.customer?.phone}</p>
                </td>
                <td className="px-5 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    item.order?.status === 'DELIVERED' ? 'bg-green-100 text-green-700' :
                    item.order?.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                  }`}>{item.order?.status?.replace(/_/g,' ')}</span>
                </td>
                <td className="px-5 py-4 text-gray-400 text-xs">{new Date(item.order?.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const PayoutsPage = () => {
  const [payouts, setPayouts] = useState([]);
  useEffect(() => { api.get('/seller/payouts').then(r => setPayouts(r.data)).catch(console.error); }, []);
  const pending = payouts.filter(p => p.status === 'PENDING').reduce((sum, p) => sum + p.netAmount, 0);
  const received = payouts.filter(p => p.status === 'SENT').reduce((sum, p) => sum + p.netAmount, 0);
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Payouts</h2>
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-orange-50 rounded-xl p-5"><p className="text-sm text-gray-500 mb-1">Pending Payout</p><p className="text-2xl font-bold text-orange-700">${pending.toFixed(2)}</p></div>
        <div className="bg-green-50 rounded-xl p-5"><p className="text-sm text-gray-500 mb-1">Total Received</p><p className="text-2xl font-bold text-green-700">${received.toFixed(2)}</p></div>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 text-xs uppercase bg-gray-50">
              <th className="px-5 py-3">Order</th><th className="px-5 py-3">Gross</th><th className="px-5 py-3">Commission</th><th className="px-5 py-3">Net</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Ref</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {payouts.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-5 py-4 font-mono text-blue-700">#{p.order?.id?.slice(0,8).toUpperCase()}</td>
                <td className="px-5 py-4">${p.grossAmount?.toFixed(2)}</td>
                <td className="px-5 py-4 text-red-500">-${p.commission?.toFixed(2)}</td>
                <td className="px-5 py-4 font-bold text-green-700">${p.netAmount?.toFixed(2)}</td>
                <td className="px-5 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.status === 'SENT' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {p.status}
                  </span>
                </td>
                <td className="px-5 py-4 font-mono text-xs text-gray-400">{p.reference || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ProfilePage = () => {
  const { user } = useAuth();
  const [form, setForm] = useState({ businessName: user?.seller?.businessName || '', location: user?.seller?.location || '', contactPhone: user?.seller?.contactPhone || user?.phone || '' });
  const [saving, setSaving] = useState(false);
  const save = async e => {
    e.preventDefault(); setSaving(true);
    try { await api.patch('/seller/profile', form); toast.success('Profile updated!'); }
    catch { toast.error('Failed'); }
    finally { setSaving(false); }
  };
  return (
    <div className="max-w-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Business Profile</h2>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <form onSubmit={save} className="space-y-4">
          {[
            { name: 'businessName', label: 'Business Name' },
            { name: 'location', label: 'Business Location (e.g. Harare CBD)' },
            { name: 'contactPhone', label: 'Contact Phone' },
          ].map(({ name, label }) => (
            <div key={name}>
              <label className="text-xs text-gray-500 uppercase font-medium block mb-1">{label}</label>
              <input value={form[name]} onChange={e => setForm({ ...form, [name]: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            </div>
          ))}
          <button type="submit" disabled={saving}
            className="w-full bg-green-700 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-green-800 disabled:opacity-60">
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
        <div className="mt-4 pt-4 border-t border-gray-100 text-sm text-gray-500">
          <p>Account phone: <strong>{user?.phone}</strong></p>
          <p>Status: <span className={user?.seller?.isApproved ? 'text-green-600 font-medium' : 'text-yellow-600 font-medium'}>{user?.seller?.isApproved ? 'Approved' : 'Pending Admin Approval'}</span></p>
          <p>Commission rate: <strong>{user?.seller?.commissionRate}%</strong></p>
        </div>
      </div>
    </div>
  );
};

// ─── Protected Route ──────────────────────────────────────────────────────────
const Protected = ({ children }) => {
  const { user, loading } = useAuth();
  const { Navigate } = require('react-router-dom');
  if (loading) return <div className="flex items-center justify-center h-screen text-gray-400">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Protected><Layout /></Protected>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="payouts" element={<PayoutsPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
