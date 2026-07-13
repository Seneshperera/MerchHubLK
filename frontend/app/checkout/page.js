'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '../../store/cart';
import { useAuthStore } from '../../store/auth';
import axios from 'axios';
import { AlertCircle, ArrowLeft, MessageSquare, ShieldCheck, ShoppingBag, Ticket, CreditCard } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function Checkout() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const { items, getTotalPrice, clearCart } = useCartStore();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('COD');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successOrders, setSuccessOrders] = useState([]);
  const [whatsappUrls, setWhatsappUrls] = useState([]);
  const [paymentLinks, setPaymentLinks] = useState([]); // Array of { shopName, url, totalAmount }

  // Coupon State: { [sellerId]: { code, discountAmount, discountType, value } }
  const [appliedCoupons, setAppliedCoupons] = useState({});
  const [couponInputs, setCouponInputs] = useState({});
  const [couponErrors, setCouponErrors] = useState({});
  const [couponLoading, setCouponLoading] = useState({});

  // Group items by sellerId
  const getGroupedItems = () => {
    const groups = {};
    items.forEach((item) => {
      if (!groups[item.sellerId]) {
        groups[item.sellerId] = {
          sellerId: item.sellerId,
          sellerName: item.sellerName,
          sellerWhatsapp: item.sellerWhatsapp || '',
          items: [],
          subtotal: 0
        };
      }
      const itemPrice = item.price * (1 - item.discount / 100);
      groups[item.sellerId].items.push({
        productId: item.id,
        quantity: item.quantity,
        name: item.name,
        price: itemPrice
      });
      groups[item.sellerId].subtotal += itemPrice * item.quantity;
    });
    return Object.values(groups);
  };

  const hasMissingWhatsappForWhatsappPayment = () => {
    if (paymentMethod !== 'WHATSAPP') return false;
    const groups = getGroupedItems();
    return groups.some(group => !group.sellerWhatsapp);
  };


  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=checkout');
    }
  }, [user, router]);

  if (items.length === 0 && successOrders.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 text-center gap-4">
        <ShoppingBag className="w-16 h-16 text-gray-500" />
        <h2 className="text-xl font-bold text-white">Cart is empty</h2>
        <Link href="/" className="px-6 py-2 rounded-full bg-gradient-brand text-white font-bold text-xs">
          Browse Products
        </Link>
      </div>
    );
  }

  const handleApplyCoupon = async (sellerId, subtotal) => {
    const code = couponInputs[sellerId];
    if (!code) return;

    setCouponLoading(prev => ({ ...prev, [sellerId]: true }));
    setCouponErrors(prev => ({ ...prev, [sellerId]: '' }));

    try {
      const res = await axios.post(`${API_URL}/coupons/validate`, {
        code,
        sellerId,
        orderAmount: subtotal
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setAppliedCoupons(prev => ({
        ...prev,
        [sellerId]: {
          code: code.toUpperCase().trim(),
          discountAmount: res.data.discountAmount,
          discountType: res.data.discountType,
          value: res.data.value
        }
      }));
      setCouponInputs(prev => ({ ...prev, [sellerId]: '' }));
    } catch (err) {
      console.error('Coupon validation error:', err);
      setCouponErrors(prev => ({
        ...prev,
        [sellerId]: err.response?.data?.message || 'Invalid coupon code.'
      }));
    } finally {
      setCouponLoading(prev => ({ ...prev, [sellerId]: false }));
    }
  };

  const handleRemoveCoupon = (sellerId) => {
    setAppliedCoupons(prev => {
      const copy = { ...prev };
      delete copy[sellerId];
      return copy;
    });
  };

  const getFinalTotal = () => {
    const groups = getGroupedItems();
    let total = 0;
    groups.forEach(group => {
      const discount = appliedCoupons[group.sellerId]?.discountAmount || 0;
      total += (group.subtotal - discount);
    });
    return total;
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!fullName || !phone || !addressLine1 || !city || !province || !postalCode) {
      setError('Please fill in all required shipping details');
      return;
    }

    setLoading(true);
    setError('');

    const shippingAddress = {
      fullName,
      addressLine1,
      addressLine2,
      city,
      province,
      postalCode,
      phoneNumber: phone,
    };

    const customerDetails = {
      fullName,
      phoneNumber: phone,
      email: user.email,
    };

    const groups = getGroupedItems();
    const createdOrders = [];
    const waLinks = [];
    const pLinks = [];

    try {
      for (const group of groups) {
        const coupon = appliedCoupons[group.sellerId];
        const orderData = {
          sellerId: group.sellerId,
          shippingAddress,
          customerDetails,
          paymentMethod,
          items: group.items.map(i => ({
            productId: i.productId,
            quantity: i.quantity
          })),
          couponCode: coupon ? coupon.code : undefined
        };

        const res = await axios.post(`${API_URL}/orders`, orderData, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const createdOrder = res.data.order;
        createdOrders.push(createdOrder);

        if (res.data.whatsappUrl) {
          waLinks.push({
            shopName: group.sellerName,
            url: res.data.whatsappUrl
          });
        }

        // If card payment method selected, fetch payment gateway simulation redirect links
        if (paymentMethod === 'STRIPE_SIM') {
          const checkRes = await axios.post(`${API_URL}/payments/stripe/create-checkout`, {
            orderId: createdOrder.id
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          pLinks.push({
            shopName: group.sellerName,
            url: checkRes.data.url,
            totalAmount: createdOrder.totalAmount
          });
        }
      }

      setSuccessOrders(createdOrders);
      setWhatsappUrls(waLinks);
      setPaymentLinks(pLinks);
      clearCart();
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err.response?.data?.message || 'Failed to place order. Check stock availability or try again.');
    } finally {
      setLoading(false);
    }
  };

  if (successOrders.length > 0) {
    return (
      <div className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full flex flex-col gap-6 text-center">
          <div className="glass-panel border border-white/5 rounded-3xl p-8 flex flex-col items-center justify-center gap-6 shadow-2xl relative overflow-hidden">
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-brand-accent/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-3xl z-10">
              🎉
            </div>
            
            <div className="z-10">
              <h2 className="text-xl font-black text-white">Order Received!</h2>
              <p className="text-xs text-text-secondary mt-1">
                Your order has been registered successfully on our platform.
              </p>
            </div>

            <div className="w-full flex flex-col gap-3 text-left bg-white/5 p-4 rounded-2xl border border-white/5 z-10 text-xs">
              <p className="font-bold text-white border-b border-white/5 pb-2">Order Information</p>
              {successOrders.map((ord) => (
                <div key={ord.id} className="flex flex-col gap-0.5 py-1 border-b border-white/5 last:border-0 last:pb-0">
                  <p className="text-[10px] text-gray-500">Order ID: #{ord.id.slice(0, 8)}</p>
                  <p className="text-white font-medium">Total: LKR {ord.totalAmount.toLocaleString()}</p>
                </div>
              ))}
              <div className="mt-2 text-[10px] text-text-secondary">
                <span className="font-bold">Payment Method:</span> {
                  paymentMethod === 'COD' 
                    ? 'Cash on Delivery' 
                    : paymentMethod === 'WHATSAPP' 
                      ? 'WhatsApp Checkout' 
                      : 'Card Payment (Stripe Sim)'
                }
              </div>
            </div>

            {/* Simulated Payment redirects button */}
            {paymentMethod === 'STRIPE_SIM' && paymentLinks.length > 0 && (
              <div className="w-full flex flex-col gap-3 z-10">
                <p className="text-xs text-brand-primary font-bold">
                  Click below to authorize your card payments securely:
                </p>
                {paymentLinks.map((link, idx) => (
                  <button
                    key={idx}
                    onClick={() => router.push(link.url)}
                    className="w-full py-3.5 bg-gradient-brand text-white text-xs font-bold rounded-2xl flex items-center justify-center gap-2 hover:opacity-95 shadow-lg shadow-brand-primary/20 transition-all cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4" />
                    Pay {link.shopName} (LKR {link.totalAmount.toLocaleString()})
                  </button>
                ))}
              </div>
            )}

            {paymentMethod === 'WHATSAPP' && whatsappUrls.length > 0 && (
              <div className="w-full flex flex-col gap-3 z-10">
                <p className="text-xs text-amber-400 font-medium">
                  Click the button below to send your order details directly to the seller(s) on WhatsApp:
                </p>
                {whatsappUrls.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 bg-[#25D366] hover:bg-[#20ba56] text-white text-xs font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4 fill-current" />
                    Send to {link.shopName}
                  </a>
                ))}
              </div>
            )}

            <button
              onClick={() => router.push(`/dashboard/buyer`)}
              className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-xs font-semibold text-white transition-all z-10 mt-2"
            >
              Go to Order History
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full gap-8">
      <div>
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1 text-xs text-text-secondary hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Cart
        </button>
      </div>

      <h1 className="text-2xl font-black text-white uppercase tracking-wider border-b border-white/5 pb-3">
        Checkout
      </h1>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Shipping Form */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="glass-panel border border-white/5 rounded-3xl p-6 md:p-8 flex flex-col gap-5">
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-white border-b border-white/5 pb-3">
              Shipping & Customer Details
            </h3>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3.5 rounded-2xl flex items-center gap-2.5 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Full Name *</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-primary"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Phone Number *</label>
                <input
                  type="tel"
                  placeholder="+94 77 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-primary"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Address Line 1 *</label>
              <input
                type="text"
                placeholder="Street Address, P.O. Box"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-primary"
                required
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Address Line 2 (Optional)</label>
              <input
                type="text"
                placeholder="Apartment, suite, unit, building, floor, etc."
                value={addressLine2}
                onChange={(e) => setAddressLine2(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-primary"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">City *</label>
                <input
                  type="text"
                  placeholder="Colombo"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-primary"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Province *</label>
                <input
                  type="text"
                  placeholder="Western"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-primary"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-text-secondary">Postal Code *</label>
                <input
                  type="text"
                  placeholder="00100"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-brand-primary"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-4 border-t border-white/5 pt-5">
              <h4 className="text-xs font-bold uppercase tracking-widest text-white">Payment Method</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('COD')}
                  className={`p-4 rounded-2xl border text-left flex flex-col gap-1 transition-all ${
                    paymentMethod === 'COD'
                      ? 'bg-brand-primary/10 border-brand-primary/30 text-brand-primary'
                      : 'bg-white/5 border-white/5 text-text-secondary hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className="text-xs font-bold text-white">💵 Cash on Delivery</span>
                  <span className="text-[10px] text-text-secondary">Pay in cash when items are delivered.</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('WHATSAPP')}
                  className={`p-4 rounded-2xl border text-left flex flex-col gap-1 transition-all ${
                    paymentMethod === 'WHATSAPP'
                      ? 'bg-brand-primary/10 border-brand-primary/30 text-brand-primary'
                      : 'bg-white/5 border-white/5 text-text-secondary hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className="text-xs font-bold text-white">💬 WhatsApp Order</span>
                  <span className="text-[10px] text-text-secondary">Redirects order template directly to WhatsApp chats.</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('STRIPE_SIM')}
                  className={`p-4 rounded-2xl border text-left flex flex-col gap-1 transition-all ${
                    paymentMethod === 'STRIPE_SIM'
                      ? 'bg-brand-primary/10 border-brand-primary/30 text-brand-primary'
                      : 'bg-white/5 border-white/5 text-text-secondary hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className="text-xs font-bold text-white">💳 Stripe (Simulation)</span>
                  <span className="text-[10px] text-text-secondary">Checkout using simulated credit card gateway.</span>
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Order summary with Coupons */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="glass-panel border border-white/5 rounded-3xl p-6 flex flex-col gap-6">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-white border-b border-white/5 pb-3">
              Review Items
            </h3>

            {/* Render grouped summary with coupon entries per shop */}
            <div className="flex flex-col gap-5 overflow-y-auto max-h-96 pr-1">
              {getGroupedItems().map((group) => {
                const applied = appliedCoupons[group.sellerId];
                return (
                  <div key={group.sellerId} className="flex flex-col gap-2 bg-white/[0.02] border border-white/5 p-3.5 rounded-2xl text-xs">
                    <span className="text-[9px] font-bold text-brand-primary uppercase tracking-wider">{group.sellerName}</span>
                    
                    {/* Products details */}
                    <div className="flex flex-col gap-1 mt-1">
                      {group.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center text-[11px] text-text-secondary">
                          <span className="truncate max-w-[120px]">{item.name} (x{item.quantity})</span>
                          <span>LKR {(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-white/5 my-1.5" />

                    {/* Subtotal */}
                    <div className="flex justify-between text-[11px] text-text-secondary">
                      <span>Subtotal</span>
                      <span className="font-semibold text-white">LKR {group.subtotal.toLocaleString()}</span>
                    </div>

                    {/* Applied Coupon Info */}
                    {applied ? (
                      <div className="flex justify-between items-center text-[11px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-2 rounded-xl mt-1">
                        <span className="flex items-center gap-1 font-bold">
                          <Ticket className="w-3.5 h-3.5" />
                          {applied.code}
                        </span>
                        <div className="flex items-center gap-2">
                          <span>-LKR {applied.discountAmount.toLocaleString()}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveCoupon(group.sellerId)}
                            className="text-[9px] font-extrabold text-rose-400 hover:text-rose-300"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Coupon Entry field */
                      <div className="flex flex-col gap-1.5 mt-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Promo Code"
                            value={couponInputs[group.sellerId] || ''}
                            onChange={(e) => setCouponInputs(prev => ({
                              ...prev,
                              [group.sellerId]: e.target.value
                            }))}
                            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-[10px] text-white focus:outline-none focus:border-brand-primary"
                          />
                          <button
                            type="button"
                            onClick={() => handleApplyCoupon(group.sellerId, group.subtotal)}
                            disabled={couponLoading[group.sellerId]}
                            className="px-3 bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold text-white rounded-lg transition-all"
                          >
                            Apply
                          </button>
                        </div>
                        {couponErrors[group.sellerId] && (
                          <p className="text-[9px] text-rose-400 font-semibold">{couponErrors[group.sellerId]}</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Calculations summaries */}
            <div className="border-t border-white/5 pt-4 flex flex-col gap-2">
              <div className="flex justify-between text-xs text-text-secondary">
                <span>Shipping fee</span>
                <span className="text-emerald-400 font-bold uppercase tracking-wider text-[10px]">Free</span>
              </div>
              <div className="flex justify-between text-sm font-black text-white mt-1">
                <span>Total Amount</span>
                <span className="text-brand-accent">LKR {getFinalTotal().toLocaleString()}</span>
              </div>
            </div>

            {hasMissingWhatsappForWhatsappPayment() && (
              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-3.5 rounded-2xl flex items-start gap-2.5 text-[11px] leading-relaxed my-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>One or more creators in your cart do not have a WhatsApp contact number set up. Please select Card Payment or Cash on Delivery instead.</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || hasMissingWhatsappForWhatsappPayment()}
              className="w-full py-3.5 bg-gradient-brand text-white text-xs font-bold rounded-2xl flex items-center justify-center gap-2 hover:opacity-95 shadow-lg shadow-brand-primary/25 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading 
                ? 'Processing Order...' 
                : paymentMethod === 'COD' 
                  ? 'Place COD Order' 
                  : paymentMethod === 'WHATSAPP' 
                    ? 'Order via WhatsApp' 
                    : 'Authorize Card Payment'}
            </button>


            <div className="flex items-center gap-2 text-[10px] text-text-secondary justify-center mt-2">
              <ShieldCheck className="w-4 h-4 text-brand-accent shrink-0" />
              <span>Secure checkout. All rights reserved.</span>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
}
