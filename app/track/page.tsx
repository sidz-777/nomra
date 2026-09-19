import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/PageShell';
import { TrackOrderView } from '@/components/tracking';

export const metadata: Metadata = {
  title: 'Track Your Order | NAMORA Handcrafted Luxury Frames',
  description:
    'Live order status, artisan handcrafting milestones, and express courier tracking for your NAMORA bespoke frame.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function TrackPage() {
  return (
    <PageShell>
      <Suspense
        fallback={
          <div className="py-24 text-center text-namora-muted text-xs font-mono">
            Loading secure order tracker...
          </div>
        }
      >
        <TrackOrderView />
      </Suspense>
    </PageShell>
  );
}
