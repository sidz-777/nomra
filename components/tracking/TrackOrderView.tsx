'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { trackCustomerOrder } from '@/lib/tracking/tracking-service';
import { TrackingResponse } from '@/lib/tracking/types';
import { TrackOrderCard } from './TrackOrderCard';
import { buildNotFoundWhatsAppUrl } from '@/lib/tracking/status-mapper';
import { Container } from '@/components/layout/Container';

export function TrackOrderView() {
  const searchParams = useSearchParams();
  const initialParam = searchParams.get('query') || searchParams.get('orderNumber') || searchParams.get('order_number') || '';

  const [query, setQuery] = useState(initialParam);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TrackingResponse | null>(null);
  const [searchedQuery, setSearchedQuery] = useState('');

  const executeTrack = async (searchVal: string) => {
    const clean = searchVal.trim();
    if (!clean) return;

    setIsLoading(true);
    setSearchedQuery(clean);
    setResult(null);

    const data = await trackCustomerOrder(clean);
    setResult(data);
    setIsLoading(false);
  };

  useEffect(() => {
    if (initialParam) {
      setQuery(initialParam);
      executeTrack(initialParam);
    }
  }, [initialParam]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeTrack(query);
  };

  return (
    <Container width="narrow" className="py-12 sm:py-16 space-y-8">
      {/* Head section */}
      <div className="text-center space-y-2">
        <span className="text-xs uppercase font-mono tracking-widest text-namora-gold font-semibold">
          Live Dispatch Status
        </span>
        <h1 className="font-luxury text-3xl sm:text-4xl font-bold text-namora-ink tracking-tight">
          Track Your Frame Order
        </h1>
        <p className="text-xs sm:text-sm text-namora-muted max-w-md mx-auto leading-relaxed">
          Enter your 10-digit mobile number or Order ID (e.g. NAM-8421) to view real-time artisan handcrafting, quality checks, and courier dispatch milestones.
        </p>
      </div>

      {/* Search Input Box */}
      <div className="p-6 rounded-2xl border border-namora-line bg-namora-card shadow-luxury">
        <form onSubmit={handleSubmit} className="space-y-3">
          <label htmlFor="trackQueryInput" className="block text-xs font-mono text-namora-muted uppercase tracking-wider">
            Order Reference or Mobile
          </label>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <input
              id="trackQueryInput"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. 9876543210 or NAM-8421"
              maxLength={25}
              className="flex-1 px-4 py-3 rounded-xl border border-namora-line bg-namora-bg text-namora-ink text-sm focus:outline-none focus:border-namora-gold transition"
            />
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="px-6 py-3 rounded-xl bg-namora-gold hover:bg-namora-gold-hover text-black font-bold text-sm transition disabled:opacity-50 shadow-sm flex items-center justify-center gap-1.5"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin text-sm">↻</span>
                  <span>Searching...</span>
                </>
              ) : (
                <span>Track Live Order &rarr;</span>
              )}
            </button>
          </div>

          {/* Quick Demo Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-namora-muted">
            <span>Quick Demo:</span>
            <button
              type="button"
              onClick={() => {
                setQuery('NAM-8421');
                executeTrack('NAM-8421');
              }}
              className="underline text-namora-gold hover:text-namora-gold-hover"
            >
              NAM-8421 (Production Review)
            </button>
            <span>&bull;</span>
            <button
              type="button"
              onClick={() => {
                setQuery('NAM-8422');
                executeTrack('NAM-8422');
              }}
              className="underline text-namora-gold hover:text-namora-gold-hover"
            >
              NAM-8422 (Shipped / Delhivery)
            </button>
            <span>&bull;</span>
            <button
              type="button"
              onClick={() => {
                setQuery('9876543210');
                executeTrack('9876543210');
              }}
              className="underline text-namora-gold hover:text-namora-gold-hover"
            >
              9876543210 (Mobile Lookup)
            </button>
          </div>
        </form>
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="p-8 rounded-2xl border border-namora-line bg-namora-card text-center space-y-2 animate-fadeIn">
          <div className="text-3xl animate-bounce">🔍</div>
          <div className="text-sm font-semibold text-namora-ink">Searching live NAMORA dispatch records...</div>
          <p className="text-xs text-namora-muted">Connecting securely to workshop ledger &amp; logistics carriers.</p>
        </div>
      )}

      {/* Result presentation */}
      {!isLoading && result && (
        <div>
          {result.found && result.order ? (
            <TrackOrderCard order={result.order} items={result.items} />
          ) : (
            <div className="p-8 rounded-2xl border border-red-500/25 bg-red-950/20 text-center space-y-4 animate-fadeIn">
              <div className="text-3xl">🔍</div>
              <div className="font-bold text-base text-red-400">Order Not Found</div>
              <p className="text-xs sm:text-sm text-namora-muted max-w-sm mx-auto leading-relaxed">
                We couldn&apos;t locate an active order matching &ldquo;<strong className="text-namora-ink">{searchedQuery}</strong>&rdquo;. Please double check your order number (e.g. NAM-8421) or 10-digit mobile number.
              </p>
              <div>
                <a
                  href={buildNotFoundWhatsAppUrl(searchedQuery)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm transition shadow-sm"
                >
                  <span>💬</span>
                  <span>Inquire via WhatsApp Concierge</span>
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </Container>
  );
}
