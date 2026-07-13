'use client';

import React, { useState } from 'react';
import axios from 'axios';
import { Search, Package, MapPin, Phone, Calendar, ArrowRight, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const HOST_URL = 'http://localhost:5000';

export default function TrackOrder() {
  const [orderIdInput, setOrderIdInput] = useState('');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!orderIdInput.trim()) return;

    setLoading(true);
    setError('');
    setOrder(null);

    try {
      const res = await axios.get(`${API_URL}/orders/track/${orderIdInput.trim()}`);
      setOrder(res.data);
    } catch (err) {
      console.error('Track order error:', err);
      setError(err.response?.data?.message || 'Order not found. Please double-check your Order ID.');
    } finally {
      setLoading(false);
    }
  };

  const getStepStatus = (step) => {
    const statuses = ['PENDING', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED'];
    if (!order) return 'upcoming';
    
    const currentStatus = order.status.toUpperCase();
    if (currentStatus === 'CANCELLED') return 'cancelled';

    const currentIndex = statuses.indexOf(currentStatus);
    const stepIndex = statuses.indexOf(step);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'upcoming';
  };

  const getStepColor = (statusState) => {
    switch (statusState) {
      case 'completed': return 'bg-brand-primary border-brand-primary text-white';
      case 'active': return 'bg-brand-secondary border-brand-secondary text-white animate-pulse';
      case 'cancelled': return 'bg-rose-500 border-rose-500 text-white';
      default: return 'bg-white/5 border-white/10 text-gray-500';
    }
  };

  const steps = [
    { label: 'Pending Approval', status: 'PENDING', desc: 'Order registered' },
    { label: 'Confirmed', status: 'CONFIRMED', desc: 'Creator accepted order' },
    { label: 'Packed & Ready', status: 'PACKED', desc: 'Item package packed' },
    { label: 'In Transit', status: 'SHIPPED', desc: 'Handed to courier' },
    { label: 'Delivered', status: 'DELIVERED', desc: 'Arrived at destination' }
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center max-w-3xl mx-auto w-full gap-8 py-8 px-4">
      
      {/* Page Title */}
      <div className="text-center">
        <h1 className="text-2xl font-black text-white uppercase tracking-wider flex items-center justify-center gap-2">
          <Package className="w-6 h-6 text-brand-primary" />
          Track Your Order
        </h1>
        <p className="text-xs text-text-secondary mt-1.5">
          Enter your unique Order ID to track the real-time fulfillment status of your merchandise.
        </p>
      </div>

      {/* Search Input Box */}
      <div className="glass-panel border border-white/5 rounded-3xl p-6 w-full shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-brand-primary/5 rounded-full blur-2xl pointer-events-none" />
        
        <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-3 relative z-10">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Enter Order ID (e.g. 8a2b5e2a or full UUID)"
              value={orderIdInput}
              onChange={(e) => setOrderIdInput(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 pl-12 text-xs text-white focus:outline-none focus:border-brand-primary transition-all placeholder:text-gray-600"
              required
            />
            <Search className="absolute left-4 top-4 w-4 h-4 text-gray-500" />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="sm:w-auto px-8 py-3.5 bg-gradient-brand text-white text-xs font-bold rounded-2xl flex items-center justify-center gap-1.5 hover:opacity-95 shadow-lg shadow-brand-primary/25 transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Track Details'}
          </button>
        </form>
      </div>

      {/* Error Output */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-2xl flex items-center gap-3 text-xs w-full">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tracking Details Display */}
      {order && (
        <div className="w-full flex flex-col gap-6 animate-in fade-in duration-300">
          
          {/* Header Card: Order metadata */}
          <div className="glass-panel border border-white/5 rounded-3xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-[10px] bg-brand-primary/10 border border-brand-primary/20 text-brand-primary px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Order Status
              </span>
              <h2 className="text-base font-black text-white mt-2">
                Order #{order.id.slice(0, 8).toUpperCase()}
              </h2>
              <p className="text-[10px] text-text-secondary mt-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Placed on: {new Date(order.createdAt).toLocaleDateString()} at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            <div className="text-left sm:text-right">
              <p className="text-[10px] text-text-secondary uppercase tracking-widest font-bold">Total Amount</p>
              <p className="text-lg font-black text-brand-accent mt-1">LKR {order.totalAmount.toLocaleString()}</p>
              <span className="text-[9px] text-gray-500 font-medium">({order.paymentMethod})</span>
            </div>
          </div>

          {/* Fulfilment Timeline Visualizer */}
          <div className="glass-panel border border-white/5 rounded-3xl p-6 md:p-8 flex flex-col gap-6">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-white border-b border-white/5 pb-3">
              Delivery Timeline
            </h3>

            {order.status === 'CANCELLED' ? (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-2xl flex items-center gap-3 text-xs font-bold">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <span>This order was cancelled by the seller. No delivery timeline is active.</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6 relative">
                {/* Horizontal line for progress on md sizes */}
                <div className="hidden md:block absolute top-4 left-6 right-6 h-0.5 bg-white/5 z-0" />
                
                {steps.map((step, idx) => {
                  const state = getStepStatus(step.status);
                  const isCompleted = state === 'completed';
                  const isActive = state === 'active';

                  return (
                    <div key={idx} className="flex md:flex-col items-center gap-4 md:text-center z-10 relative">
                      <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold transition-all shrink-0 ${getStepColor(state)}`}>
                        {isCompleted ? '✓' : idx + 1}
                      </div>

                      <div className="flex flex-col md:items-center">
                        <span className={`text-[11px] font-bold ${isActive ? 'text-brand-secondary font-black' : isCompleted ? 'text-white' : 'text-gray-500'}`}>
                          {step.label}
                        </span>
                        <span className="text-[9px] text-text-secondary mt-0.5">{step.desc}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Seller Shop brief and Items breakdown grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Seller Contact Info card */}
            <div className="md:col-span-1 glass-panel border border-white/5 rounded-3xl p-5 flex flex-col justify-between gap-4">
              <div>
                <span className="text-[9px] uppercase tracking-widest text-text-secondary font-bold">Sold By</span>
                <h4 className="text-xs font-bold text-white mt-1.5">{order.sellerName}</h4>
                <p className="text-[10px] text-text-secondary mt-1">Creator Storefront</p>
              </div>

              {order.sellerWhatsapp && (
                <a
                  href={`https://wa.me/${order.sellerWhatsapp.replace(/[^\d]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 bg-[#25D366] hover:bg-[#20ba56] text-white text-[10px] font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <Phone className="w-3.5 h-3.5 fill-current" />
                  Contact Creator
                </a>
              )}
            </div>

            {/* Items summary card */}
            <div className="md:col-span-2 glass-panel border border-white/5 rounded-3xl p-5 flex flex-col gap-4">
              <span className="text-[9px] uppercase tracking-widest text-text-secondary font-bold border-b border-white/5 pb-2">
                Order Items ({order.items.length})
              </span>

              <div className="flex flex-col gap-3">
                {order.items.map((item, index) => {
                  const firstImg = item.imageUrls && item.imageUrls.length > 0
                    ? item.imageUrls[0].startsWith('http') || item.imageUrls[0].startsWith('/') 
                      ? `${HOST_URL}${item.imageUrls[0]}` 
                      : item.imageUrls[0]
                    : `${HOST_URL}/uploads/default-product.png`;

                  return (
                    <div key={index} className="flex justify-between items-center text-xs bg-white/[0.01] border border-white/5 p-2.5 rounded-xl">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-white/5 border border-white/10 shrink-0 flex items-center justify-center">
                          <img src={firstImg} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="font-bold text-white truncate max-w-[150px]">{item.name}</p>
                          <span className="text-[9px] text-text-secondary">Quantity: {item.quantity}</span>
                        </div>
                      </div>
                      <span className="font-semibold text-white">LKR {(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
