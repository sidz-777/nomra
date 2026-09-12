'use client';

import React, { useEffect } from 'react';
import { IconButton } from './IconButton';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  badge?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function Drawer({
  isOpen,
  onClose,
  title,
  badge,
  children,
  footer,
}: DrawerProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-namora-card border-l border-namora-line shadow-luxury flex flex-col animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-namora-line-soft">
            <div className="flex items-center gap-2">
              {title && (
                <h2 className="text-xl font-hero font-medium text-namora-ink">
                  {title}
                </h2>
              )}
              {badge && (
                <span className="px-2 py-0.5 text-xs font-mono bg-namora-gold/15 text-namora-gold rounded-full border border-namora-gold/30">
                  {badge}
                </span>
              )}
            </div>
            <IconButton
              label="Close drawer"
              size="sm"
              variant="ghost"
              onClick={onClose}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </IconButton>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {children}
          </div>

          {/* Optional Footer (e.g. checkout CTA, totals) */}
          {footer && (
            <div className="p-6 border-t border-namora-line bg-namora-soft/60">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
