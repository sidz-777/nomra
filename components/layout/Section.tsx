import React from 'react';
import { Container, ContainerWidth } from './Container';

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  id?: string;
  width?: ContainerWidth;
  containerClassName?: string;
  spacing?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hasBorderTop?: boolean;
  hasBorderBottom?: boolean;
  children: React.ReactNode;
}

const spacingStyles = {
  none: 'py-0',
  sm: 'py-8 sm:py-10',
  md: 'py-12 sm:py-16',
  lg: 'py-16 sm:py-20 lg:py-24',
  xl: 'py-20 sm:py-28 lg:py-32',
};

export function Section({
  id,
  width = 'default',
  spacing = 'lg',
  hasBorderTop = false,
  hasBorderBottom = false,
  className = '',
  containerClassName = '',
  children,
  ...props
}: SectionProps) {
  return (
    <section
      id={id}
      className={`relative w-full ${spacingStyles[spacing]} ${
        hasBorderTop ? 'border-t border-namora-line-soft' : ''
      } ${hasBorderBottom ? 'border-b border-namora-line-soft' : ''} ${className}`}
      {...props}
    >
      <Container width={width} className={containerClassName}>
        {children}
      </Container>
    </section>
  );
}
