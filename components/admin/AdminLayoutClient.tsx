'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAdminAuth } from './AdminGuard';

interface AdminLayoutClientProps {
  title?: string;
  activeTab?: string;
  onTabChange?: (tab: any) => void;
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
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  const isDashboardActive = pathname === '/admin' && !activeTab;
  const isAnalyticsActive = pathname === '/admin/analytics';
  const isOrdersActive = pathname === '/admin/orders' || (pathname === '/admin' && activeTab === 'orders');
  const isCustomersActive = pathname === '/admin/customers' || (pathname === '/admin' && activeTab === 'customers');
  const isReviewsActive = pathname === '/admin/reviews' || (pathname === '/admin' && activeTab === 'reviews');
  const isProductsActive = pathname === '/admin/products';
  const isInventoryActive = pathname === '/admin/inventory';
  const isDesignsActive = pathname === '/admin/designs';
  const isCollectionsActive = pathname === '/admin/collections';
  const isMediaActive = pathname === '/admin/media';
  const isHomepageActive = pathname === '/admin/homepage';
  const isGalleryActive = pathname === '/admin/customer-gallery';
  const isSeoActive = pathname === '/admin/seo';
  const isCampaignsActive = pathname === '/admin/campaigns';
  const isActivityActive = pathname === '/admin/activity';
  const isSettingsActive = pathname === '/admin/settings';
  const isNotificationsActive = pathname === '/admin/notifications';
  const isNotificationSettingsActive = pathname === '/admin/settings/notifications';

  const avatarInitial = (email || 'A').trim().charAt(0).toUpperCase();

  const renderNavLinks = (onItemClick?: () => void) => (
    <nav className="p-3 flex-1 flex flex-col gap-1.5 overflow-y-auto">
      {/* Operations Dashboard */}
      <Link
        href="/admin"
        onClick={onItemClick}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-medium transition-all ${
          isDashboardActive
            ? 'bg-[#D4AF6A]/15 text-[#D4AF6A] font-semibold border border-[#D4AF6A]/30 shadow-sm'
            : 'text-[#A39684] hover:bg-[#D4AF6A]/5 hover:text-[#F5EFE6]'
        }`}
      >
        <span className="text-base">📊</span>
        <span>Operations Dashboard</span>
      </Link>

      {/* Analytics & BI */}
      <Link
        href="/admin/analytics"
        onClick={onItemClick}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-medium transition-all ${
          isAnalyticsActive
            ? 'bg-[#D4AF6A]/15 text-[#D4AF6A] font-semibold border border-[#D4AF6A]/30 shadow-sm'
            : 'text-[#A39684] hover:bg-[#D4AF6A]/5 hover:text-[#F5EFE6]'
        }`}
      >
        <span className="text-base">📈</span>
        <span>Analytics &amp; BI</span>
      </Link>

      {/* Orders & Dispatch */}
      <Link
        href="/admin/orders"
        onClick={onItemClick}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-medium transition-all ${
          isOrdersActive && !isDashboardActive
            ? 'bg-[#D4AF6A]/15 text-[#D4AF6A] font-semibold border border-[#D4AF6A]/30 shadow-sm'
            : 'text-[#A39684] hover:bg-[#D4AF6A]/5 hover:text-[#F5EFE6]'
        }`}
      >
        <span className="text-base">📦</span>
        <span>Orders &amp; Dispatch</span>
      </Link>

      {/* Customer CRM */}
      <Link
        href="/admin/customers"
        onClick={onItemClick}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-medium transition-all ${
          isCustomersActive
            ? 'bg-[#D4AF6A]/15 text-[#D4AF6A] font-semibold border border-[#D4AF6A]/30 shadow-sm'
            : 'text-[#A39684] hover:bg-[#D4AF6A]/5 hover:text-[#F5EFE6]'
        }`}
      >
        <span className="text-base">👥</span>
        <span>Customer CRM</span>
      </Link>

      {/* Notification Center */}
      <Link
        href="/admin/notifications"
        onClick={onItemClick}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-medium transition-all ${
          isNotificationsActive
            ? 'bg-[#D4AF6A]/15 text-[#D4AF6A] font-semibold border border-[#D4AF6A]/30 shadow-sm'
            : 'text-[#A39684] hover:bg-[#D4AF6A]/5 hover:text-[#F5EFE6]'
        }`}
      >
        <span className="text-base">🔔</span>
        <span>Notification Center</span>
      </Link>

      {/* Inventory & Stock */}
      <Link
        href="/admin/inventory"
        onClick={onItemClick}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-medium transition-all ${
          isInventoryActive
            ? 'bg-[#D4AF6A]/15 text-[#D4AF6A] font-semibold border border-[#D4AF6A]/30 shadow-sm'
            : 'text-[#A39684] hover:bg-[#D4AF6A]/5 hover:text-[#F5EFE6]'
        }`}
      >
        <span className="text-base">🏷️</span>
        <span>Inventory Health</span>
      </Link>

      {/* Catalog & Products */}
      <Link
        href="/admin/products"
        onClick={onItemClick}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-medium transition-all ${
          isProductsActive
            ? 'bg-[#D4AF6A]/15 text-[#D4AF6A] font-semibold border border-[#D4AF6A]/30 shadow-sm'
            : 'text-[#A39684] hover:bg-[#D4AF6A]/5 hover:text-[#F5EFE6]'
        }`}
      >
        <span className="text-base">🖼️</span>
        <span>Catalog Products</span>
      </Link>

      {/* Design Studio */}
      <Link
        href="/admin/designs"
        onClick={onItemClick}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-medium transition-all ${
          isDesignsActive
            ? 'bg-[#D4AF6A]/15 text-[#D4AF6A] font-semibold border border-[#D4AF6A]/30 shadow-sm'
            : 'text-[#A39684] hover:bg-[#D4AF6A]/5 hover:text-[#F5EFE6]'
        }`}
      >
        <span className="text-base">🎨</span>
        <span>Design Studio</span>
      </Link>

      {/* Collections */}
      <Link
        href="/admin/collections"
        onClick={onItemClick}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-medium transition-all ${
          isCollectionsActive
            ? 'bg-[#D4AF6A]/15 text-[#D4AF6A] font-semibold border border-[#D4AF6A]/30 shadow-sm'
            : 'text-[#A39684] hover:bg-[#D4AF6A]/5 hover:text-[#F5EFE6]'
        }`}
      >
        <span className="text-base">📁</span>
        <span>Collections</span>
      </Link>

      {/* Media Library */}
      <Link
        href="/admin/media"
        onClick={onItemClick}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-medium transition-all ${
          isMediaActive
            ? 'bg-[#D4AF6A]/15 text-[#D4AF6A] font-semibold border border-[#D4AF6A]/30 shadow-sm'
            : 'text-[#A39684] hover:bg-[#D4AF6A]/5 hover:text-[#F5EFE6]'
        }`}
      >
        <span className="text-base">📸</span>
        <span>Media Library</span>
      </Link>

      {/* Marketing & Storefront Section Divider */}
      <div className="pt-2 pb-1 px-4">
        <span className="text-[10px] uppercase font-mono tracking-wider text-[#A39684]/70 font-semibold">
          Marketing &amp; CMS
        </span>
      </div>

      {/* Homepage CMS */}
      <Link
        href="/admin/homepage"
        onClick={onItemClick}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-medium transition-all ${
          isHomepageActive
            ? 'bg-[#D4AF6A]/15 text-[#D4AF6A] font-semibold border border-[#D4AF6A]/30 shadow-sm'
            : 'text-[#A39684] hover:bg-[#D4AF6A]/5 hover:text-[#F5EFE6]'
        }`}
      >
        <span className="text-base">📣</span>
        <span>Homepage CMS</span>
      </Link>

      {/* Customer Reviews Moderation */}
      <Link
        href="/admin/reviews"
        onClick={onItemClick}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-medium transition-all ${
          isReviewsActive
            ? 'bg-[#D4AF6A]/15 text-[#D4AF6A] font-semibold border border-[#D4AF6A]/30 shadow-sm'
            : 'text-[#A39684] hover:bg-[#D4AF6A]/5 hover:text-[#F5EFE6]'
        }`}
      >
        <span className="text-base">⭐</span>
        <span>Reviews Moderation</span>
      </Link>

      {/* Customer Gallery / Lookbook */}
      <Link
        href="/admin/customer-gallery"
        onClick={onItemClick}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-medium transition-all ${
          isGalleryActive
            ? 'bg-[#D4AF6A]/15 text-[#D4AF6A] font-semibold border border-[#D4AF6A]/30 shadow-sm'
            : 'text-[#A39684] hover:bg-[#D4AF6A]/5 hover:text-[#F5EFE6]'
        }`}
      >
        <span className="text-base">🖼️</span>
        <span>Customer Lookbook</span>
      </Link>

      {/* SEO Metadata */}
      <Link
        href="/admin/seo"
        onClick={onItemClick}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-medium transition-all ${
          isSeoActive
            ? 'bg-[#D4AF6A]/15 text-[#D4AF6A] font-semibold border border-[#D4AF6A]/30 shadow-sm'
            : 'text-[#A39684] hover:bg-[#D4AF6A]/5 hover:text-[#F5EFE6]'
        }`}
      >
        <span className="text-base">🔍</span>
        <span>SEO &amp; Meta</span>
      </Link>

      {/* Promotional Campaigns & Badges */}
      <Link
        href="/admin/campaigns"
        onClick={onItemClick}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-medium transition-all ${
          isCampaignsActive
            ? 'bg-[#D4AF6A]/15 text-[#D4AF6A] font-semibold border border-[#D4AF6A]/30 shadow-sm'
            : 'text-[#A39684] hover:bg-[#D4AF6A]/5 hover:text-[#F5EFE6]'
        }`}
      >
        <span className="text-base">🏷️</span>
        <span>Campaigns &amp; Badges</span>
      </Link>

      {/* System Section Divider */}
      <div className="pt-2 pb-1 px-4">
        <span className="text-[10px] uppercase font-mono tracking-wider text-[#A39684]/70 font-semibold">
          System &amp; Settings
        </span>
      </div>

      {/* Activity / Audit Log */}
      <Link
        href="/admin/activity"
        onClick={onItemClick}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-medium transition-all ${
          isActivityActive
            ? 'bg-[#D4AF6A]/15 text-[#D4AF6A] font-semibold border border-[#D4AF6A]/30 shadow-sm'
            : 'text-[#A39684] hover:bg-[#D4AF6A]/5 hover:text-[#F5EFE6]'
        }`}
      >
        <span className="text-base">📜</span>
        <span>Audit &amp; Activity</span>
      </Link>

      {/* Store Pricing & UPI */}
      <Link
        href="/admin/settings"
        onClick={onItemClick}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-medium transition-all ${
          isSettingsActive
            ? 'bg-[#D4AF6A]/15 text-[#D4AF6A] font-semibold border border-[#D4AF6A]/30 shadow-sm'
            : 'text-[#A39684] hover:bg-[#D4AF6A]/5 hover:text-[#F5EFE6]'
        }`}
      >
        <span className="text-base">⚙️</span>
        <span>Store Pricing &amp; UPI</span>
      </Link>

      {/* Notification Settings */}
      <Link
        href="/admin/settings/notifications"
        onClick={onItemClick}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-medium transition-all ${
          isNotificationSettingsActive
            ? 'bg-[#D4AF6A]/15 text-[#D4AF6A] font-semibold border border-[#D4AF6A]/30 shadow-sm'
            : 'text-[#A39684] hover:bg-[#D4AF6A]/5 hover:text-[#F5EFE6]'
        }`}
      >
        <span className="text-base">🔔</span>
        <span>Notification Config</span>
      </Link>
    </nav>
  );

  const renderFooter = () => (
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
  );

  return (
    <div className="min-h-screen bg-[#0E0D0C] text-[#F5EFE6] flex">
      {/* MOBILE DRAWER MODAL */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] bg-[#141210] border-r border-[#2D2722] flex flex-col h-full z-10">
            <div className="p-5 border-b border-[#2D2722] flex items-center justify-between">
              <div>
                <Link
                  href="/admin"
                  onClick={() => setMobileNavOpen(false)}
                  className="font-serif tracking-widest text-xl font-bold text-[#D4AF6A] block"
                >
                  NAMORA
                </Link>
                <div className="text-[11px] font-mono uppercase tracking-wider text-[#A39684] mt-0.5">
                  Operations Portal
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#1E1B18] border border-[#2D2722] text-[#A39684] hover:text-[#F5EFE6]"
                aria-label="Close navigation"
              >
                ✕
              </button>
            </div>
            {renderNavLinks(() => setMobileNavOpen(false))}
            {renderFooter()}
          </aside>
        </div>
      )}

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex w-64 bg-[#141210] border-r border-[#2D2722] flex-col shrink-0 h-screen sticky top-0 z-40 select-none">
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
        {renderNavLinks()}

        {/* Sidebar Footer */}
        {renderFooter()}
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 border-b border-[#2D2722] bg-[#141210]/80 backdrop-blur-md px-4 md:px-6 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="md:hidden p-2 text-[#D4AF6A] hover:bg-[#1E1B18] rounded-lg border border-[#2D2722] text-sm shrink-0"
              aria-label="Open navigation menu"
            >
              ☰
            </button>
            <div className="font-serif text-base md:text-lg font-bold text-[#D4AF6A] tracking-wide truncate">
              {title}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isDemo && (
              <span className="hidden sm:inline-block px-2.5 py-1 text-[11px] font-mono font-medium rounded-full bg-[#D4AF6A]/10 text-[#D4AF6A] border border-[#D4AF6A]/30">
                ⚡ Dev Demo Mode
              </span>
            )}
            <Link
              href="/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1A1816] border border-[#2D2722] hover:border-[#D4AF6A] text-xs font-mono text-[#F5EFE6] transition-all"
            >
              <span>👁️</span>
              <span className="hidden sm:inline">View Live Website</span>
            </Link>
          </div>
        </header>

        {/* Content Area */}
        <main className="p-4 md:p-6 flex-1 min-w-0 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
