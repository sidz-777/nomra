'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application runtime boundary error caught:', error?.message);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center bg-[#141210] text-[#F5EFE6]">
      <div className="w-16 h-16 rounded-full bg-[#D4AF6A]/10 text-[#D4AF6A] flex items-center justify-center text-2xl font-serif mb-4 border border-[#D4AF6A]/30">
        ✦
      </div>
      <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#F5EFE6] mb-2 tracking-wide">
        Something went wrong
      </h2>
      <p className="text-xs sm:text-sm text-[#A39684] max-w-md mx-auto mb-6 font-sans leading-relaxed">
        Our craftsmanship platform encountered an unexpected temporary error. Your cart and selections remain securely preserved.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="px-6 py-2.5 bg-[#D4AF6A] hover:bg-[#E5C384] text-[#141210] font-semibold text-xs tracking-wider uppercase font-mono rounded-lg transition-all shadow-md"
        >
          Try Again ↺
        </button>
        <Link
          href="/"
          className="px-6 py-2.5 bg-[#1A1816] hover:border-[#D4AF6A] border border-[#2D2722] text-[#F5EFE6] text-xs tracking-wider uppercase font-mono rounded-lg transition-all"
        >
          Return Home &rarr;
        </Link>
      </div>
    </div>
  );
}
