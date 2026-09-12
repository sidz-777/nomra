'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Container } from './Container';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { MobileNavigation } from './MobileNavigation';
import { NAV_LINKS } from '@/lib/storefront-data';
import { useCart } from '@/components/cart';

interface HeaderProps {
  cartCount?: number;
  onCartClick?: () => void;
}

export function Header({ cartCount, onCartClick }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { totals, toggleCart, isHydrated } = useCart();

  const displayCount = cartCount !== undefined ? cartCount : (isHydrated ? totals.totalFrames : 0);
  const handleCartClick = onCartClick || (() => toggleCart(true));

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-namora-line bg-namora-bg/85 backdrop-blur-md transition-colors duration-300">
        <Container width="wide" className="h-16 sm:h-20 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <Link
            href="/"
            className="font-luxury text-xl sm:text-2xl font-bold tracking-[0.25em] text-namora-gold hover:text-namora-gold-hover transition select-none flex-shrink-0"
          >
            NAMORA
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-2.5 py-1 text-xs xl:text-sm font-medium text-namora-ink-soft hover:text-namora-gold transition rounded-md hover:bg-namora-soft/50"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions: Cart, Theme Toggle, Mobile Hamburger */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Cart Trigger */}
            <button
              type="button"
              onClick={handleCartClick}
              aria-label={`Shopping Cart with ${displayCount} items`}
              className="relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-namora-line bg-namora-soft/80 text-namora-ink hover:border-namora-gold hover:text-namora-gold transition text-xs font-medium"
            >
              <span>Cart</span>
              <span className="w-5 h-5 rounded-full bg-namora-gold text-black font-mono text-[10px] font-bold flex items-center justify-center transition-transform active:scale-90">
                {displayCount}
              </span>
            </button>

            {/* Light/Dark Theme Switcher */}
            <ThemeToggle />

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open mobile navigation menu"
              className="lg:hidden p-2 rounded-md border border-namora-line text-namora-ink hover:text-namora-gold hover:border-namora-gold transition focus:outline-none"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </Container>
      </header>

      {/* Mobile Slide-Over Navigation */}
      <MobileNavigation
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        onCartClick={handleCartClick}
      />
    </>
  );
}
