'use client';

import React from 'react';
import Link from 'next/link';
import { useCartStore } from '../store/cart';
import { ShoppingCart, Tag, Star } from 'lucide-react';

const API_URL = 'http://localhost:5000';

export default function ProductCard({ product }) {
  const { addItem } = useCartStore();

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product, 1);
  };

  const getProductImage = () => {
    if (product.imageUrls && product.imageUrls.length > 0) {
      const img = product.imageUrls[0];
      return img.startsWith('http') || img.startsWith('/') ? `${API_URL}${img}` : img;
    }
    return `${API_URL}/uploads/default-product.png`;
  };

  const originalPrice = product.price;
  const discount = product.discount || 0;
  const currentPrice = originalPrice * (1 - discount / 100);

  return (
    <Link href={`/product/${product.slug}`} className="block">
      <div className="glass-card rounded-2xl overflow-hidden p-3 h-full flex flex-col justify-between">
        {/* Product Image Area */}
        <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-white/5 mb-3 flex items-center justify-center">
          <img
            src={getProductImage()}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://placehold.co/400x400/14141d/ffffff?text=' + encodeURIComponent(product.name);
            }}
          />

          {/* Discount Badge */}
          {discount > 0 && (
            <div className="absolute top-2.5 right-2.5 bg-brand-secondary text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-0.5 shadow-md">
              <Tag className="w-3 h-3" />
              {discount}% OFF
            </div>
          )}

          {/* Category Badge */}
          <div className="absolute bottom-2.5 left-2.5 bg-black/60 backdrop-blur-md text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
            {product.category?.name || 'Merch'}
          </div>
        </div>

        {/* Product Info */}
        <div className="flex-1 flex flex-col gap-1.5 px-1">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-brand-primary font-bold uppercase tracking-wider">
              {product.seller?.name || 'Creator Shop'}
            </span>
            
            {/* Star Rating Display */}
            {product.rating > 0 && (
              <span className="text-[10px] font-bold text-amber-400 flex items-center gap-0.5">
                <Star className="w-3 h-3 fill-current" />
                {product.rating.toFixed(1)}
              </span>
            )}
          </div>
          
          <h3 className="text-sm font-bold text-white line-clamp-1 hover:text-brand-primary transition-colors">
            {product.name}
          </h3>
          
          <p className="text-[11px] text-text-secondary line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Pricing & Add to Cart */}
        <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-3 px-1">
          <div className="flex flex-col">
            {discount > 0 ? (
              <>
                <span className="text-xs text-text-secondary line-through font-medium">
                  LKR {originalPrice.toLocaleString()}
                </span>
                <span className="text-sm font-black text-brand-accent">
                  LKR {currentPrice.toLocaleString()}
                </span>
              </>
            ) : (
              <span className="text-sm font-black text-white">
                LKR {originalPrice.toLocaleString()}
              </span>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            disabled={product.stock <= 0}
            className={`p-2 rounded-xl transition-all shadow-md flex items-center justify-center ${
              product.stock <= 0
                ? 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'
                : 'bg-gradient-brand text-white hover:opacity-90 shadow-brand-primary/20 hover:scale-105'
            }`}
            title={product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Link>
  );
}
