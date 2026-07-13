'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import axios from 'axios';
import ProductCard from '../../components/ProductCard';
import { Filter, RotateCcw, AlertCircle, ShoppingBag, Search, Grid, List, SlidersHorizontal } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

export default function Browse() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const categoryFilter = searchParams.get('category') || '';
  const searchQuery = searchParams.get('search') || '';

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtering / Sorting State
  const [sortBy, setSortBy] = useState('best-match');
  const [priceRange, setPriceRange] = useState('all');

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await axios.get(`${API_URL}/categories`);
        setCategories(res.data);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    }
    fetchCategories();
  }, []);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        let url = `${API_URL}/products`;
        const params = [];
        if (categoryFilter) params.push(`category=${categoryFilter}`);
        if (searchQuery) params.push(`search=${encodeURIComponent(searchQuery)}`);
        
        if (params.length > 0) {
          url += `?${params.join('&')}`;
        }

        const res = await axios.get(url);
        setProducts(res.data);
        setError('');
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Could not load catalog products.');
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, [categoryFilter, searchQuery]);

  const handleCategoryClick = (slug) => {
    const params = new URLSearchParams(searchParams.toString());
    if (slug) {
      params.set('category', slug);
    } else {
      params.delete('category');
    }
    router.push(`/browse?${params.toString()}`);
  };

  const handleClearFilters = () => {
    setSortBy('best-match');
    setPriceRange('all');
    router.push('/browse');
  };

  // Local filtering and sorting logic
  const getProcessedProducts = () => {
    let list = [...products];

    // Price range filters
    if (priceRange === 'under-1000') {
      list = list.filter(p => (p.price * (1 - p.discount / 100)) < 1000);
    } else if (priceRange === '1000-3000') {
      list = list.filter(p => {
        const pPrice = p.price * (1 - p.discount / 100);
        return pPrice >= 1000 && pPrice <= 3000;
      });
    } else if (priceRange === 'over-3000') {
      list = list.filter(p => (p.price * (1 - p.discount / 100)) > 3000);
    }

    // Sort order
    if (sortBy === 'price-low') {
      list.sort((a, b) => {
        const priceA = a.price * (1 - a.discount / 100);
        const priceB = b.price * (1 - b.discount / 100);
        return priceA - priceB;
      });
    } else if (sortBy === 'price-high') {
      list.sort((a, b) => {
        const priceA = a.price * (1 - a.discount / 100);
        const priceB = b.price * (1 - b.discount / 100);
        return priceB - priceA;
      });
    } else if (sortBy === 'rating') {
      list.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'discount') {
      list.sort((a, b) => b.discount - a.discount);
    }

    return list;
  };

  const isFiltering = categoryFilter || searchQuery || priceRange !== 'all' || sortBy !== 'best-match';
  const processedProducts = getProcessedProducts();

  return (
    <div className="flex flex-col w-full gap-8">
      
      {/* Search and Metadata summary */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/5 pb-4 gap-4">
        <div>
          <h1 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-brand-primary" />
            Merchandise Catalog
          </h1>
          <p className="text-xs text-text-secondary mt-1">
            {searchQuery 
              ? `Showing results for keyword "${searchQuery}"` 
              : categoryFilter 
                ? `Browsing ${categoryFilter} category items` 
                : 'Browse creative products uploaded by local Sri Lankan creators.'}
          </p>
        </div>

        {isFiltering && (
          <button
            onClick={handleClearFilters}
            className="text-[10px] font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer transition-colors border border-rose-500/20 bg-rose-500/5 px-3 py-1.5 rounded-full"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Catalog
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Filter Side Panel */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          
          {/* Categories select panel */}
          <div className="glass-panel rounded-2xl p-5 border border-white/5 flex flex-col gap-5">
            <h3 className="text-xs font-extrabold text-white uppercase tracking-widest border-b border-white/5 pb-2">
              Filter Categories
            </h3>
            <div className="flex flex-wrap lg:flex-col gap-2">
              <button
                onClick={() => handleCategoryClick('')}
                className={`text-left text-xs font-semibold px-4 py-2.5 rounded-xl border transition-all ${
                  !categoryFilter
                    ? 'bg-brand-primary/10 border-brand-primary/30 text-brand-primary'
                    : 'bg-white/5 border-white/5 text-text-secondary hover:bg-white/10 hover:text-white'
                }`}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.slug)}
                  className={`text-left text-xs font-semibold px-4 py-2.5 rounded-xl border transition-all flex justify-between items-center ${
                    categoryFilter === cat.slug
                      ? 'bg-brand-primary/10 border-brand-primary/30 text-brand-primary'
                      : 'bg-white/5 border-white/5 text-text-secondary hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span>{cat.name}</span>
                  {cat._count?.products !== undefined && (
                    <span className="text-[9px] bg-white/5 px-2 py-0.5 rounded text-gray-500">
                      {cat._count.products}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Pricing Filters */}
          <div className="glass-panel rounded-2xl p-5 border border-white/5 flex flex-col gap-4">
            <h3 className="text-xs font-extrabold text-white uppercase tracking-widest border-b border-white/5 pb-2">
              Price Range (LKR)
            </h3>
            <div className="flex flex-col gap-2 text-xs">
              <button
                onClick={() => setPriceRange('all')}
                className={`text-left px-3 py-2 rounded-lg border transition-all ${
                  priceRange === 'all'
                    ? 'bg-white/10 border-white/20 text-white font-bold'
                    : 'bg-transparent border-transparent text-text-secondary hover:text-white'
                }`}
              >
                Any Price
              </button>
              <button
                onClick={() => setPriceRange('under-1000')}
                className={`text-left px-3 py-2 rounded-lg border transition-all ${
                  priceRange === 'under-1000'
                    ? 'bg-white/10 border-white/20 text-white font-bold'
                    : 'bg-transparent border-transparent text-text-secondary hover:text-white'
                }`}
              >
                Under LKR 1,000
              </button>
              <button
                onClick={() => setPriceRange('1000-3000')}
                className={`text-left px-3 py-2 rounded-lg border transition-all ${
                  priceRange === '1000-3000'
                    ? 'bg-white/10 border-white/20 text-white font-bold'
                    : 'bg-transparent border-transparent text-text-secondary hover:text-white'
                }`}
              >
                LKR 1,000 - LKR 3,000
              </button>
              <button
                onClick={() => setPriceRange('over-3000')}
                className={`text-left px-3 py-2 rounded-lg border transition-all ${
                  priceRange === 'over-3000'
                    ? 'bg-white/10 border-white/20 text-white font-bold'
                    : 'bg-transparent border-transparent text-text-secondary hover:text-white'
                }`}
              >
                Over LKR 3,000
              </button>
            </div>
          </div>

        </div>

        {/* Listings panel */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          
          {/* Sorting controls */}
          <div className="glass-panel border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
            <span className="text-text-secondary font-medium">
              We found <span className="text-white font-bold">{processedProducts.length}</span> matching products
            </span>

            <div className="flex items-center gap-2">
              <span className="text-text-secondary font-medium shrink-0">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-white/5 border border-white/10 text-white rounded-xl px-3 py-1.5 text-xs focus:outline-none"
              >
                <option value="best-match" className="bg-bg-dark">Best Match</option>
                <option value="price-low" className="bg-bg-dark">Price: Low to High</option>
                <option value="price-high" className="bg-bg-dark">Price: High to Low</option>
                <option value="rating" className="bg-bg-dark">Highest Rated</option>
                <option value="discount" className="bg-bg-dark">Deepest Offer</option>
              </select>
            </div>
          </div>

          {/* Listings Grid */}
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-2xl flex items-center gap-3 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="glass-card rounded-2xl p-4 h-80 animate-pulse border border-white/5">
                  <div className="w-full aspect-square bg-white/5 rounded-xl mb-4" />
                  <div className="h-4 bg-white/5 rounded w-2/3 mb-2" />
                  <div className="h-3 bg-white/5 rounded w-full mb-4" />
                  <div className="h-6 bg-white/5 rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : processedProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {processedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="glass-panel border border-white/5 rounded-3xl p-16 text-center flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-gray-500">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-white">No matches found</h3>
              <p className="text-xs text-text-secondary max-w-sm leading-relaxed">
                No products matched your catalog filters or keyword search. Try relaxing your filters or typing another term.
              </p>
              <button
                onClick={handleClearFilters}
                className="px-6 py-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-xs font-semibold transition-all mt-2 cursor-pointer"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
