import React from 'react';
import { Container } from '@/components/layout/Container';
import { TRUST_ITEMS } from '@/lib/storefront-data';

export function TrustStrip() {
  return (
    <div className="w-full bg-namora-soft border-b border-namora-line py-6">
      <Container width="wide">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {TRUST_ITEMS.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-namora-card/40 border border-namora-line-soft"
            >
              <div className="w-9 h-9 rounded-full bg-namora-soft border border-namora-gold/30 flex items-center justify-center text-namora-gold font-bold text-sm flex-shrink-0">
                {item.icon}
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-semibold text-namora-ink truncate">
                  {item.title}
                </h4>
                <p className="text-[11px] text-namora-muted font-light line-clamp-1 mt-0.5">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}
