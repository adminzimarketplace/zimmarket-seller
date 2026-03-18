import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingBag,
  Wallet, User, LogOut, Menu, X, Store
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/products',  icon: Package,         label: 'My Products' },
  { to: '/orders',    icon: ShoppingBag,     label: 'My Orders'   },
  { to: '/payouts',   icon: Wallet,          label: 'Payouts'     },
  { to: '/profile',   icon: User,            label: 'Profile'     },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* Dark overlay — tapping it closes the menu */}
      {open && (
        <div
          className="fixed inset-0 z-20"
          style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
          onClick={close}
        />
      )}

      {/* Sidebar */}
      <aside
        style={{
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease',
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100%',
          width: '260px',
          zIndex: 30,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#166534',
          color: 'white',
        }}
        className="lg:static lg:translate-x-0 lg:flex"
      >
        {/* Logo row */}
        <div style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #14532d' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Store size={22} />
            <span style={{ fontWeight: 'bold', fontSize: '18px' }}>ZimMarket</span>
          </div>
          <button onClick={close} style={{ color: '#bbf7d0', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
            <X size={22} />
          </button>
        </div>

        {/* Seller info */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #14532d' }}>
          <p style={{ color: '#86efac', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Seller Portal</p>
          <p style={{ fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.seller?.businessName || user?.name}
          </p>
          <p style={{ color: '#86efac', fontSize: '12px' }}>{user?.phone}</p>
        </div>

        {/* Nav links */}
        <nav style={{ flex: 1, padding: '12px', overflowY: 'auto' }}>
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={close}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '12px',
                marginBottom: '4px',
                fontWeight: '500',
                fontSize: '14px',
                textDecoration: 'none',
                backgroundColor: isActive ? 'white' : 'transparent',
                color: isActive ? '#166534' : '#dcfce7',
              })}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div style={{ padding: '16px', borderTop: '1px solid #14532d' }}>
          <button
            onClick={logout}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '12px', color: '#86efac', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Top bar — mobile only */}
        <header style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px', position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <button
            onClick={() => setOpen(true)}
            style={{ color: '#374151', background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
          >
            <Menu size={26} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Store size={20} color="#166534" />
            <span style={{ fontWeight: 'bold', color: '#166534' }}>ZimMarket Seller</span>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
