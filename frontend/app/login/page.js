'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/auth';
import axios from 'axios';
import { Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function Login() {
  const router = useRouter();
  const { user, login } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // If already logged in, redirect to correct dashboard
  useEffect(() => {
    if (user && user.role) {
      router.push(`/dashboard/${user.role.toLowerCase()}`);
    }
  }, [user, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      
      const { user: loggedInUser, token } = res.data;
      login(loggedInUser, token);
      
      // Redirect based on role
      router.push(`/dashboard/${(loggedInUser.role || 'buyer').toLowerCase()}`);
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full flex flex-col gap-8">
        
        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl font-black text-white tracking-tight">
            Welcome Back to <span className="text-gradient">MerchHub LK</span>
          </h2>
          <p className="text-xs text-text-secondary mt-2">
            Sign in to access your creator shop, orders, or profile.
          </p>
        </div>

        {/* Form panel */}
        <div className="glass-panel border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-brand-primary/5 rounded-full blur-2xl pointer-events-none" />
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-5 relative z-10">
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3.5 rounded-2xl flex items-center gap-2.5 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Email field */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 pl-12 text-sm text-white focus:outline-none focus:border-brand-primary"
                  required
                />
                <Mail className="absolute left-4 top-3.5 w-4 h-4 text-gray-500" />
              </div>
            </div>

            {/* Password field */}
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Password</label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3 pl-12 text-sm text-white focus:outline-none focus:border-brand-primary"
                  required
                />
                <Lock className="absolute left-4 top-3.5 w-4 h-4 text-gray-500" />
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-brand text-white text-xs font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 hover:opacity-95 shadow-lg shadow-brand-primary/25 transition-all mt-2 disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-text-secondary">
          Don't have an account?{' '}
          <Link href="/register" className="text-brand-primary hover:text-brand-secondary font-semibold transition-colors">
            Register now
          </Link>
        </div>

      </div>
    </div>
  );
}
