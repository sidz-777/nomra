'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Container } from './Container';
import { Badge } from '@/components/ui';
import { ANNOUNCEMENT_DATA } from '@/lib/storefront-data';

export function AnnouncementBar() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div
      id="announcementBar"
      className="w-full bg-namora-soft border-b border-namora-line py-2 px-3 text-center relative z-50 text-xs text-namora-ink transition-all"
    >
      <Container width="wide" className="flex items-center justify-center gap-3 relative">
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-center">
          <Badge variant="gold" size="sm" className="hidden xs:inline-flex">
            {ANNOUNCEMENT_DATA.badge}
          </Badge>
          <span className="font-light text-[11px] sm:text-xs">
            {ANNOUNCEMENT_DATA.text}
          </span>
          <Link
            href={ANNOUNCEMENT_DATA.href}
            className="text-[11px] sm:text-xs font-semibold text-namora-gold hover:text-namora-gold-hover underline underline-offset-2 transition ml-1"
          >
            {ANNOUNCEMENT_DATA.cta}
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setIsVisible(false)}
          aria-label="Close notification"
          className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-namora-muted hover:text-namora-ink text-sm leading-none transition"
        >
          &times;
        </button>
      </Container>
    </div>
  );
}
