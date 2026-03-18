import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingBag, Wallet,
  User, LogOut, Menu, X, ChevronRight, Store
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

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-green-800 text-white z-30 flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        {/* Logo */}
        <div className="p-5 flex items-center justify-between border-b border-green-700">
          <div className="flex items-center gap-2">
            <Store size={24}/>
            <span className="font-bold text-lg">ZimMarket</span>
          </div>
          <button onClick={() => setOpen(false)} className="lg:hidden hover:text-green-300 transition">
            <X size={20}/>
          </button>
        </div>

        {/* Seller info */}
        <div className="px-5 py-4 border-b border-green-700">
          <p className="text-green-300 text-xs uppercase tracking-wide mb-1">Seller Portal</p>
          <p className="font-semibold truncate">{user?.seller?.businessName || user?.name}</p>
          <p className="text-green-300 text-xs truncate">{user?.phone}</p>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium text-sm
                ${isActive ? 'bg-white text-green-800 shadow' : 'text-green-100 hover:bg-green-700'}`
              }
            >
              <Icon size={18}/>
              <span className="flex-1">{label}</span>
              <ChevronRight size={14} className="opacity-40"/>
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-green-700">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-green-200 hover:bg-green-700 transition text-sm font-medium"
          >
            <LogOut size={18}/>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar (mobile) */}
        <header className="bg-white border-b px-4 py-3 flex items-center gap-3 lg:hidden sticky top-0 z-10 shadow-sm">
          <button
            onClick={() => setOpen(true)}
            className="text-gray-600 hover:text-green-700 transition p-1"
          >
            <Menu size={24}/>
          </button>
          <div className="flex items-center gap-2">
            <Store size={20} className="text-green-700"/>
            <span className="font-bold text-green-800">ZimMarket Seller</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <Outlet/>
        </main>
      </div>
    </div>
  );
}
