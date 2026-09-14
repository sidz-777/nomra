'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { MobileNavigation } from './MobileNavigation';
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
      <header>
        <div className="container">
          <nav>
            <Link href="/" className="logo">
              NAMORA
            </Link>
            <div className="navlinks">
              <a href="#designs">Collection</a>
              <a href="#create">Customize</a>
              <a href="#ready-to-ship">Ready Stock ⚡</a>
              <a href="#gallery">Real Works</a>
              <a href="#how-it-works">How It Works</a>
              <a href="#testimonials">Reviews</a>
              <a href="#about">Story</a>
              <a href="#faq">FAQ</a>
            </div>
            <div className="nav-actions">
              <button
                type="button"
                className="cartbtn"
                id="cartBtn"
                onClick={handleCartClick}
              >
                Cart <span className="cart-dot" id="cartCount">{displayCount}</span>
              </button>
              <button
                type="button"
                className="hamburger"
                id="hamburgerBtn"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open menu"
              >
                <span></span>
                <span></span>
                <span></span>
              </button>
              <ThemeToggle />
            </div>
          </nav>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <MobileNavigation
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        onCartClick={handleCartClick}
      />
    </>
  );
}
