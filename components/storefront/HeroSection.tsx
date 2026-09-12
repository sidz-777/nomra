import React from 'react';
import Link from 'next/link';
import { Container } from '@/components/layout/Container';
import { Button } from '@/components/ui';
import { HERO_DATA } from '@/lib/storefront-data';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden py-12 sm:py-20 lg:py-24 border-b border-namora-line">
      <Container width="wide">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Editorial Headline & Actions */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-8">
            <div className="space-y-3">
              <span className="inline-block text-xs uppercase tracking-[0.25em] font-semibold text-namora-gold">
                {HERO_DATA.eyebrow}
              </span>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-hero font-medium tracking-tight text-namora-ink leading-[1.15]">
                Because some <span className="italic text-namora-gold">names</span> deserve to be framed.
              </h1>

              <p className="text-sm sm:text-base text-namora-muted max-w-xl leading-relaxed font-light">
                {HERO_DATA.description}
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-1">
              <Link href={HERO_DATA.primaryCta.href}>
                <Button variant="primary" size="lg" className="shadow-luxury">
                  {HERO_DATA.primaryCta.label}
                </Button>
              </Link>
              <Link href={HERO_DATA.secondaryCta.href}>
                <Button variant="outline" size="lg">
                  {HERO_DATA.secondaryCta.label}
                </Button>
              </Link>
            </div>

            {/* Trust Line */}
            <div className="flex items-center gap-2 text-xs font-mono text-namora-muted pt-1 border-t border-namora-line-soft">
              <span>{HERO_DATA.trustLine}</span>
            </div>

            {/* Value Meta Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              {HERO_DATA.meta.map((item) => (
                <div
                  key={item.title}
                  className="flex items-start gap-3 p-3 rounded-lg border border-namora-line bg-namora-card/60"
                >
                  <span className="text-xl">{item.icon}</span>
                  <div>
                    <h4 className="text-xs font-medium text-namora-ink font-sans">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-namora-muted font-light mt-0.5 leading-snug">
                      {item.subtitle}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Physical A4 Luxury Showcase Media */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-md aspect-[1/1.414] rounded-xl overflow-hidden border border-namora-gold/40 shadow-luxury bg-namora-soft p-3">
              {/* Outer Frame Moulding Simulation */}
              <div className="relative w-full h-full rounded-md overflow-hidden border border-black/80 bg-black shadow-inner flex items-center justify-center">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  poster={HERO_DATA.posterAsset}
                  className="w-full h-full object-cover"
                >
                  <source src={HERO_DATA.videoAsset} type="video/mp4" />
                </video>

                {/* Subtle Luxury Glass Glare */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />

                {/* Badge Overlay */}
                <div className="absolute bottom-4 left-4 right-4 bg-black/70 backdrop-blur-md p-3 rounded-lg border border-white/10 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-hero font-medium text-namora-gold">A4 Bespoke Artwork</p>
                    <p className="text-[10px] text-white/70">Solid satin black frame included</p>
                  </div>
                  <span className="font-mono font-bold text-white text-sm">₹499</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
