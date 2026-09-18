'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ReadyStockCard } from './cards/ReadyStockCard';
import { READY_STOCK_PRODUCTS } from '@/lib/storefront-data';

export function ReadyStockSection() {
  const [activeCategory, setActiveCategory] = useState<
    'all' | 'cars' | 'sports' | 'names' | 'pop'
  >('all');

  const [products, setProducts] = useState(READY_STOCK_PRODUCTS);

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
                inStock: p.in_stock !== false,
              });
            });

            setProducts((prev) =>
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

  const filteredProducts =
    activeCategory === 'all'
      ? products
      : products.filter((p) => p.category === activeCategory);

  return (
    <section
      id="ready-to-ship"
      className="section"
      style={{
        background: 'var(--bg-soft)',
        borderTop: '1px solid var(--line-soft)',
      }}
    >
      <div className="container">
        <div className="section-head reveal">
          <div className="eyebrow" style={{ color: 'var(--accent)' }}>
            ⚡ Same-Day / 24h Courier Dispatch
          </div>
          <h2 className="section-title">Ready-to-Ship Editions</h2>
          <p className="section-sub">
            Handcrafted, framed in luxury matte black, and packed in secure 4-layer box for instant dispatch. Flat ₹499 with ₹49 reservation deposit!
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="ready-stock-filter-wrapper reveal">
          <div className="ready-stock-filters">
            <button
              type="button"
              className={`ready-filter-pill ${activeCategory === 'all' ? 'active' : ''}`}
              onClick={() => setActiveCategory('all')}
            >
              ✨ All Ready Stock <span className="ready-count" id="countAll">37</span>
            </button>
            <button
              type="button"
              className={`ready-filter-pill ${activeCategory === 'cars' ? 'active' : ''}`}
              onClick={() => setActiveCategory('cars')}
            >
              🏎️ Supercars &amp; Autos <span className="ready-count" id="countCars">10</span>
            </button>
            <button
              type="button"
              className={`ready-filter-pill ${activeCategory === 'sports' ? 'active' : ''}`}
              onClick={() => setActiveCategory('sports')}
            >
              ⚽ Sports Champions <span className="ready-count" id="countSports">14</span>
            </button>
            <button
              type="button"
              className={`ready-filter-pill ${activeCategory === 'names' ? 'active' : ''}`}
              onClick={() => setActiveCategory('names')}
            >
              ✒️ Ready Names &amp; Faith <span className="ready-count" id="countNames">11</span>
            </button>
            <button
              type="button"
              className={`ready-filter-pill ${activeCategory === 'pop' ? 'active' : ''}`}
              onClick={() => setActiveCategory('pop')}
            >
              🎬 Pop Culture <span className="ready-count" id="countPop">2</span>
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="ready-stock-grid" id="readyStockGrid">
          {filteredProducts.map((product, idx) => (
            <ReadyStockCard
              key={product.id}
              product={product}
              priority={idx < 4}
            />
          ))}
        </div>

        {/* Trust Note Banner */}
        <div className="ready-stock-banner reveal">
          <div className="ready-stock-banner-icon">⚡</div>
          <div className="ready-stock-banner-content">
            <h4>100% In-Stock &amp; Ready for Delivery</h4>
            <p>
              Every frame displayed here is physically crafted in standard A4 size with solid satin black moulding, crystal acrylic glass, and high-resolution art. Flat ₹499 each (pay ₹49 now, ₹450 Cash on Delivery upon home inspection).
            </p>
          </div>
          <Link
            href="#create"
            className="btn btn-outline"
            style={{ whiteSpace: 'nowrap', marginLeft: 'auto' }}
          >
            Want a Custom Name? &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}
