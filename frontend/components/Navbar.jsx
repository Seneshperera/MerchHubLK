'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/auth';
import { useCartStore } from '../store/cart';
import { ShoppingCart, User, LogOut, Search, Menu, X, ChevronDown, LayoutDashboard } from 'lucide-react';

export default function Navbar() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { getItemCount } = useCartStore();
  
  const [mounted, setMounted] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Avoid hydration mismatch by rendering client auth/cart details after mounting
  useEffect(() => {
    setMounted(true);
    setCartCount(getItemCount());
  }, [getItemCount]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/');
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
    setDropdownOpen(false);
  };

  const getDashboardLink = () => {
    if (!user || !user.role) return '/login';
    return `/dashboard/${user.role.toLowerCase()}`;
  };


  return (
    <nav className="sticky top-0 z-50 w-full glass-panel border-b border-white/5 py-4 px-6 md:px-12 flex items-center justify-between">
      {/* Brand Logo */}
      <Link href="/" className="flex items-center gap-2">
        <span className="text-xl font-extrabold tracking-wider text-gradient">
          MERCHHUB<span className="text-white">.LK</span>
        </span>
      </Link>

      {/* Search Bar - Desktop */}
      <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center relative w-1/3 max-w-md">
        <input
          type="text"
          placeholder="Search unique creator merch..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-full px-5 py-2 pl-12 text-sm text-white focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all placeholder:text-gray-500"
        />
        <Search className="absolute left-4 w-4 h-4 text-gray-500" />
      </form>

      {/* Navigation Actions - Desktop */}
      <div className="hidden md:flex items-center gap-6">
        <Link href="/" className="text-sm font-medium hover:text-brand-primary transition-colors">
          Home
        </Link>
        <Link href="/browse" className="text-sm font-medium hover:text-brand-primary transition-colors">
          Browse
        </Link>
        <Link href="/track-order" className="text-sm font-medium hover:text-brand-primary transition-colors">
          Track Order
        </Link>

        {/* Cart */}
        <Link href="/cart" className="relative p-2 hover:bg-white/5 rounded-full transition-colors">
          <ShoppingCart className="w-5 h-5 text-gray-300 hover:text-white" />
          {mounted && cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-brand-secondary text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
              {cartCount}
            </span>
          )}
        </Link>

        {/* User Account Dropdown */}
        {mounted && user ? (
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 transition-all"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-brand flex items-center justify-center text-[11px] font-bold text-white uppercase">
                {(user?.email || '').substring(0, 2)}
              </div>
              <span className="text-xs text-white max-w-[100px] truncate">{user?.email || 'User'}</span>

              <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-bg-card border border-border-card shadow-2xl p-2 z-50">
                <div className="px-3 py-2 border-b border-white/5 mb-1">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">{user.role}</p>
                  <p className="text-xs text-white font-medium truncate">{user?.email || 'User'}</p>
                </div>
                <Link
                  href={getDashboardLink()}
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4 text-brand-primary" />
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors mt-1"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-xs font-semibold px-4 py-2 hover:text-white transition-colors">
              Log In
            </Link>
            <Link href="/register" className="text-xs font-semibold px-4 py-2 rounded-full bg-gradient-brand text-white hover:opacity-95 shadow-md shadow-brand-primary/20 transition-all">
              Sign Up
            </Link>
          </div>
        )}
      </div>

      {/* Mobile Menu Actions */}
      <div className="flex md:hidden items-center gap-4">
        {/* Cart */}
        <Link href="/cart" className="relative p-2 hover:bg-white/5 rounded-full transition-colors">
          <ShoppingCart className="w-5 h-5 text-gray-300" />
          {mounted && cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-brand-secondary text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 hover:bg-white/5 rounded-full"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="absolute top-[73px] left-0 w-full glass-panel border-b border-white/5 p-6 md:hidden flex flex-col gap-6 z-40 animate-in slide-in-from-top duration-300">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <input
              type="text"
              placeholder="Search unique creator merch..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-full px-5 py-2.5 pl-12 text-sm text-white focus:outline-none focus:border-brand-primary focus:ring-1"
            />
            <Search className="absolute left-4 top-3.5 w-4 h-4 text-gray-500" />
          </form>

          <div className="flex flex-col gap-4">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium py-1 hover:text-brand-primary border-b border-white/5"
            >
              Home
            </Link>
            <Link
              href="/browse"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium py-1 hover:text-brand-primary border-b border-white/5"
            >
              Browse Products
            </Link>
            <Link
              href="/track-order"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium py-1 hover:text-brand-primary border-b border-white/5"
            >
              Track Order
            </Link>

            {mounted && user ? (
              <>
                <Link
                  href={getDashboardLink()}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm font-medium py-1 text-brand-primary border-b border-white/5 flex items-center gap-2"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard ({user.role})
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-sm font-medium py-1 text-rose-400 text-left flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-3 mt-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center text-sm font-semibold py-2.5 border border-white/10 rounded-full hover:bg-white/5"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center text-sm font-semibold py-2.5 rounded-full bg-gradient-brand text-white"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
