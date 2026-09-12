import React from 'react';
import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/PageShell';
import { CheckoutView } from '@/components/checkout';

export const metadata: Metadata = {
  title: 'Secure Checkout — NAMORA Custom Wall Frames',
  description: 'Finalize your handcrafted calligraphy frame booking with ₹49 reservation deposit and Cash on Delivery.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function CheckoutPage() {
  return (
    <PageShell>
      <div className="min-h-[75vh] py-4 sm:py-8 bg-namora-bg">
        <CheckoutView />
      </div>
    </PageShell>
  );
}
