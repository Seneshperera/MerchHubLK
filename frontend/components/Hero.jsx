'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Sparkles, Flame, Users, Store, ArrowRight } from 'lucide-react';

export default function Hero() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [dynamicWordIdx, setDynamicWordIdx] = useState(0);
  const words = ['Anime Merch', 'Custom Stickers', 'Handcrafted Apparel', 'Unique Mugs', 'Gaming Gear'];

  useEffect(() => {
    const interval = setInterval(() => {
      setDynamicWordIdx((prev) => (prev + 1) % words.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/browse?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/browse');
    }
  };

  return (
    <div className="relative w-full overflow-hidden rounded-[32px] bg-slate-950 border border-white/10 shadow-2xl mt-6 p-8 md:p-16 flex flex-col lg:flex-row items-center justify-between gap-12 min-h-[500px]">
      
      {/* Background Glows & Patterns */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-brand-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-brand-secondary/15 rounded-full blur-[120px] pointer-events-none" />
      
      {/* Subtle grid backdrop */}
      <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

      {/* Hero Left Panel: Typography & Search */}
      <div className="flex-1 flex flex-col gap-6 text-center lg:text-left z-10 max-w-xl">
        
        {/* Animated Badge */}
        <div className="inline-flex items-center self-center lg:self-start gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] md:text-[11px] font-bold tracking-widest uppercase text-brand-secondary animate-pulse">
          <Sparkles className="w-3.5 h-3.5 text-brand-accent animate-spin" style={{ animationDuration: '6s' }} />
          Sri Lanka's Premier Multi-Vendor Creator Space
        </div>

        {/* SEO-Optimized Title with Dynamic Typing effect */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-none text-white">
          Discover Custom<br />
          <span className="relative inline-block mt-2 min-w-[250px] text-left lg:text-left">
            <span className="text-gradient transition-all duration-500 ease-in-out animate-fade-in-out">
              {words[dynamicWordIdx]}
            </span>
          </span>
        </h1>

        <p className="text-xs sm:text-sm text-text-secondary leading-relaxed max-w-md">
          Explore Sri Lanka's largest creative catalog. Support independent local artists selling high-quality custom gaming apparel, stickers, anime posters, and handcrafted items directly.
        </p>

        {/* Hero Interactive Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-lg mt-2 flex items-center">
          <input
            type="text"
            placeholder="Search custom products (e.g. haikyuu poster, cyberpunk sticker)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 hover:bg-white/[0.08] focus:bg-white/[0.08] border border-white/10 rounded-2xl px-5 py-4 pl-12 pr-32 text-xs text-white focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all placeholder:text-gray-600 shadow-xl"
          />
          <Search className="absolute left-4 w-4 h-4 text-gray-500" />
          <button
            type="submit"
            className="absolute right-2.5 px-5 py-2 bg-gradient-brand text-white text-[10px] font-extrabold rounded-xl hover:opacity-95 shadow-md shadow-brand-primary/25 transition-all cursor-pointer"
          >
            Find Merch
          </button>
        </form>

        {/* Action Tags */}
        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 mt-2">
          <Link
            href="/browse"
            className="group inline-flex items-center gap-1.5 text-xs font-bold text-white hover:text-brand-primary transition-colors"
          >
            Explore Catalog
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <span className="text-gray-700">|</span>
          <Link
            href="/register?role=seller"
            className="text-xs font-bold text-text-secondary hover:text-white transition-colors"
          >
            Open Storefront
          </Link>
        </div>

      </div>

      {/* Hero Right Panel: Interactive Logo Showcase Card */}
      <div className="flex-1 w-full max-w-md relative flex items-center justify-center z-10 group">
        {/* Rotating border effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-brand-primary to-brand-secondary rounded-[36px] blur-xl opacity-30 group-hover:opacity-45 transition-opacity duration-500 pointer-events-none" />
        
        {/* Interactive Logo Wrapper Card */}
        <div className="w-full rounded-[36px] border border-white/10 overflow-hidden bg-white shadow-2xl p-6 flex flex-col justify-between transition-all duration-500 ease-out group-hover:scale-[1.03] group-hover:rotate-1 relative min-h-[340px] md:min-h-[380px]">
          
          {/* Top card metadata */}
          <div className="flex justify-between items-center w-full pb-2 border-b border-gray-100">
            <span className="text-[9px] font-black uppercase tracking-wider text-brand-primary bg-brand-primary/5 px-2 py-0.5 rounded">
              Verified Brand
            </span>
            <div className="flex gap-1 text-[8px] font-semibold text-gray-400">
              <span>Sri Lanka</span>
              <span>•</span>
              <span>100% Creator owned</span>
            </div>
          </div>

          {/* Core Image (Logo) */}
          <div className="flex-1 flex items-center justify-center py-2">
            <img
              src="/logo.png"
              alt="MerchHub LK Logo"
              className="max-h-56 md:max-h-64 w-full object-contain drop-shadow-md transform transition-all duration-500 group-hover:scale-105"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://placehold.co/400x250/ffffff/14141d?text=MerchHub+LK';
              }}
            />
          </div>


          {/* Bottom Card callouts */}
          <div className="flex justify-between items-center w-full pt-2 border-t border-gray-100">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-[9px] font-bold text-gray-500">Live Marketplace</span>
            </div>
            <Link
              href="/browse"
              className="text-[9px] font-bold text-brand-secondary group-hover:underline flex items-center gap-0.5"
            >
              Shop Creator Goods
              <ArrowRight className="w-2.5 h-2.5" />
            </Link>
          </div>
          
        </div>
      </div>

    </div>
  );
}
