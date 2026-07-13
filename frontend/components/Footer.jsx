import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full bg-[#07070a] border-t border-white/5 pt-16 pb-8 px-6 md:px-12 mt-auto">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
        {/* About Section */}
        <div className="flex flex-col gap-4">
          <span className="text-lg font-extrabold tracking-wider text-gradient">
            MERCHHUB.LK
          </span>
          <p className="text-xs text-text-secondary leading-relaxed">
            The premier multi-vendor marketplace connecting Sri Lankan creators, artists, and brands with buyers who love unique, custom merchandise.
          </p>
        </div>

        {/* Categories Section */}
        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-bold uppercase tracking-widest text-white">Categories</h4>
          <ul className="flex flex-col gap-2 text-xs text-text-secondary">
            <li>
              <Link href="/?category=gaming" className="hover:text-brand-primary transition-colors">
                Gaming Gear & Skins
              </Link>
            </li>
            <li>
              <Link href="/?category=anime" className="hover:text-brand-primary transition-colors">
                Anime Collective
              </Link>
            </li>
            <li>
              <Link href="/?category=wall-art" className="hover:text-brand-primary transition-colors">
                Wall Art & Prints
              </Link>
            </li>
            <li>
              <Link href="/?category=apparel" className="hover:text-brand-primary transition-colors">
                Hoodies & T-Shirts
              </Link>
            </li>
          </ul>
        </div>

        {/* Creator Hub */}
        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-bold uppercase tracking-widest text-white">Creator Hub</h4>
          <ul className="flex flex-col gap-2 text-xs text-text-secondary">
            <li>
              <Link href="/register?role=seller" className="hover:text-brand-primary transition-colors">
                Start Selling
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-brand-primary transition-colors">
                Seller Dashboard
              </Link>
            </li>
            <li>
              <Link href="#" className="hover:text-brand-primary transition-colors">
                Creator Guidelines
              </Link>
            </li>
            <li>
              <Link href="#" className="hover:text-brand-primary transition-colors">
                Success Stories
              </Link>
            </li>
          </ul>
        </div>

        {/* Support & Legal */}
        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-bold uppercase tracking-widest text-white">Support</h4>
          <ul className="flex flex-col gap-2 text-xs text-text-secondary">
            <li>
              <Link href="#" className="hover:text-brand-primary transition-colors">
                Contact Us
              </Link>
            </li>
            <li>
              <Link href="#" className="hover:text-brand-primary transition-colors">
                FAQ & Help Center
              </Link>
            </li>
            <li>
              <Link href="#" className="hover:text-brand-primary transition-colors">
                Terms of Service
              </Link>
            </li>
            <li>
              <Link href="#" className="hover:text-brand-primary transition-colors">
                Privacy Policy
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="max-w-7xl mx-auto border-t border-white/5 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-text-secondary">
        <p>© {new Date().getFullYear()} MerchHub LK. All rights reserved.</p>
        <p className="flex items-center gap-1">
          Designed with ❤️ for Sri Lankan Creators.
        </p>
      </div>
    </footer>
  );
}
