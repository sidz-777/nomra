import React from 'react';
import Link from 'next/link';

export function HeroSection() {
  return (
    <section className="hero">
      <div className="container hero-grid">
        <div className="reveal">
          <div className="eyebrow">Real Handmade Wall Frames</div>
          <h1>
            Because some <em>names</em> deserve to be framed.
          </h1>
          <p>
            Personalized A4 framed calligraphy crafted on authentic Persian &amp; oriental aesthetic backgrounds —
            hand-finished, delivered to your door.
          </p>
          <div className="hero-cta-row">
            <Link className="btn" href="#create">
              Customize Yours
            </Link>
            <Link className="btn btn-ghost" href="#gallery">
              See Real Works
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
              poster="/design1.jpg"
            >
              <source src="/hero-video.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      </div>
    </section>
  );
}
