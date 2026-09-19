'use client';

import React, { useState, useEffect } from 'react';
import { DesignCard } from './cards/DesignCard';
import { PERSIAN_DESIGNS, PersianDesignItem } from '@/lib/storefront-data';

export function PersianCollection() {
  const [activeCategory, setActiveCategory] = useState<
    'all' | 'crimson' | 'blue' | 'pastel' | 'antique'
  >('all');

  const [designs, setDesigns] = useState<PersianDesignItem[]>(PERSIAN_DESIGNS);

  useEffect(() => {
    let mounted = true;
    async function loadDynamicDesigns() {
      try {
        // 1. Fetch live active designs from CMS endpoint
        const designsRes = await fetch('/api/designs');
        let liveDesigns = PERSIAN_DESIGNS;
        if (designsRes.ok) {
          const dData = await designsRes.json();
          if (dData && dData.success && Array.isArray(dData.designs) && dData.designs.length > 0) {
            liveDesigns = dData.designs;
          }
        }

        // 2. Sync any real-time price overrides from products endpoint
        const productsRes = await fetch('/api/products');
        if (productsRes.ok) {
          const pData = await productsRes.json();
          if (pData && pData.success && Array.isArray(pData.products)) {
            const priceMap = new Map();
            pData.products.forEach((p: any) => {
              priceMap.set(p.id, {
                price: Number(p.price) || 499,
                depositPrice: Number(p.deposit_price) || 49,
                codPrice: Number(p.cod_price) || 450,
              });
            });

            liveDesigns = liveDesigns.map((item: any) => {
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
            });
          }
        }

        if (mounted) {
          setDesigns(liveDesigns);
        }
      } catch (e) {
        // Resilient fallback: keeps PERSIAN_DESIGNS untouched
      }
    }

    loadDynamicDesigns();
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

  const countAll = designs.length;
  const countCrimson = designs.filter((d) => d.category === 'crimson').length;
  const countBlue = designs.filter((d) => d.category === 'blue').length;
  const countPastel = designs.filter((d) => d.category === 'pastel').length;
  const countAntique = designs.filter(
    (d) =>
      d.category === 'amber' ||
      d.category === 'vintage' ||
      (d.category as string) === 'antique'
  ).length;

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
            <span className="filter-count">{countAll}</span>
          </button>
          <button
            type="button"
            className={`design-filter-btn ${activeCategory === 'crimson' ? 'active' : ''}`}
            onClick={() => setActiveCategory('crimson')}
          >
            <span className="filter-color-swatch swatch-crimson"></span> Persian Crimson{' '}
            <span className="filter-count">{countCrimson}</span>
          </button>
          <button
            type="button"
            className={`design-filter-btn ${activeCategory === 'blue' ? 'active' : ''}`}
            onClick={() => setActiveCategory('blue')}
          >
            <span className="filter-color-swatch swatch-blue"></span> Royal Blue &amp; Teal{' '}
            <span className="filter-count">{countBlue}</span>
          </button>
          <button
            type="button"
            className={`design-filter-btn ${activeCategory === 'pastel' ? 'active' : ''}`}
            onClick={() => setActiveCategory('pastel')}
          >
            <span className="filter-color-swatch swatch-pastel"></span> Blush &amp; Rose{' '}
            <span className="filter-count">{countPastel}</span>
          </button>
          <button
            type="button"
            className={`design-filter-btn ${activeCategory === 'antique' ? 'active' : ''}`}
            onClick={() => setActiveCategory('antique')}
          >
            <span className="filter-color-swatch swatch-antique"></span> Heritage &amp; Gold{' '}
            <span className="filter-count">{countAntique}</span>
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
