'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

export default function CheckoutError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Checkout error boundary caught:', error?.message);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center bg-namora-bg text-namora-ink">
      <div className="w-14 h-14 rounded-full bg-red-950/40 text-red-400 flex items-center justify-center text-xl font-serif mb-4 border border-red-500/30">
        ⚠️
      </div>
      <h2 className="font-hero text-xl sm:text-2xl font-bold text-namora-ink mb-2">
        Unable to Complete Checkout
      </h2>
      <p className="text-xs sm:text-sm text-namora-muted max-w-md mx-auto mb-6 leading-relaxed font-sans">
        We could not establish a connection to verify your frame booking. Your customized details have been safely stored in your cart.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="px-6 py-2.5 bg-namora-gold text-namora-bg font-semibold text-xs uppercase font-mono rounded-lg shadow-md hover:bg-namora-gold-hover transition-all"
        >
          Retry Booking ↺
        </button>
        <Link
          href="/"
          className="px-6 py-2.5 bg-namora-card border border-namora-line text-namora-ink text-xs uppercase font-mono rounded-lg hover:border-namora-gold transition-all"
        >
          Back to Frames
        </Link>
      </div>
    </div>
  );
}
