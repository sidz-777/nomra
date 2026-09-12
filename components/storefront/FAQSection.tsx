'use client';

import React, { useState } from 'react';
import { Container } from '@/components/layout/Container';
import { SectionHeading } from '@/components/ui';
import { FAQItem } from './cards/FAQItem';
import { FAQ_ITEMS } from '@/lib/storefront-data';

export function FAQSection() {
  const [openId, setOpenId] = useState<string | null>(FAQ_ITEMS[0].id);

  const handleToggle = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section id="faq" className="py-16 sm:py-24 border-b border-namora-line bg-namora-soft/20">
      <Container width="narrow">
        <SectionHeading
          eyebrow="Common Questions"
          title="Frequently Asked Questions"
          subtitle="Everything you need to know before ordering your personalized frame."
        />

        <div className="border border-namora-line rounded-xl bg-namora-card p-6 sm:p-8 shadow-card divide-y divide-namora-line-soft">
          {FAQ_ITEMS.map((item) => (
            <FAQItem
              key={item.id}
              item={item}
              isOpen={openId === item.id}
              onToggle={() => handleToggle(item.id)}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
