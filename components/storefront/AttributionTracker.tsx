'use client';

import { useEffect } from 'react';
import { captureAttributionFromUrl } from '@/lib/analytics/attribution-client';

/**
 * First-party client component that captures URL query UTM parameters on page load.
 * Strictly first-party: no cookies to third parties, no external requests.
 */
export function AttributionTracker() {
  useEffect(() => {
    captureAttributionFromUrl();
  }, []);

  return null;
}
