'use client';

import React, { useState } from 'react';
import { FAQItem } from './cards/FAQItem';
import { FAQ_ITEMS } from '@/lib/storefront-data';

export function FAQSection() {
  const [openId, setOpenId] = useState<string | null>(null);

  const handleToggle = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section id="faq" className="section">
      <div className="container">
        <div className="section-head reveal">
          <div className="eyebrow" style={{ justifyContent: 'center' }}>Common Questions</div>
          <h2>Frequently Asked Questions</h2>
          <p>Everything you need to know before ordering your personalized frame.</p>
        </div>

        <div className="faq-list reveal-stagger">
          {FAQ_ITEMS.map((item) => (
            <FAQItem
              key={item.id}
              item={item}
              isOpen={openId === item.id}
              onToggle={() => handleToggle(item.id)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
