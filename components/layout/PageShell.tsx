import React from 'react';
import { AnnouncementBar } from './AnnouncementBar';
import { Header } from './Header';
import { Footer } from './Footer';
import { CartProvider, CartDrawer } from '@/components/cart';

interface PageShellProps {
  children: React.ReactNode;
  cartCount?: number;
}

export function PageShell({ children, cartCount }: PageShellProps) {
  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col bg-namora-bg text-namora-ink selection:bg-namora-gold selection:text-black">
        <AnnouncementBar />
        <Header cartCount={cartCount} />
        <main className="flex-1">{children}</main>
        <Footer />
        <CartDrawer />
      </div>
    </CartProvider>
  );
}
