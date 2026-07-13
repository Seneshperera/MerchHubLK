'use client';

import React from 'react';
import Link from 'next/link';
import { MapPin, ArrowRight } from 'lucide-react';

const API_URL = 'http://localhost:5000';

export default function ShopCard({ shop }) {
  const getLogo = () => {
    if (shop.logoUrl) {
      return shop.logoUrl.startsWith('http') || shop.logoUrl.startsWith('/') ? `${API_URL}${shop.logoUrl}` : shop.logoUrl;
    }
    return `${API_URL}/uploads/default-logo.png`;
  };

  return (
    <Link href={`/shop/${shop.slug}`} className="block">
      <div className="glass-card rounded-2xl p-5 h-full flex flex-col justify-between border border-white/5">
        <div className="flex items-center gap-4">
          {/* Shop Logo */}
          <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white/5 flex items-center justify-center border border-white/10 shrink-0">
            <img
              src={getLogo()}
              alt={shop.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://placehold.co/100x100/14141d/ffffff?text=' + encodeURIComponent(shop.name);
              }}
            />
          </div>

          {/* Shop Details */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-white truncate hover:text-brand-primary transition-colors">
              {shop.name}
            </h3>
            <p className="text-[11px] text-text-secondary flex items-center gap-1 mt-1 truncate">
              <MapPin className="w-3.5 h-3.5 text-brand-primary shrink-0" />
              {shop.location}
            </p>
          </div>
        </div>

        {/* Shop Description */}
        <p className="text-xs text-text-secondary leading-relaxed mt-4 line-clamp-2">
          {shop.description}
        </p>

        {/* Action Link */}
        <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-4">
          <span className="text-[10px] bg-brand-primary/10 border border-brand-primary/20 text-brand-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
            Creator
          </span>
          <span className="text-xs text-white group hover:text-brand-primary flex items-center gap-1 font-semibold transition-all">
            Visit Shop
            <ArrowRight className="w-4 h-4 text-brand-secondary" />
          </span>
        </div>
      </div>
    </Link>
  );
}
