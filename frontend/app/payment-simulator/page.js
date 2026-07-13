'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/auth';
import axios from 'axios';
import { CreditCard, ShieldCheck, Lock, AlertCircle, Sparkles } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

export default function PaymentSimulator() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const { user, token } = useAuthStore();

  const [order, setOrder] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(''); // 'SUCCESS', 'FAILED', ''
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token || !user) {
      router.push('/login');
      return;
    }
    if (!orderId) {
      setError('Missing order identifier.');
      setLoadingOrder(false);
      return;
    }
    fetchOrderDetails();
  }, [orderId, token]);

  const fetchOrderDetails = async () => {
    setLoadingOrder(true);
    try {
      const res = await axios.get(`${API_URL}/orders/buyer`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const matched = res.data.find(o => o.id === orderId);
      if (matched) {
        setOrder(matched);
      } else {
        setError('Order could not be fetched or does not belong to you.');
      }
    } catch (err) {
      console.error('Error fetching order details:', err);
      setError('Failed to load order information.');
    } finally {
      setLoadingOrder(false);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!cardName || !cardNumber || !expiry || !cvv) {
      alert('Please fill in all credit card details.');
      return;
    }

    setPaymentLoading(true);
    try {
      const txnId = 'TXN-' + Math.random().toString(36).substr(2, 9).toUpperCase();
      const res = await axios.post(`${API_URL}/payments/stripe/confirm`, {
        orderId: order.id,
        transactionId: txnId,
        status: 'SUCCESS'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setPaymentStatus('SUCCESS');
      setTimeout(() => {
        router.push(`/dashboard/buyer`);
      }, 3000);
    } catch (err) {
      console.error('Confirm payment error:', err);
      setError(err.response?.data?.message || 'Payment processing failed.');
      setPaymentStatus('FAILED');
    } finally {
      setPaymentLoading(false);
    }
  };

  if (loadingOrder) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 text-center text-xs text-text-secondary animate-pulse">
        Connecting to Secure Stripe Gateway...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full glass-panel border border-white/5 rounded-3xl p-8 text-center flex flex-col items-center gap-4">
          <AlertCircle className="w-12 h-12 text-rose-400" />
          <h2 className="text-lg font-bold text-white">Gateway Error</h2>
          <p className="text-xs text-text-secondary">{error}</p>
          <button onClick={() => router.push('/')} className="w-full py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold text-white rounded-xl">
            Return Home
          </button>
        </div>
      </div>
    );
  }

  if (paymentStatus === 'SUCCESS') {
    return (
      <div className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full glass-panel border border-white/5 rounded-3xl p-8 text-center flex flex-col items-center gap-5 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-3xl">
            ✓
          </div>
          <h2 className="text-lg font-black text-white uppercase tracking-wider">Payment Verified!</h2>
          <p className="text-xs text-text-secondary leading-relaxed">
            Stripe transaction was authorized and finalized. You will be redirected back to your Buyer Dashboard in a few seconds...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center py-10 px-4">
      <div className="max-w-md w-full flex flex-col gap-6">
        
        {/* Gateway simulation warning */}
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-4 rounded-2xl flex items-start gap-3 text-xs leading-relaxed">
          <ShieldCheck className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
          <div>
            <span className="font-bold">Sandbox Environment:</span> This is a simulated checkout session mimicking a live Stripe Checkout payment portal. Do NOT enter actual credit card credentials.
          </div>
        </div>

        <div className="glass-panel border border-white/5 rounded-3xl p-6 md:p-8 flex flex-col gap-6 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-primary/5 rounded-full blur-2xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-brand-primary" />
              <h2 className="text-sm font-black text-white uppercase tracking-wider">Stripe Secure Pay</h2>
            </div>
            <span className="text-[10px] text-gray-500 font-bold flex items-center gap-0.5">
              <Lock className="w-3 h-3 text-brand-accent" />
              128-bit SSL
            </span>
          </div>

          {/* Order Brief */}
          {order && (
            <div className="bg-white/5 border border-white/5 p-4 rounded-2xl flex justify-between items-center text-xs">
              <div>
                <p className="text-text-secondary text-[10px] uppercase font-bold tracking-wider">Order ID</p>
                <p className="text-white font-semibold mt-0.5">#{order.id.slice(0, 8)}</p>
              </div>
              <div className="text-right">
                <p className="text-text-secondary text-[10px] uppercase font-bold tracking-wider">Total Charge</p>
                <p className="text-brand-accent font-black mt-0.5">LKR {order.totalAmount.toLocaleString()}</p>
              </div>
            </div>
          )}

          {/* Card Form */}
          <form onSubmit={handlePaymentSubmit} className="flex flex-col gap-4 text-xs">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Cardholder Name</label>
              <input
                type="text"
                placeholder="e.g. Senesh Sanchana"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-primary"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Card Number</label>
              <input
                type="text"
                placeholder="4242 •••• •••• 4242"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-primary"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Expiration Date</label>
                <input
                  type="text"
                  placeholder="MM/YY"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-primary"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">CVV Code</label>
                <input
                  type="text"
                  placeholder="123"
                  value={cvv}
                  onChange={(e) => setCvv(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-primary"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={paymentLoading}
              className="w-full py-3.5 bg-gradient-brand text-white text-xs font-bold rounded-2xl flex items-center justify-center gap-1.5 hover:opacity-95 shadow-lg shadow-brand-primary/20 transition-all mt-4 cursor-pointer disabled:opacity-50"
            >
              {paymentLoading ? 'Authorizing transaction...' : `Pay LKR ${order?.totalAmount.toLocaleString()}`}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
