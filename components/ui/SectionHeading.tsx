import React from 'react';

export interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  arabicTitle?: string;
  subtitle?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  arabicTitle,
  subtitle,
  align = 'center',
  className = '',
}: SectionHeadingProps) {
  const alignClass = {
    left: 'text-left items-start',
    center: 'text-center items-center',
    right: 'text-right items-end',
  }[align];

  return (
    <div className={`flex flex-col mb-8 sm:mb-12 ${alignClass} ${className}`}>
      {eyebrow && (
        <span className="inline-block text-xs uppercase tracking-[0.25em] font-semibold text-namora-gold mb-2.5">
          {eyebrow}
        </span>
      )}

      <h2 className="text-2xl sm:text-3xl md:text-4xl font-hero font-normal tracking-wide text-namora-ink mb-3 leading-tight">
        {title}
      </h2>

      {arabicTitle && (
        <span
          dir="rtl"
          className="font-arabic text-xl sm:text-2xl text-namora-gold/90 mb-3"
        >
          {arabicTitle}
        </span>
      )}

      {subtitle && (
        <p className="text-sm sm:text-base text-namora-muted max-w-2xl leading-relaxed font-sans font-light">
          {subtitle}
        </p>
      )}
    </div>
  );
}
