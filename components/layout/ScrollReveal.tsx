'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * ScrollReveal Component
 * Automatically attaches an IntersectionObserver to all .reveal and .reveal-stagger
 * elements, activating them with the .visible class on scroll or immediately if already in view.
 * Matches the exact behavior from the legacy vanilla implementation with support for Next.js routing.
 */
export function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let activeObserver: IntersectionObserver | null = null;

    const revealElements = () => {
      const revealEls = document.querySelectorAll(
        '.reveal:not(.visible), .reveal-stagger:not(.visible)'
      );
      if (!revealEls.length) return;

      if (!('IntersectionObserver' in window)) {
        revealEls.forEach((el) => el.classList.add('visible'));
        return;
      }

      if (!activeObserver) {
        activeObserver = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                activeObserver?.unobserve(entry.target);
              }
            });
          },
          {
            threshold: 0.05,
            rootMargin: '0px 0px -20px 0px',
          }
        );
      }

      revealEls.forEach((el) => {
        const rect = el.getBoundingClientRect();
        // If element is already in or above viewport, reveal immediately
        if (rect.top <= window.innerHeight) {
          el.classList.add('visible');
        } else {
          activeObserver?.observe(el);
        }
      });
    };

    // Run on mount and pathname change
    revealElements();

    // Observe future DOM insertions (e.g. dynamic state changes or hydrated sections)
    const mutationObserver = new MutationObserver(() => {
      revealElements();
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      if (activeObserver) {
        activeObserver.disconnect();
      }
      mutationObserver.disconnect();
    };
  }, [pathname]);

  return null;
}
