'use client';

import React from 'react';
import { FaqItem } from '@/lib/storefront-data';

interface FAQItemProps {
  item: FaqItem;
  isOpen: boolean;
  onToggle: () => void;
}

export function FAQItem({ item, isOpen, onToggle }: FAQItemProps) {
  return (
    <div className={`faq-item ${isOpen ? 'open' : ''}`}>
      <button
        type="button"
        className="faq-question"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span>{item.question}</span>
        <span className="faq-icon">+</span>
      </button>
      <div className="faq-answer">
        <div
          className="faq-answer-inner"
          dangerouslySetInnerHTML={{ __html: item.answer }}
        />
      </div>
    </div>
  );
}
