'use client';

import React, { useState, useEffect } from 'react';

interface GalleryItem {
  id?: string;
  image: string;
  title: string;
  caption: string;
}

const DEFAULT_GALLERY_ITEMS: GalleryItem[] = [
  {
    image: '/frame1.jpg',
    title: 'Fatima — Red Persian Frame',
    caption: 'Customized Wall Frame Sample 1',
  },
  {
    image: '/frame2.jpeg',
    title: 'Omar — Blue Oriental Frame',
    caption: 'Customized Wall Frame Sample 2',
  },
  {
    image: '/frame3.jpeg',
    title: 'Aisha — Purple Floral Frame',
    caption: 'Customized Wall Frame Sample 3',
  },
  {
    image: '/frame4.jpg',
    title: 'Zayd — Book Stack Rug Frame',
    caption: 'Customized Wall Frame Sample 4',
  },
];

export function LookbookSection() {
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>(DEFAULT_GALLERY_ITEMS);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    async function loadDynamicGallery() {
      try {
        const res = await fetch('/api/gallery');
        if (res.ok) {
          const data = await res.json();
          if (data && data.success && Array.isArray(data.items) && data.items.length > 0 && mounted) {
            setGalleryItems(data.items);
          }
        }
      } catch {
        // Resilient fallback: preserves DEFAULT_GALLERY_ITEMS
      }
    }
    loadDynamicGallery();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (lightboxIndex === null) return;
      if (e.key === 'Escape') setLightboxIndex(null);
      if (e.key === 'ArrowLeft')
        setLightboxIndex((prev) =>
          prev! > 0 ? prev! - 1 : galleryItems.length - 1
        );
      if (e.key === 'ArrowRight')
        setLightboxIndex((prev) =>
          prev! < galleryItems.length - 1 ? prev! + 1 : 0
        );
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, galleryItems.length]);

  const activeItem = lightboxIndex !== null ? galleryItems[lightboxIndex] : null;

  return (
    <>
      <section
        id="gallery"
        className="section"
        style={{
          background: 'var(--card)',
          borderTop: '1px solid var(--line-soft)',
          borderBottom: '1px solid var(--line-soft)',
        }}
      >
        <div className="container">
          <div className="section-head reveal">
            <div className="eyebrow" style={{ justifyContent: 'center' }}>
              Real Finished Works
            </div>
            <h2>How It Looks in Real Life</h2>
            <p>Browse through actual customized A4 frames crafted for our customers.</p>
          </div>

          <div className="real-gallery-grid reveal-stagger">
            {galleryItems.map((item, idx) => (
              <div
                key={item.id || item.title + idx}
                className="gallery-card"
                onClick={() => setLightboxIndex(idx)}
                style={{ cursor: 'pointer' }}
              >
                <img src={item.image} alt={item.caption || item.title} loading="lazy" />
                <div className="gallery-caption">
                  <span>{item.title}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LIGHTBOX MODAL */}
      <div
        className={`lightbox ${activeItem ? 'open' : ''}`}
        id="lightbox"
        onClick={() => setLightboxIndex(null)}
      >
        <button
          type="button"
          className="lightbox-close"
          onClick={() => setLightboxIndex(null)}
          aria-label="Close"
        >
          &times;
        </button>
        <button
          type="button"
          className="lightbox-nav prev"
          onClick={(e) => {
            e.stopPropagation();
            setLightboxIndex((prev) =>
              prev! > 0 ? prev! - 1 : galleryItems.length - 1
            );
          }}
          aria-label="Previous"
        >
          ‹
        </button>
        <button
          type="button"
          className="lightbox-nav next"
          onClick={(e) => {
            e.stopPropagation();
            setLightboxIndex((prev) =>
              prev! < galleryItems.length - 1 ? prev! + 1 : 0
            );
          }}
          aria-label="Next"
        >
          ›
        </button>

        {activeItem && (
          <div
            className="lightbox-image-wrap"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              id="lightboxImage"
              src={activeItem.image}
              alt={activeItem.caption || activeItem.title}
            />
            <div className="lightbox-caption" id="lightboxCaption">
              {activeItem.title} — Authentic A4 Matte Black Wall Frame (₹499)
            </div>
          </div>
        )}
      </div>
    </>
  );
}
