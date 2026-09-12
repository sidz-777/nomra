import React from 'react';
import { Card } from '@/components/ui';
import { HowItWorksStep } from '@/lib/storefront-data';

interface StepCardProps {
  step: HowItWorksStep;
}

export function StepCard({ step }: StepCardProps) {
  return (
    <Card
      variant="standard"
      className="relative p-6 sm:p-8 flex flex-col items-start bg-namora-card border border-namora-line hover:border-namora-gold/50 transition-colors"
    >
      {/* Step Number Badge */}
      <div className="w-10 h-10 rounded-full bg-namora-soft border border-namora-gold/40 flex items-center justify-center text-namora-gold font-mono font-bold text-base mb-5 shadow-subtle">
        {step.number}
      </div>

      <div className="text-2xl mb-2">{step.icon}</div>

      <h3 className="font-hero text-lg sm:text-xl font-medium text-namora-ink mb-2">
        {step.title}
      </h3>

      <p className="text-xs sm:text-sm text-namora-muted font-light leading-relaxed">
        {step.description}
      </p>
    </Card>
  );
}
