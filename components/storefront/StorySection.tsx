import React from 'react';
import Image from 'next/image';

export function StorySection() {
  return (
    <section id="about" className="section">
      <div className="container">
        <div className="about-grid reveal">
          <div className="about-visual">
            <Image
              src="/frame1.jpg"
              alt="NAMORA handmade personalized frame"
              width={600}
              height={750}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>

          <div className="about-content">
            <div className="eyebrow">Our Story</div>
            <h2>Crafted with intention, <em>framed</em> with love.</h2>
            <p>NAMORA began with a simple belief — that a name is more than a word. It carries identity, memory, and
              meaning. Every frame we create is a small tribute to the people who matter most.</p>
            <p>Each piece is hand-finished on authentic Persian and oriental aesthetic backgrounds, carefully selected
              for their warmth and texture. From the first sketch to the final wrap, everything is done with intention.
            </p>
            <p>Whether it's a gift for a newborn, a milestone, or a home you're building — we're honored to be a small
              part of your story.</p>

            <div className="about-stats">
              <div>
                <div className="about-stat-num">500+</div>
                <div className="about-stat-label">Frames Crafted</div>
              </div>
              <div>
                <div className="about-stat-num">4.9★</div>
                <div className="about-stat-label">Avg. Rating</div>
              </div>
              <div>
                <div className="about-stat-num">100%</div>
                <div className="about-stat-label">Handmade</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
