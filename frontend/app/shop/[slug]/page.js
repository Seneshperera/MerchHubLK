'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axios from 'axios';
import ProductCard from '../../../components/ProductCard';
import { MapPin, Phone, Share2, LayoutGrid, MessageSquare, AlertCircle } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const HOST_URL = 'http://localhost:5000';

export default function PublicShopStore() {
  const { slug } = useParams();
  const router = useRouter();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchShopData() {
      if (!slug) return;
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/seller/public/${slug}`);
        setShop(res.data);
        
        // Products are loaded as part of the shop response or we format them
        if (res.data.products) {
          const formatted = res.data.products.map(p => ({
            ...p,
            imageUrls: typeof p.imageUrls === 'string' ? JSON.parse(p.imageUrls) : p.imageUrls,
            tags: typeof p.tags === 'string' ? JSON.parse(p.tags) : p.tags,
            seller: {
              name: res.data.name,
              slug: res.data.slug,
              logoUrl: res.data.logoUrl
            }
          }));
          setProducts(formatted);
        }
        setError('');
      } catch (err) {
        console.error('Error fetching public shop:', err);
        setError('Shop storefront could not be found.');
      } finally {
        setLoading(false);
      }
    }
    fetchShopData();
  }, [slug]);

  const getShopLogo = () => {
    if (shop?.logoUrl) {
      return shop.logoUrl.startsWith('http') || shop.logoUrl.startsWith('/') 
        ? `${HOST_URL}${shop.logoUrl}` 
        : shop.logoUrl;
    }
    return `${HOST_URL}/uploads/default-logo.png`;
  };

  const getShopBanner = () => {
    if (shop?.bannerUrl) {
      return shop.bannerUrl.startsWith('http') || shop.bannerUrl.startsWith('/') 
        ? `${HOST_URL}${shop.bannerUrl}` 
        : shop.bannerUrl;
    }
    return `${HOST_URL}/uploads/default-banner.png`;
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: shop.name + ' - MerchHub LK',
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Storefront link copied to clipboard!');
    }
  };

  const handleWhatsAppContact = () => {
    if (!shop?.whatsapp) return;
    const cleaned = shop.whatsapp.replace(/[^\d]/g, '');
    let target = cleaned;
    if (!target.startsWith('94') && target.length === 9) {
      target = '94' + target;
    }
    const text = encodeURIComponent(`Hi ${shop.name}! I found your shop on MerchHub LK and wanted to check out your products.`);
    window.open(`https://wa.me/${target}?text=${text}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 animate-pulse">
        <div className="h-64 w-full bg-white/5 rounded-3xl mb-8" />
        <div className="w-32 h-32 rounded-full bg-white/5 mb-6" />
        <div className="h-6 bg-white/5 rounded w-48 mb-2" />
        <div className="h-4 bg-white/5 rounded w-96" />
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center py-20 gap-4">
        <AlertCircle className="w-16 h-16 text-rose-400" />
        <h2 className="text-xl font-bold text-white">Shop Not Found</h2>
        <p className="text-xs text-text-secondary max-w-sm leading-relaxed">
          The requested creator shop storefront could not be located, or it is disabled by administrator.
        </p>
        <button
          onClick={() => router.push('/')}
          className="px-6 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-xs font-semibold mt-2"
        >
          Go Back Home
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full gap-8">
      
      {/* Shop Banner Header */}
      <div className="relative w-full h-48 md:h-72 rounded-3xl overflow-hidden border border-white/5 shadow-2xl">
        <img
          src={getShopBanner()}
          alt={shop.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://placehold.co/1200x400/14141d/ffffff?text=' + encodeURIComponent(shop.name);
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        {/* Shop meta inside banner */}
        <div className="absolute bottom-6 left-6 md:left-12 flex flex-col md:flex-row items-center md:items-end gap-5 text-center md:text-left w-full pr-12">
          {/* Logo overlay */}
          <div className="w-20 h-20 md:w-28 md:h-28 rounded-3xl bg-bg-card border border-white/10 overflow-hidden flex items-center justify-center shadow-2xl shrink-0">
            <img
              src={getShopLogo()}
              alt={shop.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://placehold.co/150x150/14141d/ffffff?text=' + encodeURIComponent(shop.name);
              }}
            />
          </div>

          <div className="flex-1 flex flex-col gap-1 md:pb-2">
            <h1 className="text-xl md:text-3xl font-black text-white">{shop.name}</h1>
            <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 text-xs text-text-secondary mt-1">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-brand-primary" />
                {shop.location}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-white/10 hidden md:inline" />
              <span className="flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-brand-secondary" />
                {shop.whatsapp}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 shrink-0 md:pb-2">
            <button
              onClick={handleWhatsAppContact}
              className="px-4 py-2 bg-brand-primary/10 border border-brand-primary/30 rounded-xl text-xs font-bold text-brand-primary flex items-center gap-1.5 hover:bg-brand-primary/20 transition-all cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              Contact
            </button>
            <button
              onClick={handleShare}
              className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 transition-all text-white"
              title="Share storefront"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* About Description Block */}
      <div className="glass-panel border border-white/5 rounded-3xl p-6 md:p-8">
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-white mb-3">About Creator</h3>
        <p className="text-xs md:text-sm text-text-secondary leading-relaxed max-w-4xl">
          {shop.description}
        </p>
      </div>

      {/* Shop Products Listing */}
      <div className="flex flex-col gap-6">
        <h2 className="text-base font-extrabold text-white uppercase tracking-wider flex items-center gap-2 border-b border-white/5 pb-3">
          <LayoutGrid className="w-4 h-4 text-brand-primary" />
          Store Products ({products.length})
        </h2>

        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="glass-panel border border-white/5 rounded-2xl py-12 text-center text-xs text-text-secondary italic">
            This creator has not listed any items for sale yet. Check back soon!
          </div>
        )}
      </div>

    </div>
  );
}
