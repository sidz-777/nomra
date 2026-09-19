'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DEFAULT_HOMEPAGE_CONTENT } from '@/lib/homepage-data';

export function HeroSection() {
  const [heroData, setHeroData] = useState(DEFAULT_HOMEPAGE_CONTENT.hero);

  useEffect(() => {
    let mounted = true;
    async function loadDynamicHero() {
      try {
        const res = await fetch('/api/homepage');
        if (res.ok) {
          const data = await res.json();
          if (data && data.hero && mounted) {
            setHeroData((prev) => ({
              ...prev,
              ...data.hero,
            }));
          }
        }
      } catch {
        // Resilient fallback: preserves exact approved hardcoded content
      }
    }
    loadDynamicHero();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <section className="hero">
      <div className="container hero-grid">
        <div className="reveal">
          <div className="eyebrow">{heroData.eyebrow}</div>
          <h1>
            {heroData.title.includes('names') ? (
              <>
                Because some <em>names</em> deserve to be framed.
              </>
            ) : (
              heroData.title
            )}
          </h1>
          <p>{heroData.description}</p>
          <div className="hero-cta-row">
            <Link className="btn" href={heroData.cta_primary_link || '#create'}>
              {heroData.cta_primary_label || 'Customize Yours'}
            </Link>
            <Link className="btn btn-ghost" href={heroData.cta_secondary_link || '#gallery'}>
              {heroData.cta_secondary_label || 'See Real Works'}
            </Link>
          </div>
          <div className="hero-trust-line">
            Handmade in India · Dispatches <strong id="heroDispatchDate">in 24–48 hrs</strong> · Free remake if not happy
          </div>
          <div className="hero-meta">
            <div className="hero-meta-item">
              <span className="hero-meta-icon">🎁</span>
              <div className="hero-meta-content">
                <strong>Thoughtful Gifting</strong>
                <span className="hero-meta-sub">Loved for birthdays &amp; weddings</span>
              </div>
            </div>
            <div className="hero-meta-item">
              <span className="hero-meta-icon">✒️</span>
              <div className="hero-meta-content">
                <strong>Master Calligraphy</strong>
                <span className="hero-meta-sub">Persian &amp; Arabic artistry</span>
              </div>
            </div>
            <div className="hero-meta-item">
              <span className="hero-meta-icon">✨</span>
              <div className="hero-meta-content">
                <strong>Gallery-Grade Frame</strong>
                <span className="hero-meta-sub">Satin black finish + easel stand</span>
              </div>
            </div>
          </div>
        </div>
        <div>
          <div className="product-display" id="heroDisplay">
            <video
              className="hero-video"
              autoPlay
              muted
              loop
              playsInline
              preload="none"
              poster={heroData.poster_url || '/design1.jpg'}
            >
              <source src={heroData.video_url || '/hero-video.mp4'} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      </div>
    </section>
  );
}
