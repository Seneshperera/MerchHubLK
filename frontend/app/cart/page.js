'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCartStore } from '../../store/cart';
import { useAuthStore } from '../../store/auth';
import { Trash2, ShoppingBag, ArrowRight, Minus, Plus, ShieldCheck } from 'lucide-react';

const HOST_URL = 'http://localhost:5000';

export default function Cart() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { items, updateQuantity, removeItem, getTotalPrice, clearCart } = useCartStore();

  const [cartItems, setCartItems] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);

  useEffect(() => {
    setCartItems(items);
    setTotalPrice(getTotalPrice());
  }, [items, getTotalPrice]);

  const handleCheckoutClick = () => {
    if (!user) {
      router.push('/login?redirect=checkout');
    } else {
      router.push('/checkout');
    }
  };

  const getProductImage = (item) => {
    if (item.image) {
      return item.image.startsWith('http') || item.image.startsWith('/') 
        ? `${HOST_URL}${item.image}` 
        : item.image;
    }
    return `${HOST_URL}/uploads/default-product.png`;
  };

  if (cartItems.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center py-20 gap-4">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-gray-500 mb-2">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white">Your Cart is Empty</h2>
        <p className="text-xs text-text-secondary max-w-sm leading-relaxed">
          Looks like you haven't added any creator merchandise yet. Discover unique apparel, sticker packs, and custom designs!
        </p>
        <Link
          href="/"
          className="px-6 py-2.5 rounded-full bg-gradient-brand text-white hover:opacity-95 text-xs font-bold transition-all mt-2"
        >
          Explore Merchandise
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full gap-8">
      <h1 className="text-2xl font-black text-white uppercase tracking-wider border-b border-white/5 pb-3">
        Shopping Cart ({cartItems.length})
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Cart items list */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {cartItems.map((item) => {
            const itemPrice = item.price * (1 - item.discount / 100);
            return (
              <div
                key={item.id}
                className="glass-panel border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-5 justify-between"
              >
                <div className="flex items-center gap-4 w-full sm:w-auto">
                  {/* Product thumbnail */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    <img
                      src={getProductImage(item)}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://placehold.co/100x100/14141d/ffffff?text=Merch';
                      }}
                    />
                  </div>

                  {/* Product details */}
                  <div className="min-w-0">
                    <span className="text-[9px] text-brand-primary font-bold uppercase tracking-wider">
                      {item.sellerName}
                    </span>
                    <h3 className="text-xs font-bold text-white truncate max-w-[200px] sm:max-w-xs">
                      {item.name}
                    </h3>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-xs font-bold text-brand-accent">LKR {itemPrice.toLocaleString()}</span>
                      {item.discount > 0 && (
                        <span className="text-[10px] text-text-secondary line-through font-semibold">
                          LKR {item.price.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Adjusting Quantity */}
                <div className="flex items-center gap-6 justify-between w-full sm:w-auto">
                  <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-0.5">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-7 h-7 rounded-lg hover:bg-white/5 text-white font-bold flex items-center justify-center text-xs"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-xs font-bold text-white">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-7 h-7 rounded-lg hover:bg-white/5 text-white font-bold flex items-center justify-center text-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Delete Item */}
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-2 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/15 rounded-xl text-text-secondary hover:text-rose-400 transition-all cursor-pointer"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}

          <div className="flex justify-between items-center px-2">
            <button
              onClick={clearCart}
              className="text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors"
            >
              Clear Entire Cart
            </button>
            <Link
              href="/"
              className="text-xs font-semibold text-brand-primary hover:text-brand-secondary transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        </div>

        {/* Summary Card */}
        <div className="lg:col-span-1">
          <div className="glass-panel border border-white/5 rounded-3xl p-6 flex flex-col gap-6">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-white border-b border-white/5 pb-3">
              Order Summary
            </h3>

            <div className="flex flex-col gap-3">
              <div className="flex justify-between text-xs text-text-secondary">
                <span>Subtotal</span>
                <span>LKR {totalPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs text-text-secondary">
                <span>Delivery fee</span>
                <span className="text-emerald-400 font-bold uppercase tracking-wider text-[10px]">Free</span>
              </div>
              
              <div className="border-t border-white/5 pt-4 flex justify-between text-sm font-black text-white">
                <span>Total Amount</span>
                <span className="text-brand-accent">LKR {totalPrice.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={handleCheckoutClick}
              className="w-full py-3.5 bg-gradient-brand text-white text-xs font-bold rounded-2xl flex items-center justify-center gap-2 hover:opacity-95 shadow-lg shadow-brand-primary/25 transition-all cursor-pointer"
            >
              Proceed to Checkout
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 text-[10px] text-text-secondary justify-center mt-2">
              <ShieldCheck className="w-4 h-4 text-brand-accent shrink-0" />
              <span>Checkout supports Cash on Delivery and direct creator WhatsApp orders.</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
