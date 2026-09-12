'use client';

import React from 'react';
import Link from 'next/link';
import { NAV_LINKS, CONTACT_DATA } from '@/lib/storefront-data';
import { Button, Divider } from '@/components/ui';

interface MobileNavigationProps {
  isOpen: boolean;
  onClose: () => void;
  onCartClick?: () => void;
}

export function MobileNavigation({ isOpen, onClose, onCartClick }: MobileNavigationProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 lg:hidden bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="flex flex-col h-full max-w-xs w-full bg-namora-card border-r border-namora-line p-6 shadow-luxury overflow-y-auto ml-auto animate-in slide-in-from-right duration-300">
        {/* Header with Close */}
        <div className="flex items-center justify-between pb-4 border-b border-namora-line-soft">
          <Link
            href="/"
            onClick={onClose}
            className="font-luxury text-xl font-bold tracking-[0.25em] text-namora-gold"
          >
            NAMORA
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="w-8 h-8 rounded-full bg-namora-soft border border-namora-line flex items-center justify-center text-namora-ink hover:text-namora-gold transition"
          >
            &times;
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-1 py-6 flex-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className="px-3 py-2.5 rounded-md text-sm font-medium text-namora-ink hover:bg-namora-soft hover:text-namora-gold transition"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <Divider />

        {/* Action & Concierge Section */}
        <div className="pt-4 space-y-3">
          <Link href="#create" onClick={onClose} className="block">
            <Button variant="primary" fullWidth size="md">
              Customize Frame Now
            </Button>
          </Link>

          <a
            href={CONTACT_DATA.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-center text-xs text-namora-muted hover:text-namora-gold transition py-1"
          >
            WhatsApp Concierge: {CONTACT_DATA.whatsappPhone}
          </a>
        </div>
      </div>
    </div>
  );
}
