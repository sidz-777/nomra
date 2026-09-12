import React from 'react';
import { Container } from '@/components/layout/Container';
import { SectionHeading } from '@/components/ui';
import { StepCard } from './cards/StepCard';
import { HOW_IT_WORKS_STEPS } from '@/lib/storefront-data';

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-16 sm:py-24 border-b border-namora-line">
      <Container width="wide">
        <SectionHeading
          eyebrow="Simple Process"
          title="How It Works"
          subtitle="From choosing your design to hanging it on your wall — just three easy steps."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {HOW_IT_WORKS_STEPS.map((step) => (
            <StepCard key={step.number} step={step} />
          ))}
        </div>
      </Container>
    </section>
  );
}
