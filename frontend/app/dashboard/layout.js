'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '../../store/auth';
import Link from 'next/link';
import { User, ShieldAlert, LogOut, ArrowLeft, Home, ShoppingBag, Store, ClipboardList, LayoutDashboard } from 'lucide-react';

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Redirect if not authenticated
    if (mounted && !user) {
      router.push('/login');
    }
  }, [user, router, mounted]);

  if (!mounted || !user) {
    return (
      <div className="flex-1 flex items-center justify-center py-20 text-xs text-text-secondary animate-pulse">
        Authenticating...
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const getSidebarLinks = () => {
    if (user.role === 'ADMIN') {
      return [
        { name: 'Sellers', href: '/dashboard/admin', icon: User },
        { name: 'Categories', href: '/dashboard/admin', icon: Store }
      ];
    } else if (user.role === 'SELLER') {
      return [
        { name: 'Shop Profile', href: '/dashboard/seller', icon: Store },
        { name: 'Products', href: '/dashboard/seller', icon: ShoppingBag },
        { name: 'Orders', href: '/dashboard/seller', icon: ClipboardList }
      ];
    } else {
      return [
        { name: 'Orders History', href: '/dashboard/buyer', icon: ClipboardList }
      ];
    }
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-8 w-full py-4">
      {/* Sidebar Panel */}
      <aside className="lg:w-64 w-full shrink-0 flex flex-col gap-6">
        <div className="glass-panel border border-white/5 rounded-3xl p-6 flex flex-col gap-6">
          
          {/* User brief */}
          <div className="flex items-center gap-3 border-b border-white/5 pb-5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-brand flex items-center justify-center text-xs font-bold text-white uppercase shadow-md">
              {(user?.email || '').substring(0, 2)}
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-white truncate max-w-[140px]">{user?.email || 'User'}</h4>
              <p className="text-[10px] text-brand-primary uppercase tracking-widest font-black mt-0.5">{user.role}</p>
            </div>
          </div>

          {/* Navigation link group */}
          <div className="flex flex-col gap-2">
            <Link
              href="/"
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-text-secondary hover:text-white hover:bg-white/5 transition-all"
            >
              <Home className="w-4 h-4" />
              Back to Marketplace
            </Link>

            <div className="border-t border-white/5 my-2" />

            {getSidebarLinks().map((link, idx) => {
              const Icon = link.icon;
              return (
                <Link
                  key={idx}
                  href={link.href}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    pathname === link.href
                      ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20'
                      : 'text-text-secondary hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.name}
                </Link>
              );
            })}
          </div>

          {/* Logout Action */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-transparent transition-all mt-auto cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>

        </div>
      </aside>

      {/* Workspace Panel */}
      <main className="flex-1 min-w-0">
        <div className="glass-panel border border-white/5 rounded-3xl p-6 md:p-8 h-full min-h-[60vh] flex flex-col">
          {children}
        </div>
      </main>
    </div>
  );
}
