'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ReadyStockCard } from './cards/ReadyStockCard';
import { READY_STOCK_PRODUCTS, ReadyStockItem } from '@/lib/storefront-data';

export function ReadyStockSection() {
  const [activeCategory, setActiveCategory] = useState<
    'all' | 'cars' | 'sports' | 'names' | 'pop'
  >('all');

  const [products, setProducts] = useState<ReadyStockItem[]>(READY_STOCK_PRODUCTS);
  const [productBadges, setProductBadges] = useState<Record<string, string>>({});

  useEffect(() => {
    let mounted = true;
    async function loadDynamicReadyStock() {
      try {
        const [prodRes, campRes] = await Promise.allSettled([
          fetch('/api/products?type=ready_stock'),
          fetch('/api/campaigns'),
        ]);

        if (campRes.status === 'fulfilled' && campRes.value.ok) {
          const campData = await campRes.value.json();
          if (campData && campData.productBadges && mounted) {
            setProductBadges(campData.productBadges);
          }
        }

        if (prodRes.status === 'fulfilled' && prodRes.value.ok) {
          const data = await prodRes.value.json();
          if (data && data.success && Array.isArray(data.products) && data.products.length > 0 && mounted) {
            const mapped: ReadyStockItem[] = data.products
              .filter((p: any) => p.is_active !== false)
              .map((p: any) => ({
                id: p.id,
                category: (p.category || 'cars') as any,
                categoryLabel: p.category_label || p.category || 'Ready Stock',
                title: p.title,
                subtitle: p.subtitle || '',
                image: p.image_url || p.image || 'car-1.jpg',
                assetPath: p.image_url || p.image || '/assets/products/car-1.jpg',
                tag: p.tag || 'READY TO SHIP',
                tagClass: p.tag_class || 'badge-popular',
                price: Number(p.price) || 499,
                depositPrice: Number(p.deposit_price) || 49,
                codPrice: Number(p.cod_price) || 450,
              }));
            setProducts(mapped);
          }
        }
      } catch {
        // Resilient fallback: keeps READY_STOCK_PRODUCTS untouched
      }
    }
    loadDynamicReadyStock();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredProducts =
    activeCategory === 'all'
      ? products
      : products.filter((p) => p.category === activeCategory);

  const countAll = products.length;
  const countCars = products.filter((p) => p.category === 'cars').length;
  const countSports = products.filter((p) => p.category === 'sports').length;
  const countNames = products.filter((p) => p.category === 'names').length;
  const countPop = products.filter((p) => p.category === 'pop').length;

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
              ✨ All Ready Stock <span className="ready-count" id="countAll">{countAll}</span>
            </button>
            <button
              type="button"
              className={`ready-filter-pill ${activeCategory === 'cars' ? 'active' : ''}`}
              onClick={() => setActiveCategory('cars')}
            >
              🏎️ Supercars &amp; Autos <span className="ready-count" id="countCars">{countCars}</span>
            </button>
            <button
              type="button"
              className={`ready-filter-pill ${activeCategory === 'sports' ? 'active' : ''}`}
              onClick={() => setActiveCategory('sports')}
            >
              ⚽ Sports Champions <span className="ready-count" id="countSports">{countSports}</span>
            </button>
            <button
              type="button"
              className={`ready-filter-pill ${activeCategory === 'names' ? 'active' : ''}`}
              onClick={() => setActiveCategory('names')}
            >
              ✒️ Ready Names &amp; Faith <span className="ready-count" id="countNames">{countNames}</span>
            </button>
            <button
              type="button"
              className={`ready-filter-pill ${activeCategory === 'pop' ? 'active' : ''}`}
              onClick={() => setActiveCategory('pop')}
            >
              🎬 Pop Culture <span className="ready-count" id="countPop">{countPop}</span>
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
              badgeOverride={productBadges[product.id]}
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
