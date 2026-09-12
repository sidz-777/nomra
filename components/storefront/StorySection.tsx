import React from 'react';
import Image from 'next/image';
import { Container } from '@/components/layout/Container';
import { STORY_DATA } from '@/lib/storefront-data';

export function StorySection() {
  return (
    <section id="about" className="py-16 sm:py-24 border-b border-namora-line">
      <Container width="wide">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          {/* Visual Showcase */}
          <div className="lg:col-span-5 flex justify-center order-2 lg:order-1">
            <div className="relative w-full max-w-md aspect-[1/1.414] rounded-2xl overflow-hidden border border-namora-line shadow-luxury bg-namora-soft p-3">
              <div className="relative w-full h-full rounded-lg overflow-hidden border border-black/80">
                <Image
                  src={STORY_DATA.imageAsset}
                  alt="NAMORA handmade personalized frame"
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-namora-gold">
                    Atelier Craftsmanship
                  </span>
                  <p className="font-hero text-sm font-medium mt-0.5">
                    Solid wood, crystal glass &amp; gold leaf
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Editorial Story & Specifications */}
          <div className="lg:col-span-7 space-y-6 order-1 lg:order-2">
            <span className="inline-block text-xs uppercase tracking-[0.25em] font-semibold text-namora-gold">
              {STORY_DATA.eyebrow}
            </span>

            <h2 className="text-2xl sm:text-4xl font-hero font-medium tracking-tight text-namora-ink leading-tight">
              Crafted with intention, <span className="italic text-namora-gold">framed</span> with love.
            </h2>

            <div className="space-y-4 text-xs sm:text-sm text-namora-muted font-light leading-relaxed">
              {STORY_DATA.paragraphs.map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
            </div>

            {/* Craft Specs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-namora-line-soft">
              {STORY_DATA.specs.map((spec) => (
                <div
                  key={spec.name}
                  className="flex items-start gap-3 p-3 rounded-lg border border-namora-line bg-namora-card/60"
                >
                  <span className="text-xl flex-shrink-0">{spec.icon}</span>
                  <div>
                    <h4 className="text-xs font-semibold text-namora-ink">
                      {spec.name}
                    </h4>
                    <p className="text-[11px] text-namora-muted font-light mt-0.5 leading-snug">
                      {spec.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
