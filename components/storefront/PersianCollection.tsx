'use client';

import React, { useState } from 'react';
import { DesignCard } from './cards/DesignCard';
import { PERSIAN_DESIGNS } from '@/lib/storefront-data';

export function PersianCollection() {
  const [activeCategory, setActiveCategory] = useState<
    'all' | 'crimson' | 'blue' | 'pastel' | 'antique'
  >('all');

  const filteredDesigns =
    activeCategory === 'all'
      ? PERSIAN_DESIGNS
      : activeCategory === 'antique'
      ? PERSIAN_DESIGNS.filter(
          (d) =>
            d.category === 'amber' ||
            d.category === 'vintage' ||
            (d.category as string) === 'antique'
        )
      : PERSIAN_DESIGNS.filter((d) => d.category === activeCategory);

  return (
    <section id="designs" className="section">
      <div className="container">
        <div className="section-head reveal">
          <div className="eyebrow" style={{ justifyContent: 'center' }}>
            Authentic Products
          </div>
          <h2>Select Your Frame Design</h2>
          <p>
            Choose one of our hand-picked backgrounds — preview your name live before you commit.
          </p>
        </div>

        <div className="design-filters" id="designFilters">
          <button
            type="button"
            className={`design-filter-btn ${activeCategory === 'all' ? 'active' : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            <span className="filter-dot"></span> All Designs{' '}
            <span className="filter-count">21</span>
          </button>
          <button
            type="button"
            className={`design-filter-btn ${activeCategory === 'crimson' ? 'active' : ''}`}
            onClick={() => setActiveCategory('crimson')}
          >
            <span className="filter-color-swatch swatch-crimson"></span> Persian Crimson{' '}
            <span className="filter-count">5</span>
          </button>
          <button
            type="button"
            className={`design-filter-btn ${activeCategory === 'blue' ? 'active' : ''}`}
            onClick={() => setActiveCategory('blue')}
          >
            <span className="filter-color-swatch swatch-blue"></span> Royal Blue &amp; Teal{' '}
            <span className="filter-count">3</span>
          </button>
          <button
            type="button"
            className={`design-filter-btn ${activeCategory === 'pastel' ? 'active' : ''}`}
            onClick={() => setActiveCategory('pastel')}
          >
            <span className="filter-color-swatch swatch-pastel"></span> Blush &amp; Rose{' '}
            <span className="filter-count">7</span>
          </button>
          <button
            type="button"
            className={`design-filter-btn ${activeCategory === 'antique' ? 'active' : ''}`}
            onClick={() => setActiveCategory('antique')}
          >
            <span className="filter-color-swatch swatch-antique"></span> Heritage &amp; Gold{' '}
            <span className="filter-count">6</span>
          </button>
        </div>

        <div className="designs-grid reveal-stagger" id="designGallery">
          {filteredDesigns.map((design, idx) => (
            <DesignCard
              key={design.id}
              design={design}
              priority={idx < 4}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
