'use client';

import React, { useState, useEffect } from 'react';
import { trackCustomerOrder } from '@/lib/tracking/tracking-service';
import { TrackingResponse } from '@/lib/tracking/types';
import { TrackOrderCard } from './TrackOrderCard';
import { buildNotFoundWhatsAppUrl } from '@/lib/tracking/status-mapper';

interface TrackOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

export function TrackOrderModal({ isOpen, onClose, initialQuery = '' }: TrackOrderModalProps) {
  const [query, setQuery] = useState(initialQuery);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TrackingResponse | null>(null);
  const [searchedQuery, setSearchedQuery] = useState('');

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleTrack = async (searchVal?: string) => {
    const val = (searchVal !== undefined ? searchVal : query).trim();
    if (!val) return;

    setIsLoading(true);
    setSearchedQuery(val);
    setResult(null);

    const data = await trackCustomerOrder(val);
    setResult(data);
    setIsLoading(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="track-order-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-namora-card border border-namora-line rounded-2xl p-6 sm:p-8 shadow-luxury text-namora-ink transition-all">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close track modal"
          className="absolute top-4 right-4 w-8 h-8 rounded-full border border-namora-line bg-namora-soft/60 flex items-center justify-center text-namora-muted hover:text-namora-ink hover:border-namora-gold transition"
        >
          &times;
        </button>

        {/* Modal Head */}
        <div className="mb-6">
          <span className="text-[10px] uppercase font-mono tracking-widest text-namora-gold block mb-1">
            Live Dispatch Status
          </span>
          <h2 id="track-order-modal-title" className="font-luxury text-xl sm:text-2xl font-bold text-namora-ink">
            Track Your Frame Order
          </h2>
          <p className="text-xs text-namora-muted mt-1 leading-relaxed">
            Enter your 10-digit mobile number or Order ID to view real-time handcrafting &amp; shipment progress.
          </p>
        </div>

        {/* Search Input Row */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleTrack();
          }}
          className="space-y-2 mb-4"
        >
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. 9876543210 or NAM-8421"
              maxLength={20}
              className="flex-1 px-3.5 py-2.5 rounded-xl border border-namora-line bg-namora-bg text-namora-ink text-xs sm:text-sm focus:outline-none focus:border-namora-gold transition"
              autoFocus
            />
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="px-4 py-2.5 rounded-xl bg-namora-gold hover:bg-namora-gold-hover text-black font-bold text-xs sm:text-sm transition disabled:opacity-50 shadow-sm"
            >
              {isLoading ? '...' : 'Track \u2192'}
            </button>
          </div>

          {/* Quick Demo Chips */}
          <div className="flex items-center gap-2 pt-1 text-[11px] text-namora-muted">
            <span>Quick test:</span>
            <button
              type="button"
              onClick={() => {
                setQuery('NAM-8421');
                handleTrack('NAM-8421');
              }}
              className="underline text-namora-gold hover:text-namora-gold-hover"
            >
              NAM-8421
            </button>
            <span>&bull;</span>
            <button
              type="button"
              onClick={() => {
                setQuery('9876543210');
                handleTrack('9876543210');
              }}
              className="underline text-namora-gold hover:text-namora-gold-hover"
            >
              9876543210
            </button>
          </div>
        </form>

        {/* Loading State */}
        {isLoading && (
          <div className="py-8 text-center space-y-2">
            <div className="text-2xl animate-pulse">🔍</div>
            <div className="text-xs text-namora-muted">Searching live NAMORA dispatch records...</div>
          </div>
        )}

        {/* Result Area */}
        {!isLoading && result && (
          <div className="pt-4 border-t border-namora-line-soft">
            {result.found && result.order ? (
              <TrackOrderCard order={result.order} items={result.items} />
            ) : (
              <div className="p-6 rounded-xl border border-red-500/25 bg-red-950/20 text-center space-y-3">
                <div className="text-2xl">🔍</div>
                <div className="font-bold text-sm text-red-400">Order Not Found</div>
                <p className="text-xs text-namora-muted max-w-xs mx-auto leading-relaxed">
                  We couldn&apos;t locate an active order matching &ldquo;<strong>{searchedQuery}</strong>&rdquo;. Please double check your order number (e.g. NAM-8421) or 10-digit mobile number.
                </p>
                <a
                  href={buildNotFoundWhatsAppUrl(searchedQuery)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition"
                >
                  <span>💬</span> Inquire via WhatsApp Concierge
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
