import React from 'react';
import { AnnouncementBar } from './AnnouncementBar';
import { Header } from './Header';
import { Footer } from './Footer';

interface PageShellProps {
  children: React.ReactNode;
  cartCount?: number;
}

export function PageShell({ children, cartCount = 0 }: PageShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-namora-bg text-namora-ink selection:bg-namora-gold selection:text-black">
      <AnnouncementBar />
      <Header cartCount={cartCount} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
