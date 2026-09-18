'use client';

import React, { useState } from 'react';
import { DesignCard } from './cards/DesignCard';
import { PERSIAN_DESIGNS } from '@/lib/storefront-data';

export function PersianCollection() {
  const [activeCategory, setActiveCategory] = useState<
    'all' | 'crimson' | 'blue' | 'pastel' | 'antique'
  >('all');

  const [designs, setDesigns] = useState(PERSIAN_DESIGNS);

  React.useEffect(() => {
    let mounted = true;
    async function syncPrices() {
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const data = await res.json();
          if (data && data.success && Array.isArray(data.products) && mounted) {
            const priceMap = new Map();
            data.products.forEach((p: any) => {
              priceMap.set(p.id, {
                price: Number(p.price) || 499,
                depositPrice: Number(p.deposit_price) || 49,
                codPrice: Number(p.cod_price) || 450,
              });
            });

            setDesigns((prev) =>
              prev.map((item) => {
                const live = priceMap.get(item.id);
                if (live) {
                  return {
                    ...item,
                    price: live.price,
                    depositPrice: live.depositPrice,
                    codPrice: live.codPrice,
                  };
                }
                return item;
              })
            );
          }
        }
      } catch {}
    }
    syncPrices();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredDesigns =
    activeCategory === 'all'
      ? designs
      : activeCategory === 'antique'
      ? designs.filter(
          (d) =>
            d.category === 'amber' ||
            d.category === 'vintage' ||
            (d.category as string) === 'antique'
        )
      : designs.filter((d) => d.category === activeCategory);

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
