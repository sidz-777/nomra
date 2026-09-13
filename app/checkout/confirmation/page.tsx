import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/PageShell';
import { Container } from '@/components/layout/Container';
import { ConfirmationContent } from '@/components/checkout/ConfirmationContent';

export const metadata: Metadata = {
  title: 'Order Confirmation | NAMORA Handcrafted Frames',
  description:
    'Your bespoke wall frame order confirmation and advance deposit verification.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function OrderConfirmationPage() {
  return (
    <PageShell>
      <Container width="default" className="py-12 sm:py-16">
        <Suspense
          fallback={
            <div className="py-16 text-center">
              <div className="w-8 h-8 border-2 border-namora-gold border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-mono text-namora-muted mt-3">Loading confirmation...</p>
            </div>
          }
        >
          <ConfirmationContent />
        </Suspense>
      </Container>
    </PageShell>
  );
}
