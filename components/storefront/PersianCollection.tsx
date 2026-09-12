'use client';

import React, { useState } from 'react';
import { Container } from '@/components/layout/Container';
import { SectionHeading, Pill } from '@/components/ui';
import { DesignCard } from './cards/DesignCard';
import { PERSIAN_DESIGNS } from '@/lib/storefront-data';

const CATEGORIES = [
  { id: 'all', label: 'All Designs (21)' },
  { id: 'crimson', label: 'Crimson & Ruby' },
  { id: 'blue', label: 'Royal Blue & Indigo' },
  { id: 'pastel', label: 'Pastel & Garden' },
  { id: 'amber', label: 'Amber & Heritage' },
  { id: 'vintage', label: 'Vintage & Classical' },
];

export function PersianCollection() {
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredDesigns =
    activeCategory === 'all'
      ? PERSIAN_DESIGNS
      : PERSIAN_DESIGNS.filter((d) => d.category === activeCategory);

  return (
    <section id="designs" className="py-16 sm:py-24 border-b border-namora-line">
      <Container width="wide">
        <SectionHeading
          eyebrow="Artisanal Collection"
          title="Persian & Oriental Heritage Designs"
          arabicTitle="مجموعة الزخارف الفارسية والشرقية"
          subtitle="Choose from 21 museum-quality aesthetic backgrounds. Each piece is inscribed with bespoke calligraphy and hand-framed in luxury satin black moulding."
        />

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10 sm:mb-12">
          {CATEGORIES.map((cat) => (
            <Pill
              key={cat.id}
              active={activeCategory === cat.id}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.label}
            </Pill>
          ))}
        </div>

        {/* Responsive Grid of 21 Designs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
          {filteredDesigns.map((design, idx) => (
            <DesignCard
              key={design.id}
              design={design}
              priority={idx < 4}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
