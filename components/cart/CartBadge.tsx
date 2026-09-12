'use client';

import React from 'react';
import { useCart } from './CartContext';

interface CartBadgeProps {
  className?: string;
}

export function CartBadge({ className = '' }: CartBadgeProps) {
  const { totals, toggleCart, isHydrated } = useCart();
  const count = isHydrated ? totals.totalFrames : 0;

  return (
    <button
      type="button"
      onClick={() => toggleCart(true)}
      aria-label={`Shopping Cart with ${count} items`}
      className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-namora-line bg-namora-soft/80 text-namora-ink hover:border-namora-gold hover:text-namora-gold transition text-xs font-medium ${className}`}
    >
      <span>Cart</span>
      <span className="w-5 h-5 rounded-full bg-namora-gold text-black font-mono text-[10px] font-bold flex items-center justify-center transition-transform active:scale-90">
        {count}
      </span>
    </button>
  );
}
