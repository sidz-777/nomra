import React from 'react';
import { Container } from '@/components/layout/Container';
import { SectionHeading } from '@/components/ui';
import { GalleryItem } from './cards/GalleryItem';
import { LOOKBOOK_ITEMS } from '@/lib/storefront-data';

export function LookbookSection() {
  return (
    <section id="gallery" className="py-16 sm:py-24 border-b border-namora-line bg-namora-soft/20">
      <Container width="wide">
        <SectionHeading
          eyebrow="Real Finished Works"
          title="How It Looks in Real Life"
          subtitle="Browse through actual customized A4 frames crafted for our customers and displayed in living spaces across India."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {LOOKBOOK_ITEMS.map((item, idx) => (
            <GalleryItem key={item.id} item={item} priority={idx < 2} />
          ))}
        </div>
      </Container>
    </section>
  );
}
