'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '../../store/auth';
import axios from 'axios';
import { Lock, Mail, AlertCircle, ArrowRight, UserPlus, Info } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

export default function Register() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  
  const initialRole = searchParams.get('role')?.toUpperCase() || 'BUYER';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(initialRole);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // If already logged in, redirect to correct dashboard
  useEffect(() => {
    if (user && user.role) {
      router.push(`/dashboard/${user.role.toLowerCase()}`);
    }
  }, [user, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || !role) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await axios.post(`${API_URL}/auth/register`, {
        email,
        password,
        role
      });
      
      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || 'Registration failed. Please check details and try again.');
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
            Create Your <span className="text-gradient">MerchHub Account</span>
          </h2>
          <p className="text-xs text-text-secondary mt-2">
            Join Sri Lanka's leading hub for creator merchandise.
          </p>
        </div>

        {/* Form panel */}
        <div className="glass-panel border border-white/5 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-brand-secondary/5 rounded-full blur-2xl pointer-events-none" />
          
          {success ? (
            <div className="flex flex-col items-center justify-center gap-4 text-center py-8">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-3xl">
                🎉
              </div>
              <h3 className="text-base font-bold text-white">Registration Successful!</h3>
              <p className="text-xs text-text-secondary max-w-xs leading-relaxed">
                Your account was created successfully. Redirecting you to the sign-in page to log in...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5 relative z-10">
              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3.5 rounded-2xl flex items-center gap-2.5 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Role Selection */}
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold uppercase tracking-wider text-text-secondary">Join As</label>
                <div className="grid grid-cols-3 gap-2">
                  {['BUYER', 'SELLER', 'ADMIN'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                        role === r
                          ? 'bg-brand-primary/15 border-brand-primary/30 text-brand-primary'
                          : 'bg-white/5 border-white/5 text-text-secondary hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {r.charAt(0) + r.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
                {role === 'SELLER' && (
                  <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-3 rounded-xl flex items-start gap-2.5 text-[10px] mt-1 leading-relaxed">
                    <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>Sellers require Admin approval before setting up shop profiles or listing products. You can log in as Admin afterward to approve it.</span>
                  </div>
                )}
                {role === 'ADMIN' && (
                  <div className="bg-brand-accent/10 border border-brand-accent/20 text-brand-accent p-3 rounded-xl flex items-start gap-2.5 text-[10px] mt-1 leading-relaxed">
                    <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>Registering as Admin directly is allowed for local development testing to review and approve seller profiles.</span>
                  </div>
                )}
              </div>

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
                {loading ? 'Registering...' : 'Sign Up'}
                {!loading && <UserPlus className="w-4 h-4" />}
              </button>
            </form>
          )}
        </div>

        {/* Footer info */}
        <div className="text-center text-xs text-text-secondary">
          Already have an account?{' '}
          <Link href="/login" className="text-brand-primary hover:text-brand-secondary font-semibold transition-colors">
            Sign in
          </Link>
        </div>

      </div>
    </div>
  );
}
