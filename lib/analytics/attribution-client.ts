/**
 * NAMORA First-Party Attribution Engine (Client-Side)
 * Strictly First-Party: Zero third-party scripts, zero external tracking pixels.
 * Captures marketing parameters and external referrers in first-party browser storage
 * and forwards them to checkout order creation.
 */

export interface FirstPartyAttribution {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  campaign_id?: string;
  referrer?: string;
  landing_path?: string;
  captured_at?: string;
}

const STORAGE_KEY_SESSION = 'namora_attribution_session';
const STORAGE_KEY_PERSISTENT = 'namora_attribution_last_touch';

/**
 * Parses UTM and campaign parameters from URL and captures external referrer.
 * Runs on client hydration.
 */
export function captureAttributionFromUrl(): FirstPartyAttribution | null {
  if (typeof window === 'undefined') return null;

  try {
    const url = new URL(window.location.href);
    const searchParams = url.searchParams;

    const utmSource = searchParams.get('utm_source')?.trim();
    const utmMedium = searchParams.get('utm_medium')?.trim();
    const utmCampaign = searchParams.get('utm_campaign')?.trim();
    const utmTerm = searchParams.get('utm_term')?.trim();
    const utmContent = searchParams.get('utm_content')?.trim();
    const campaignId = (searchParams.get('campaign_id') || searchParams.get('cid'))?.trim();

    // Check external referrer (ignore same-origin navigation)
    let externalReferrer = '';
    if (document.referrer) {
      try {
        const refUrl = new URL(document.referrer);
        if (refUrl.hostname !== window.location.hostname) {
          externalReferrer = document.referrer.slice(0, 255);
        }
      } catch {}
    }

    const hasUtm = Boolean(utmSource || utmMedium || utmCampaign || campaignId);

    if (hasUtm || externalReferrer) {
      const attribution: FirstPartyAttribution = {
        utm_source: utmSource || undefined,
        utm_medium: utmMedium || undefined,
        utm_campaign: utmCampaign || undefined,
        utm_term: utmTerm || undefined,
        utm_content: utmContent || undefined,
        campaign_id: campaignId || undefined,
        referrer: externalReferrer || undefined,
        landing_path: window.location.pathname,
        captured_at: new Date().toISOString(),
      };

      // Store in current session
      try {
        window.sessionStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(attribution));
      } catch {}

      // Store in persistent localStorage (30-day attribution window)
      try {
        window.localStorage.setItem(STORAGE_KEY_PERSISTENT, JSON.stringify(attribution));
      } catch {}

      return attribution;
    }
  } catch (err) {
    console.warn('[Attribution] Capture error:', err);
  }

  return null;
}

/**
 * Retrieves the active attribution data, prioritizing current session touch over persistent last touch.
 */
export function getStoredAttribution(): FirstPartyAttribution {
  if (typeof window === 'undefined') return {};

  try {
    // 1. Check Session Storage (Current Visit)
    const sessionData = window.sessionStorage.getItem(STORAGE_KEY_SESSION);
    if (sessionData) {
      const parsed = JSON.parse(sessionData);
      if (parsed && typeof parsed === 'object') return parsed;
    }

    // 2. Check Local Storage (Last Touch within 30 days)
    const persistentData = window.localStorage.getItem(STORAGE_KEY_PERSISTENT);
    if (persistentData) {
      const parsed = JSON.parse(persistentData);
      if (parsed && typeof parsed === 'object') {
        const capturedTime = new Date(parsed.captured_at || 0).getTime();
        const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
        if (Date.now() - capturedTime < thirtyDaysMs) {
          return parsed;
        }
      }
    }
  } catch {}

  return {};
}

/**
 * Clears stored attribution (used for testing or explicit consent reset).
 */
export function clearStoredAttribution(): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY_SESSION);
    window.localStorage.removeItem(STORAGE_KEY_PERSISTENT);
  } catch {}
}
