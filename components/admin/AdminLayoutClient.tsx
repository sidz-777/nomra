'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAdminAuth } from './AdminGuard';

interface AdminLayoutClientProps {
  title?: string;
  activeTab?: string;
  onTabChange?: (tab: 'orders' | 'customers' | 'reviews') => void;
  children: React.ReactNode;
}

export default function AdminLayoutClient({
  title = 'Order Operations & Dispatch',
  activeTab,
  onTabChange,
  children,
}: AdminLayoutClientProps) {
  const pathname = usePathname();
  const { email, isDemo, logout } = useAdminAuth();

  const isOrdersActive = pathname === '/admin' && (!activeTab || activeTab === 'orders');
  const isCustomersActive = pathname === '/admin' && activeTab === 'customers';
  const isReviewsActive = pathname === '/admin' && activeTab === 'reviews';
  const isProductsActive = pathname === '/admin/products';
  const isSettingsActive = pathname === '/admin/settings';

  const avatarInitial = (email || 'A').trim().charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-[#0E0D0C] text-[#F5EFE6] flex">
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#141210] border-r border-[#2D2722] flex flex-col shrink-0 h-screen sticky top-0 z-40 select-none">
        {/* Sidebar Brand */}
        <div className="p-6 border-b border-[#2D2722]">
          <Link href="/admin" className="font-serif tracking-widest text-xl font-bold text-[#D4AF6A] block">
            NAMORA
          </Link>
          <div className="text-[11px] font-mono uppercase tracking-wider text-[#A39684] mt-1">
            Operations Portal
          </div>
        </div>

        {/* Navigation List */}
        <nav className="p-3 flex-1 flex flex-col gap-1.5 overflow-y-auto">
          {/* Orders & Fulfillment */}
          {pathname === '/admin' && onTabChange ? (
            <button
              type="button"
              onClick={() => onTabChange('orders')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-medium transition-all text-left ${
                isOrdersActive
                  ? 'bg-[#D4AF6A]/15 text-[#D4AF6A] font-semibold border border-[#D4AF6A]/30 shadow-sm'
                  : 'text-[#A39684] hover:bg-[#D4AF6A]/5 hover:text-[#F5EFE6]'
              }`}
            >
              <span className="text-base">📦</span>
              <span>Orders &amp; Fulfillment</span>
            </button>
          ) : (
            <Link
              href="/admin"
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isOrdersActive
                  ? 'bg-[#D4AF6A]/15 text-[#D4AF6A] font-semibold border border-[#D4AF6A]/30 shadow-sm'
                  : 'text-[#A39684] hover:bg-[#D4AF6A]/5 hover:text-[#F5EFE6]'
              }`}
            >
              <span className="text-base">📦</span>
              <span>Orders &amp; Fulfillment</span>
            </Link>
          )}

          {/* Customer Directory */}
          {pathname === '/admin' && onTabChange ? (
            <button
              type="button"
              onClick={() => onTabChange('customers')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-medium transition-all text-left ${
                isCustomersActive
                  ? 'bg-[#D4AF6A]/15 text-[#D4AF6A] font-semibold border border-[#D4AF6A]/30 shadow-sm'
                  : 'text-[#A39684] hover:bg-[#D4AF6A]/5 hover:text-[#F5EFE6]'
              }`}
            >
              <span className="text-base">👥</span>
              <span>Customer Directory</span>
            </button>
          ) : (
            <Link
              href="/admin?tab=customers"
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isCustomersActive
                  ? 'bg-[#D4AF6A]/15 text-[#D4AF6A] font-semibold border border-[#D4AF6A]/30 shadow-sm'
                  : 'text-[#A39684] hover:bg-[#D4AF6A]/5 hover:text-[#F5EFE6]'
              }`}
            >
              <span className="text-base">👥</span>
              <span>Customer Directory</span>
            </Link>
          )}

          {/* Reviews Moderation */}
          {pathname === '/admin' && onTabChange ? (
            <button
              type="button"
              onClick={() => onTabChange('reviews')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-medium transition-all text-left ${
                isReviewsActive
                  ? 'bg-[#D4AF6A]/15 text-[#D4AF6A] font-semibold border border-[#D4AF6A]/30 shadow-sm'
                  : 'text-[#A39684] hover:bg-[#D4AF6A]/5 hover:text-[#F5EFE6]'
              }`}
            >
              <span className="text-base">⭐</span>
              <span>Reviews Moderation</span>
            </button>
          ) : (
            <Link
              href="/admin?tab=reviews"
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isReviewsActive
                  ? 'bg-[#D4AF6A]/15 text-[#D4AF6A] font-semibold border border-[#D4AF6A]/30 shadow-sm'
                  : 'text-[#A39684] hover:bg-[#D4AF6A]/5 hover:text-[#F5EFE6]'
              }`}
            >
              <span className="text-base">⭐</span>
              <span>Reviews Moderation</span>
            </Link>
          )}

          {/* Catalog & Stock */}
          <Link
            href="/admin/products"
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-medium transition-all ${
              isProductsActive
                ? 'bg-[#D4AF6A]/15 text-[#D4AF6A] font-semibold border border-[#D4AF6A]/30 shadow-sm'
                : 'text-[#A39684] hover:bg-[#D4AF6A]/5 hover:text-[#F5EFE6]'
            }`}
          >
            <span className="text-base">🖼️</span>
            <span>Catalog &amp; Stock</span>
          </Link>

          {/* Store Pricing & UPI */}
          <Link
            href="/admin/settings"
            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-medium transition-all ${
              isSettingsActive
                ? 'bg-[#D4AF6A]/15 text-[#D4AF6A] font-semibold border border-[#D4AF6A]/30 shadow-sm'
                : 'text-[#A39684] hover:bg-[#D4AF6A]/5 hover:text-[#F5EFE6]'
            }`}
          >
            <span className="text-base">⚙️</span>
            <span>Store Pricing &amp; UPI</span>
          </Link>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-[#2D2722] flex flex-col gap-3">
          <div className="flex items-center gap-3 bg-[#1A1816] p-2.5 rounded-lg border border-[#2D2722]">
            <div className="w-8 h-8 rounded-full bg-[#2D2722] border border-[#D4AF6A]/40 flex items-center justify-center font-serif text-sm font-bold text-[#D4AF6A] shrink-0">
              {avatarInitial}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[9px] uppercase tracking-wider text-[#A39684]">Signed in as</div>
              <div className="text-xs font-mono text-[#F5EFE6] truncate" title={email}>
                {email || 'admin@namora'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="w-full py-2 px-3 bg-[#1A1816] hover:bg-[#221F1C] border border-[#2D2722] hover:border-[#D4AF6A]/40 text-[#A39684] hover:text-[#D4AF6A] rounded-lg text-xs font-mono flex items-center justify-center gap-2 transition-all"
          >
            <span>🚪</span> Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 border-b border-[#2D2722] bg-[#141210]/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="font-serif text-lg font-bold text-[#D4AF6A] tracking-wide">
            {title}
          </div>
          <div className="flex items-center gap-3">
            {isDemo && (
              <span className="px-2.5 py-1 text-[11px] font-mono font-medium rounded-full bg-[#D4AF6A]/10 text-[#D4AF6A] border border-[#D4AF6A]/30">
                ⚡ Dev Demo Mode
              </span>
            )}
            <Link
              href="/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#1A1816] border border-[#2D2722] hover:border-[#D4AF6A] text-xs font-mono text-[#F5EFE6] transition-all"
            >
              <span>👁️ View Live Website</span>
            </Link>
          </div>
        </header>

        {/* Content Area */}
        <main className="p-6 flex-1 min-w-0 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
