'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import Hero from '../components/Hero';
import PromoCarousel from '../components/PromoCarousel';
import ProductCard from '../components/ProductCard';
import ShopCard from '../components/ShopCard';
import { getCategoryIcon } from '../utils/categoryIcons';
import { Sparkles, Store, Flame, LayoutGrid, Star, ArrowRight } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

export default function Home() {
  const router = useRouter();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHomeData() {
      setLoading(true);
      try {
        const [prodsRes, catsRes, shopsRes] = await Promise.all([
          axios.get(`${API_URL}/products`),
          axios.get(`${API_URL}/categories`),
          axios.get(`${API_URL}/seller/public`)
        ]);
        setProducts(prodsRes.data);
        setCategories(catsRes.data);
        setShops(shopsRes.data);
      } catch (err) {
        console.error('Error fetching home data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchHomeData();
  }, []);

  // Filter sections like Daraz
  const flashSaleProducts = products.filter(p => p.discount > 0);
  const featuredProducts = products.filter(p => p.isFeatured);
  const popularProducts = products
    .filter(p => p.rating > 0)
    .sort((a, b) => b.rating - a.rating);
  const featuredShops = shops.filter(s => s.isFeatured);

  return (
    <div className="flex flex-col w-full gap-12 pb-12">
      
      {/* 1. Hero Showcase */}
      <Hero />

      {/* 2. Promotions Slideshow Carousel */}
      <PromoCarousel />

      {/* 3. Browse by Category (High Density Icon Cards) */}
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-brand-primary" />
            Explore Categories
          </h2>
          <Link href="/browse" className="text-xs font-bold text-brand-primary hover:underline flex items-center gap-1">
            See All Catalog
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="glass-card h-28 rounded-2xl animate-pulse border border-white/5" />
            ))}
          </div>
        ) : categories.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.slice(0, 12).map((cat) => {
              const CatIcon = getCategoryIcon(cat.slug);
              return (
                <Link
                  key={cat.id}
                  href={`/browse?category=${cat.slug}`}
                  className="glass-card hover:border-brand-primary/30 border border-white/5 rounded-2xl p-5 flex flex-col items-center justify-center text-center gap-3 transition-all hover:scale-[1.03] group"
                >
                  <div className="w-12 h-12 rounded-full bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary group-hover:scale-110 transition-transform">
                    <CatIcon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-white leading-tight truncate w-full">{cat.name}</span>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-text-secondary italic">No categories created yet.</p>
        )}
      </div>

      {/* 4. Flash Sale / Discounts and Offers (Daraz Flame Section) */}
      {loading ? (
        <div className="flex flex-col gap-6">
          <div className="h-6 bg-white/5 rounded w-1/4 animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="glass-card h-80 rounded-2xl animate-pulse border border-white/5" />
            ))}
          </div>
        </div>
      ) : flashSaleProducts.length > 0 ? (
        <div className="flex flex-col gap-6 bg-gradient-brand/5 border border-brand-primary/10 p-6 md:p-8 rounded-3xl relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-primary/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-brand-secondary animate-pulse" />
              <h2 className="text-lg font-black text-white uppercase tracking-wider">Flash Deals & Offers</h2>
            </div>
            <Link href="/browse?sort=discount" className="text-xs font-bold text-brand-secondary hover:underline flex items-center gap-1">
              Shop Flash Offers
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {flashSaleProducts.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      ) : null}

      {/* 5. Community Picks & Featured Merchandise */}
      {!loading && featuredProducts.length > 0 && (
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-accent" />
              Community Picks & Featured
            </h2>
            <Link href="/browse" className="text-xs font-semibold text-text-secondary hover:text-white transition-colors">
              View catalog
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredProducts.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}

      {/* 6. Most Popular Products (Ordered by Rating) */}
      {!loading && popularProducts.length > 0 && (
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400 fill-current" />
              Most Popular Products
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {popularProducts.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}

      {/* 7. Featured Creators & Storefronts */}
      {!loading && (
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Store className="w-5 h-5 text-brand-primary" />
              {featuredShops.length > 0 ? 'Featured Creators' : 'All Creator Storefronts'}
            </h2>
          </div>
          
          {shops.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {(featuredShops.length > 0 ? featuredShops : shops).slice(0, 4).map((shop) => (
                <ShopCard key={shop.id} shop={shop} />
              ))}
            </div>
          ) : (
            <div className="glass-card border border-white/5 rounded-2xl p-6 text-center italic text-xs text-text-secondary">
              No creator shops set up yet. Log in to start your storefront!
            </div>
          )}
        </div>
      )}

    </div>
  );
}
