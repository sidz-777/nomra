'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { trackCustomerOrder } from '@/lib/tracking/tracking-service';
import { TrackingResponse } from '@/lib/tracking/types';
import { TrackOrderCard } from './TrackOrderCard';
import { buildNotFoundWhatsAppUrl } from '@/lib/tracking/status-mapper';
import { Container } from '@/components/layout/Container';

export function TrackOrderView() {
  const searchParams = useSearchParams();
  const tokenParam = searchParams.get('token') || '';
  const orderNumberParam = searchParams.get('orderNumber') || searchParams.get('query') || '';
  const verificationParam = searchParams.get('verification') || searchParams.get('pin') || searchParams.get('last4') || '';

  const [token, setToken] = useState(tokenParam);
  const [orderNumber, setOrderNumber] = useState(orderNumberParam);
  const [verification, setVerification] = useState(verificationParam);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TrackingResponse | null>(null);
  const [searchedLabel, setSearchedLabel] = useState('');

  const executeTrack = useCallback(async (params: { token?: string; orderNumber?: string; verification?: string }) => {
    const cleanToken = (params.token || '').trim();
    const cleanOrder = (params.orderNumber || '').trim();
    const cleanVerif = (params.verification || '').trim();

    if (!cleanToken && (!cleanOrder || !cleanVerif)) {
      return;
    }

    setIsLoading(true);
    setSearchedLabel(cleanToken ? 'Secure Token Access' : `${cleanOrder.toUpperCase()}`);
    setResult(null);

    const data = await trackCustomerOrder({
      token: cleanToken || undefined,
      orderNumber: cleanOrder || undefined,
      verification: cleanVerif || undefined,
    });

    setResult(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (tokenParam) {
      setToken(tokenParam);
      executeTrack({ token: tokenParam });
    } else if (orderNumberParam && verificationParam) {
      setOrderNumber(orderNumberParam);
      setVerification(verificationParam);
      executeTrack({ orderNumber: orderNumberParam, verification: verificationParam });
    }
  }, [tokenParam, orderNumberParam, verificationParam, executeTrack]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeTrack({ token, orderNumber, verification });
  };

  return (
    <Container width="narrow" className="py-12 sm:py-16 space-y-8">
      {/* Head section */}
      <div className="text-center space-y-2">
        <span className="text-xs uppercase font-mono tracking-widest text-namora-gold font-semibold">
          Live Dispatch &amp; Production Status
        </span>
        <h1 className="font-luxury text-3xl sm:text-4xl font-bold text-namora-ink tracking-tight">
          Track Your Frame Order
        </h1>
        <p className="text-xs sm:text-sm text-namora-muted max-w-md mx-auto leading-relaxed">
          Access your real-time handcrafting milestones, quality inspection, and courier dispatch. For privacy and gift confidentiality, dual verification is required.
        </p>
      </div>

      {/* Direct Token Banner if active */}
      {token && (
        <div className="p-3.5 rounded-xl border border-namora-gold/30 bg-namora-gold/5 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-namora-gold">
            <span>🛡️</span>
            <span>Authenticated via Secure Order Token</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setToken('');
              setResult(null);
            }}
            className="text-[11px] underline text-namora-muted hover:text-namora-ink"
          >
            Manual Search
          </button>
        </div>
      )}

      {/* Search Input Box */}
      {!token && (
        <div className="p-6 rounded-2xl border border-namora-line bg-namora-card shadow-luxury">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="orderNumberInput" className="block text-[11px] font-mono text-namora-muted uppercase tracking-wider">
                  Order Reference
                </label>
                <input
                  id="orderNumberInput"
                  type="text"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="e.g. NAM-8429"
                  maxLength={20}
                  className="w-full px-4 py-2.5 rounded-xl border border-namora-line bg-namora-bg text-namora-ink text-sm focus:outline-none focus:border-namora-gold transition font-mono uppercase"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="verificationInput" className="block text-[11px] font-mono text-namora-muted uppercase tracking-wider">
                  Phone Last 4 Digits or PIN
                </label>
                <input
                  id="verificationInput"
                  type="text"
                  value={verification}
                  onChange={(e) => setVerification(e.target.value)}
                  placeholder="e.g. 4028 or 400001"
                  maxLength={6}
                  className="w-full px-4 py-2.5 rounded-xl border border-namora-line bg-namora-bg text-namora-ink text-sm focus:outline-none focus:border-namora-gold transition font-mono"
                />
              </div>
            </div>

            <p className="text-[11px] text-namora-muted leading-relaxed">
              🔒 <strong>Gift Privacy Guarantee:</strong> Phone-only and order-number-only lookups are restricted to prevent unauthorized viewing of personalized custom gift inscriptions.
            </p>

            <button
              type="submit"
              disabled={isLoading || !orderNumber.trim() || !verification.trim()}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-namora-gold hover:bg-namora-gold-hover text-black font-bold text-sm transition disabled:opacity-50 shadow-sm flex items-center justify-center gap-1.5"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin text-sm">↻</span>
                  <span>Verifying Ledger...</span>
                </>
              ) : (
                <span>Track Live Order &rarr;</span>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="p-8 rounded-2xl border border-namora-line bg-namora-card text-center space-y-2 animate-fadeIn">
          <div className="text-3xl animate-bounce">🔍</div>
          <div className="text-sm font-semibold text-namora-ink">Verifying NAMORA artisan dispatch records...</div>
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
              <div className="font-bold text-base text-red-400">Verification Incomplete</div>
              <p className="text-xs sm:text-sm text-namora-muted max-w-sm mx-auto leading-relaxed">
                {result.message || 'We could not verify an active order matching the provided credentials. Please confirm your Order Reference and verification digits.'}
              </p>
              <div>
                <a
                  href={buildNotFoundWhatsAppUrl(searchedLabel)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm transition shadow-sm"
                >
                  <span>💬</span>
                  <span>Inquire with NAMORA Concierge on WhatsApp</span>
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </Container>
  );
}
