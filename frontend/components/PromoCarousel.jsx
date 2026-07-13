'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Sparkles, Flame, ShieldCheck } from 'lucide-react';

const slides = [
  {
    id: 1,
    title: '7.7 Creator Mega Deals',
    description: 'Flat 25% OFF on custom anime merchandise, graphic hoodies, and artistic posters. Direct support for local creators.',
    badge: 'Flash Sale Live',
    icon: Flame,
    link: '/browse?sort=discount',
    actionText: 'Shop Deals Now',
    imageUrl: '/deals-banner.jpg'
  },
  {
    id: 2,
    title: 'Handcrafted With Pride',
    description: 'Discover premium custom mechanical keyboard keycaps, laptop skins, phone cases, and aesthetic art prints.',
    badge: 'Featured Items',
    icon: Sparkles,
    link: '/browse?category=handmade',
    actionText: 'Browse Handmade',
    imageUrl: '/handmade-banner.jpg'
  },
  {
    id: 3,
    title: 'Free Deliveries Islandwide',
    description: 'Order custom merch directly from verified Sri Lankan creators with free shipping eligibility on orders over LKR 5,000.',
    badge: 'Special Offer',
    icon: ShieldCheck,
    link: '/browse',
    actionText: 'Explore Catalog',
    imageUrl: '/shipping-banner.jpg'
  }
];

export default function PromoCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  return (
    <div className="relative w-full h-[220px] sm:h-[300px] md:h-[360px] rounded-[32px] overflow-hidden border border-white/10 shadow-2xl bg-slate-950 group">
      
      {/* Slides Container */}
      {slides.map((slide, idx) => {
        const Icon = slide.icon;
        const isActive = idx === currentSlide;

        return (
          <div
            key={slide.id}
            className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
              isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            {/* Base Banner Image */}
            <img
              src={slide.imageUrl}
              alt={slide.title}
              className="w-full h-full object-cover transition-transform duration-[8000ms] ease-out scale-100 hover:scale-105"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://placehold.co/1200x400/14141d/ffffff?text=' + encodeURIComponent(slide.title);
              }}
            />

            {/* Dark gradient overlay for typography readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent pointer-events-none" />

            {/* Overlaid Slide details */}
            <div className="absolute inset-0 flex flex-col justify-center gap-2.5 sm:gap-4 p-8 md:p-16 z-20 max-w-lg md:max-w-xl text-left select-none">
              <div className="flex items-center gap-2">
                <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-brand-secondary bg-brand-secondary/20 border border-brand-secondary/30 px-3 py-1 rounded-full">
                  {slide.badge}
                </span>
              </div>

              <h3 className="text-base sm:text-2xl md:text-3xl font-black text-white leading-tight flex items-center gap-2">
                <Icon className="w-5 h-5 sm:w-7 sm:h-7 text-brand-accent animate-pulse" />
                {slide.title}
              </h3>

              <p className="text-[10px] sm:text-xs md:text-sm text-gray-300 leading-relaxed font-medium">
                {slide.description}
              </p>

              <Link
                href={slide.link}
                className="w-max mt-1.5 px-6 py-2.5 sm:px-8 sm:py-3.5 bg-gradient-brand text-white text-[10px] sm:text-xs font-bold rounded-2xl flex items-center justify-center gap-1.5 hover:opacity-95 shadow-lg shadow-brand-primary/25 transition-all cursor-pointer"
              >
                {slide.actionText}
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        );
      })}

      {/* Navigation Arrows */}
      <button
        onClick={handlePrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/40 border border-white/10 hover:bg-black/60 hover:border-white/20 text-white flex items-center justify-center z-30 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer duration-300"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={handleNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/40 border border-white/10 hover:bg-black/60 hover:border-white/20 text-white flex items-center justify-center z-30 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer duration-300"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Pagination indicators dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-30">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            className={`h-1.5 rounded-full transition-all cursor-pointer ${
              currentSlide === idx ? 'w-6 bg-brand-primary' : 'w-2 bg-white/20 hover:bg-white/40'
            }`}
          />
        ))}
      </div>

    </div>
  );
}
