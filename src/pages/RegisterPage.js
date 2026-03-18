import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Store } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: '', phone: '', email: '', password: '', confirmPassword: '',
    businessName: '', location: '', contactPhone: '',
  });
  const [otp, setOtp] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleRegister = async () => {
    if (!form.name || !form.phone || !form.password || !form.businessName || !form.location) {
      return toast.error('Please fill in all required fields');
    }
    if (form.password !== form.confirmPassword) return toast.error('Passwords do not match');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');

    setLoading(true);
    try {
      await api.post('/auth/register', {
        name:         form.name,
        phone:        form.phone,
        email:        form.email || undefined,
        password:     form.password,
        role:         'SELLER',
        businessName: form.businessName,
        location:     form.location,
        contactPhone: form.contactPhone || form.phone,
      });
      toast.success('Account created! Enter the OTP sent to your phone.');
      setStep(2);
    } catch (e) {
      toast.error(e.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!otp) return toast.error('Enter the OTP code');
    setLoading(true);
    try {
      await api.post('/auth/otp/verify', { phone: form.phone, otp });
      toast.success('Phone verified! Your account is pending admin approval.');
      navigate('/login');
    } catch (e) {
      toast.error(e.response?.data?.error || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-green-700 px-6 py-8 text-white text-center">
          <div className="w-14 h-14 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Store size={28}/>
          </div>
          <h1 className="text-2xl font-bold">Become a Seller</h1>
          <p className="text-green-200 text-sm mt-1">
            {step === 1 ? 'Fill in your details to apply' : 'Verify your phone number'}
          </p>
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 1 ? 'bg-white text-green-700' : 'bg-green-600 text-white'}`}>1</div>
            <div className={`w-8 h-0.5 ${step >= 2 ? 'bg-white' : 'bg-green-600'}`}/>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 2 ? 'bg-white text-green-700' : 'bg-green-600 text-white'}`}>2</div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {step === 1 ? (
            <>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Personal Details</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Tendai Moyo" className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+263771234567" className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email (optional)</label>
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="your@gmail.com" className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <input type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="At least 6 characters" className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                <input type="password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} placeholder="Repeat password" className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"/>
              </div>

              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider pt-2">Business Details</p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business / Shop Name *</label>
                <input type="text" value={form.businessName} onChange={e => set('businessName', e.target.value)} placeholder="e.g. Moyo Fresh Produce" className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location / Area *</label>
                <input type="text" value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g. Harare CBD, Market Square" className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"/>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Phone (if different)</label>
                <input type="tel" value={form.contactPhone} onChange={e => set('contactPhone', e.target.value)} placeholder="Leave blank to use same number" className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"/>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-xs text-yellow-700">
                ⏳ After signing up, the admin will review your application and approve your account before you can start selling.
              </div>

              <button onClick={handleRegister} disabled={loading} className="w-full bg-green-700 text-white py-3 rounded-xl font-semibold hover:bg-green-600 disabled:opacity-50 transition">
                {loading ? 'Submitting...' : 'Submit Application'}
              </button>
              <p className="text-center text-sm text-gray-500">
                Already have an account? <Link to="/login" className="text-green-700 font-semibold hover:underline">Log In</Link>
              </p>
            </>
          ) : (
            <>
              <div className="text-center py-2">
                <div className="text-4xl mb-2">📱</div>
                <p className="text-gray-600 text-sm">We sent a 6-digit code to <strong>{form.phone}</strong></p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">OTP Code</label>
                <input
                  type="number"
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  className="w-full border rounded-xl px-4 py-3 text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <button onClick={handleVerify} disabled={loading} className="w-full bg-green-700 text-white py-3 rounded-xl font-semibold hover:bg-green-600 disabled:opacity-50 transition">
                {loading ? 'Verifying...' : 'Verify Phone'}
              </button>
              <button onClick={() => setStep(1)} className="w-full text-gray-400 text-sm hover:underline">Go back</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
