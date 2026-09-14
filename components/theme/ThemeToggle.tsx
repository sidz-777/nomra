'use client';

import React from 'react';
import { useTheme } from './ThemeProvider';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      id="themeToggle"
      onClick={toggleTheme}
      className={`theme-toggle ${className}`}
      aria-label={`Toggle theme (currently ${theme} mode)`}
      title={`Toggle theme (currently ${theme} mode)`}
    >
      <span className="icon-moon">☾</span>
      <span className="icon-sun">☀</span>
    </button>
  );
}
