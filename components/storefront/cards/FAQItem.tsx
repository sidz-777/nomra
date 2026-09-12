'use client';

import React from 'react';
import { FaqItem } from '@/lib/storefront-data';

interface FAQItemProps {
  item: FaqItem;
  isOpen: boolean;
  onToggle: () => void;
}

export function FAQItem({ item, isOpen, onToggle }: FAQItemProps) {
  return (
    <div className="border-b border-namora-line-soft last:border-b-0 py-4 sm:py-5">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between text-left gap-4 group focus:outline-none focus-visible:ring-2 focus-visible:ring-namora-gold rounded-sm"
      >
        <span className="font-hero text-base sm:text-lg font-medium text-namora-ink group-hover:text-namora-gold transition-colors">
          {item.question}
        </span>
        <span
          className={`w-7 h-7 rounded-full bg-namora-soft border border-namora-line flex items-center justify-center text-namora-gold text-base transition-transform duration-300 flex-shrink-0 ${
            isOpen ? 'rotate-45' : ''
          }`}
        >
          +
        </span>
      </button>

      {isOpen && (
        <div className="pt-3 pr-8 text-xs sm:text-sm text-namora-muted font-light leading-relaxed animate-in fade-in duration-200">
          {item.answer}
        </div>
      )}
    </div>
  );
}
