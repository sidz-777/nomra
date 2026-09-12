import React from 'react';
import type { Metadata } from 'next';
import { PageShell } from '@/components/layout/PageShell';
import { PersonalizationStudio } from '@/components/customizer';

export const metadata: Metadata = {
  title: 'Personalize Your A4 Wall Frame — NAMORA Custom Studio',
  description:
    'Custom Arabic and English calligraphy wall frames handcrafted on authentic Persian artwork backgrounds.',
};

export default function CustomizePage() {
  return (
    <PageShell>
      <div className="py-6">
        <PersonalizationStudio />
      </div>
    </PageShell>
  );
}
