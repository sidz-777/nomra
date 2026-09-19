'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export function AnnouncementBar() {
  const [isVisible, setIsVisible] = useState(true);
  const [badge, setBadge] = useState('FESTIVE GIFTING');
  const [text, setText] = useState(
    '✨ Handcrafted in India • Free Express Air Delivery • Reserve with ₹49, Pay Balance ₹450 on COD'
  );
  const [ctaLabel, setCtaLabel] = useState('Customize Yours →');
  const [ctaLink, setCtaLink] = useState('#create');

  useEffect(() => {
    let mounted = true;
    async function loadDynamicAnnouncement() {
      try {
        const res = await fetch('/api/homepage');
        if (res.ok) {
          const data = await res.json();
          if (data && data.announcement && mounted) {
            if (data.announcement.enabled === false) {
              setIsVisible(false);
              return;
            }
            if (data.announcement.badge) setBadge(data.announcement.badge);
            if (data.announcement.text) setText(data.announcement.text);
            if (data.announcement.cta_label) setCtaLabel(data.announcement.cta_label);
            if (data.announcement.cta_link) setCtaLink(data.announcement.cta_link);
          }
        }
      } catch {
        // Resilient fallback preserves hardcoded approved announcement
      }
    }
    loadDynamicAnnouncement();
    return () => {
      mounted = false;
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className="announcement-bar" id="announcementBar">
      <div className="container announcement-inner">
        <div className="announcement-content">
          <span className="announcement-badge">{badge}</span>
          <span className="announcement-text">{text}</span>
        </div>
        <Link href={ctaLink || '#create'} className="announcement-cta">
          {ctaLabel || 'Customize Yours →'}
        </Link>
        <button
          type="button"
          className="announcement-close-btn"
          onClick={() => setIsVisible(false)}
          aria-label="Close notification"
        >
          &times;
        </button>
      </div>
    </div>
  );
}
