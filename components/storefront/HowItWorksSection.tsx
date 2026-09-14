import React from 'react';
import { StepCard } from './cards/StepCard';
import { HOW_IT_WORKS_STEPS } from '@/lib/storefront-data';

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="section">
      <div className="container">
        <div className="section-head reveal">
          <div className="eyebrow" style={{ justifyContent: 'center' }}>
            Simple Process
          </div>
          <h2>How It Works</h2>
          <p>From choosing your design to hanging it on your wall — just three easy steps.</p>
        </div>

        <div className="steps-grid reveal-stagger">
          {HOW_IT_WORKS_STEPS.map((step) => (
            <StepCard key={step.number} step={step} />
          ))}
        </div>
      </div>
    </section>
  );
}
