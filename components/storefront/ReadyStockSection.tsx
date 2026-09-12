'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Container } from '@/components/layout/Container';
import { SectionHeading, Pill, Button } from '@/components/ui';
import { ReadyStockCard } from './cards/ReadyStockCard';
import { READY_STOCK_PRODUCTS } from '@/lib/storefront-data';

const READY_STOCK_CATEGORIES = [
  { id: 'all', label: `✨ All Ready Stock (${READY_STOCK_PRODUCTS.length})` },
  { id: 'cars', label: '🏎️ Supercars & Autos (10)' },
  { id: 'sports', label: '⚽ Sports Champions (14)' },
  { id: 'names', label: '✒️ Ready Names & Faith (11)' },
  { id: 'pop', label: '🎬 Pop Culture (2)' },
];

export function ReadyStockSection() {
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredProducts =
    activeCategory === 'all'
      ? READY_STOCK_PRODUCTS
      : READY_STOCK_PRODUCTS.filter((p) => p.category === activeCategory);

  return (
    <section
      id="ready-to-ship"
      className="py-16 sm:py-24 bg-namora-soft/40 border-b border-namora-line"
    >
      <Container width="wide">
        <SectionHeading
          eyebrow="⚡ Same-Day / 24h Courier Dispatch"
          title="Ready-to-Ship Editions"
          subtitle="Handcrafted, framed in luxury matte black, and packed in secure 4-layer box for instant dispatch. Flat ₹499 with ₹49 reservation deposit!"
        />

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10 sm:mb-12">
          {READY_STOCK_CATEGORIES.map((cat) => (
            <Pill
              key={cat.id}
              active={activeCategory === cat.id}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.label}
            </Pill>
          ))}
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
          {filteredProducts.map((product, idx) => (
            <ReadyStockCard
              key={product.id}
              product={product}
              priority={idx < 4}
            />
          ))}
        </div>

        {/* Trust Note Banner */}
        <div className="mt-12 sm:mt-16 p-6 sm:p-8 rounded-xl border border-namora-line bg-namora-card flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <span className="text-3xl">⚡</span>
            <div>
              <h4 className="font-hero text-base sm:text-lg font-medium text-namora-ink">
                100% In-Stock &amp; Ready for Delivery
              </h4>
              <p className="text-xs sm:text-sm text-namora-muted font-light mt-1 max-w-2xl leading-relaxed">
                Every frame displayed here is physically crafted in standard A4 size with solid satin black moulding,
                crystal acrylic glass, and high-resolution art. Flat ₹499 each (pay ₹49 now, ₹450 Cash on Delivery upon home inspection).
              </p>
            </div>
          </div>

          <Link href="#create" className="flex-shrink-0">
            <Button variant="outline" size="md">
              Want a Custom Name? &rarr;
            </Button>
          </Link>
        </div>
      </Container>
    </section>
  );
}
