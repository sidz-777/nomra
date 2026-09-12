import React from 'react';

export type ContainerWidth = 'narrow' | 'default' | 'wide' | 'full';

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  width?: ContainerWidth;
  className?: string;
  children: React.ReactNode;
}

const widthStyles: Record<ContainerWidth, string> = {
  narrow: 'max-w-3xl',    // ~768px (ideal for editorial/forms/checkout)
  default: 'max-w-6xl',   // ~1152px (standard catalog, showcase, testimonials)
  wide: 'max-w-7xl',      // ~1280px - 1440px (full customizer studio & product grids)
  full: 'max-w-none',     // 100% width
};

export function Container({
  width = 'default',
  className = '',
  children,
  ...props
}: ContainerProps) {
  return (
    <div
      className={`w-full mx-auto px-4 sm:px-6 lg:px-8 ${widthStyles[width]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
