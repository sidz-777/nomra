'use client';

import React, { useState, useEffect } from 'react';
import AdminGuard from '@/components/admin/AdminGuard';
import AdminLayoutClient from '@/components/admin/AdminLayoutClient';
import { DEFAULT_HOMEPAGE_CONTENT } from '@/lib/homepage-data';

export default function AdminHomepagePage() {
  const [loading, setLoading] = useState(true);
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);
  const [savingHero, setSavingHero] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states
  const [announcement, setAnnouncement] = useState({
    enabled: DEFAULT_HOMEPAGE_CONTENT.announcement.enabled,
    badge: DEFAULT_HOMEPAGE_CONTENT.announcement.badge,
    text: DEFAULT_HOMEPAGE_CONTENT.announcement.text,
    cta_label: DEFAULT_HOMEPAGE_CONTENT.announcement.cta_label,
    cta_link: DEFAULT_HOMEPAGE_CONTENT.announcement.cta_link,
    start_date: DEFAULT_HOMEPAGE_CONTENT.announcement.start_date || '',
    end_date: DEFAULT_HOMEPAGE_CONTENT.announcement.end_date || '',
  });

  const [hero, setHero] = useState({
    enabled: DEFAULT_HOMEPAGE_CONTENT.hero.enabled,
    eyebrow: DEFAULT_HOMEPAGE_CONTENT.hero.eyebrow,
    title: DEFAULT_HOMEPAGE_CONTENT.hero.title,
    description: DEFAULT_HOMEPAGE_CONTENT.hero.description,
    cta_primary_label: DEFAULT_HOMEPAGE_CONTENT.hero.cta_primary_label,
    cta_primary_link: DEFAULT_HOMEPAGE_CONTENT.hero.cta_primary_link,
    cta_secondary_label: DEFAULT_HOMEPAGE_CONTENT.hero.cta_secondary_label,
    cta_secondary_link: DEFAULT_HOMEPAGE_CONTENT.hero.cta_secondary_link,
    trust_line: DEFAULT_HOMEPAGE_CONTENT.hero.trust_line,
    video_url: DEFAULT_HOMEPAGE_CONTENT.hero.video_url,
    poster_url: DEFAULT_HOMEPAGE_CONTENT.hero.poster_url,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    async function loadHomepageContent() {
      try {
        const res = await fetch('/api/admin/homepage');
        if (res.ok) {
          const json = await res.json();
          if (json.sections) {
            if (json.sections.announcement_bar?.content) {
              setAnnouncement({
                ...DEFAULT_HOMEPAGE_CONTENT.announcement,
                ...json.sections.announcement_bar.content,
                enabled: json.sections.announcement_bar.is_active !== false && json.sections.announcement_bar.content.enabled !== false,
              });
            }
            if (json.sections.hero_section?.content) {
              setHero({
                ...DEFAULT_HOMEPAGE_CONTENT.hero,
                ...json.sections.hero_section.content,
                enabled: json.sections.hero_section.is_active !== false,
              });
            }
          }
        }
      } catch (err: any) {
        console.warn('Load homepage error:', err?.message);
      } finally {
        setLoading(false);
      }
    }
    loadHomepageContent();
  }, []);

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingAnnouncement(true);
    try {
      const res = await fetch('/api/admin/homepage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'announcement_bar',
          is_active: announcement.enabled,
          content: announcement,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Announcement Bar updated successfully!');
      } else {
        showToast(data.error || 'Failed to save announcement bar');
      }
    } catch (err: any) {
      showToast('Network error saving announcement bar');
    } finally {
      setSavingAnnouncement(false);
    }
  };

  const handleSaveHero = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingHero(true);
    try {
      const res = await fetch('/api/admin/homepage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'hero_section',
          is_active: hero.enabled,
          content: hero,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Hero Section updated successfully!');
      } else {
        showToast(data.error || 'Failed to save hero section');
      }
    } catch (err: any) {
      showToast('Network error saving hero section');
    } finally {
      setSavingHero(false);
    }
  };

  return (
    <AdminGuard>
      <AdminLayoutClient title="Homepage Content CMS">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#1A1816] border border-[#D4AF6A] text-[#F5EFE6] px-4 py-3 rounded-lg shadow-2xl text-xs font-mono animate-fade-in flex items-center gap-2">
            <span>✨</span> {toastMessage}
          </div>
        )}

        <div className="max-w-6xl space-y-8">
          {/* Top Header Banner */}
          <div className="p-6 rounded-xl bg-[#141210] border border-[#2D2722] flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="font-serif text-xl md:text-2xl font-bold text-[#D4AF6A]">
                Homepage Marketing CMS
              </h1>
              <p className="text-xs font-mono text-[#A39684] mt-1">
                Manage live announcement messaging, headlines, hero CTAs, and trust guarantees without editing source code.
              </p>
            </div>
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-lg bg-[#1A1816] hover:bg-[#D4AF6A] text-[#D4AF6A] hover:text-[#0E0D0C] border border-[#2D2722] hover:border-[#D4AF6A] text-xs font-mono font-semibold transition-all flex items-center gap-2"
            >
              <span>👁️</span> Preview Live Storefront
            </a>
          </div>

          {/* SECTION 1: ANNOUNCEMENT BAR */}
          <section className="bg-[#141210] p-6 rounded-xl border border-[#2D2722] space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2D2722] pb-4">
              <div>
                <h2 className="font-serif text-lg font-bold text-[#F5EFE6] flex items-center gap-2">
                  <span>📣</span> Top Announcement Bar
                </h2>
                <p className="text-xs font-mono text-[#A39684] mt-0.5">
                  Promotional notification strip displayed above the main navigation.
                </p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <span className="text-xs font-mono text-[#A39684]">Status:</span>
                <input
                  type="checkbox"
                  checked={announcement.enabled}
                  onChange={(e) => setAnnouncement({ ...announcement, enabled: e.target.checked })}
                  className="w-4 h-4 accent-[#D4AF6A] cursor-pointer"
                />
                <span
                  className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                    announcement.enabled
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-zinc-700/30 text-[#A39684]'
                  }`}
                >
                  {announcement.enabled ? 'ACTIVE' : 'DISABLED'}
                </span>
              </label>
            </div>

            {/* Live Preview Box */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#A39684]">
                Storefront Simulation Preview
              </span>
              <div className="p-2.5 rounded-lg bg-[#1A1816] border border-[#2D2722]">
                <div className="announcement-bar-preview flex flex-wrap items-center justify-between gap-3 px-3 py-1.5 bg-[#0E0D0C] rounded border border-[#D4AF6A]/30 text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#D4AF6A] text-[#141210] tracking-wider uppercase">
                      {announcement.badge || 'PROMOTION'}
                    </span>
                    <span className="text-[#F5EFE6] truncate">
                      {announcement.text || 'Notification message...'}
                    </span>
                  </div>
                  <span className="text-[#D4AF6A] hover:underline cursor-pointer shrink-0 font-medium">
                    {announcement.cta_label || 'Learn More →'}
                  </span>
                </div>
              </div>
            </div>

            {/* Announcement Edit Form */}
            <form onSubmit={handleSaveAnnouncement} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-[#A39684] mb-1">
                    Badge Label (e.g. FESTIVE GIFTING, LIMITED OFFER)
                  </label>
                  <input
                    type="text"
                    value={announcement.badge}
                    onChange={(e) => setAnnouncement({ ...announcement, badge: e.target.value })}
                    className="w-full px-3 py-2 bg-[#1A1816] border border-[#2D2722] focus:border-[#D4AF6A] rounded-lg text-xs font-mono text-[#F5EFE6] outline-none"
                    placeholder="FESTIVE GIFTING"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-[#A39684] mb-1">
                    CTA Button Label
                  </label>
                  <input
                    type="text"
                    value={announcement.cta_label}
                    onChange={(e) => setAnnouncement({ ...announcement, cta_label: e.target.value })}
                    className="w-full px-3 py-2 bg-[#1A1816] border border-[#2D2722] focus:border-[#D4AF6A] rounded-lg text-xs font-mono text-[#F5EFE6] outline-none"
                    placeholder="Customize Yours →"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-[#A39684] mb-1">
                  Announcement Text
                </label>
                <textarea
                  rows={2}
                  value={announcement.text}
                  onChange={(e) => setAnnouncement({ ...announcement, text: e.target.value })}
                  className="w-full px-3 py-2 bg-[#1A1816] border border-[#2D2722] focus:border-[#D4AF6A] rounded-lg text-xs font-mono text-[#F5EFE6] outline-none"
                  placeholder="✨ Handcrafted in India • Free Express Air Delivery • Reserve with ₹49..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-mono text-[#A39684] mb-1">
                    CTA Link Destination (Anchor or URL)
                  </label>
                  <input
                    type="text"
                    value={announcement.cta_link}
                    onChange={(e) => setAnnouncement({ ...announcement, cta_link: e.target.value })}
                    className="w-full px-3 py-2 bg-[#1A1816] border border-[#2D2722] focus:border-[#D4AF6A] rounded-lg text-xs font-mono text-[#F5EFE6] outline-none"
                    placeholder="#create"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-[#A39684] mb-1">
                    Start Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={announcement.start_date}
                    onChange={(e) => setAnnouncement({ ...announcement, start_date: e.target.value })}
                    className="w-full px-3 py-2 bg-[#1A1816] border border-[#2D2722] focus:border-[#D4AF6A] rounded-lg text-xs font-mono text-[#F5EFE6] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-[#A39684] mb-1">
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={announcement.end_date}
                    onChange={(e) => setAnnouncement({ ...announcement, end_date: e.target.value })}
                    className="w-full px-3 py-2 bg-[#1A1816] border border-[#2D2722] focus:border-[#D4AF6A] rounded-lg text-xs font-mono text-[#F5EFE6] outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingAnnouncement}
                  className="px-5 py-2.5 bg-[#D4AF6A] hover:bg-[#c49e59] text-[#141210] rounded-lg text-xs font-mono font-bold transition-all disabled:opacity-50"
                >
                  {savingAnnouncement ? 'Saving Changes...' : 'Save Announcement Bar'}
                </button>
              </div>
            </form>
          </section>

          {/* SECTION 2: HERO SECTION */}
          <section className="bg-[#141210] p-6 rounded-xl border border-[#2D2722] space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2D2722] pb-4">
              <div>
                <h2 className="font-serif text-lg font-bold text-[#F5EFE6] flex items-center gap-2">
                  <span>✨</span> Hero Section Showcase
                </h2>
                <p className="text-xs font-mono text-[#A39684] mt-0.5">
                  Controls the primary above-the-fold headline, customer value proposition, and video presentation.
                </p>
              </div>
            </div>

            {/* Live Hero Preview */}
            <div className="space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#A39684]">
                Hero Content Preview
              </span>
              <div className="p-6 rounded-lg bg-[#1A1816] border border-[#2D2722] space-y-3">
                <div className="text-[11px] font-mono tracking-widest uppercase text-[#D4AF6A]">
                  {hero.eyebrow}
                </div>
                <h3 className="font-serif text-xl md:text-2xl font-bold text-[#F5EFE6]">
                  {hero.title}
                </h3>
                <p className="text-xs text-[#A39684] max-w-2xl leading-relaxed">
                  {hero.description}
                </p>
                <div className="flex items-center gap-3 pt-2">
                  <span className="px-4 py-2 rounded-lg bg-[#D4AF6A] text-[#141210] text-xs font-bold">
                    {hero.cta_primary_label}
                  </span>
                  <span className="px-4 py-2 rounded-lg border border-[#D4AF6A]/40 text-[#D4AF6A] text-xs font-medium">
                    {hero.cta_secondary_label}
                  </span>
                </div>
                <div className="text-[11px] text-[#A39684] pt-1">
                  {hero.trust_line}
                </div>
              </div>
            </div>

            {/* Hero Edit Form */}
            <form onSubmit={handleSaveHero} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-[#A39684] mb-1">
                    Eyebrow Text
                  </label>
                  <input
                    type="text"
                    value={hero.eyebrow}
                    onChange={(e) => setHero({ ...hero, eyebrow: e.target.value })}
                    className="w-full px-3 py-2 bg-[#1A1816] border border-[#2D2722] focus:border-[#D4AF6A] rounded-lg text-xs font-mono text-[#F5EFE6] outline-none"
                    placeholder="Real Handmade Wall Frames"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-[#A39684] mb-1">
                    Trust Line
                  </label>
                  <input
                    type="text"
                    value={hero.trust_line}
                    onChange={(e) => setHero({ ...hero, trust_line: e.target.value })}
                    className="w-full px-3 py-2 bg-[#1A1816] border border-[#2D2722] focus:border-[#D4AF6A] rounded-lg text-xs font-mono text-[#F5EFE6] outline-none"
                    placeholder="Handmade in India · Dispatches in 24–48 hrs · Free remake if not happy"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-[#A39684] mb-1">
                  Main Headline
                </label>
                <input
                  type="text"
                  value={hero.title}
                  onChange={(e) => setHero({ ...hero, title: e.target.value })}
                  className="w-full px-3 py-2 bg-[#1A1816] border border-[#2D2722] focus:border-[#D4AF6A] rounded-lg text-xs font-mono text-[#F5EFE6] outline-none"
                  placeholder="Because some names deserve to be framed."
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#A39684] mb-1">
                  Description Paragraph
                </label>
                <textarea
                  rows={3}
                  value={hero.description}
                  onChange={(e) => setHero({ ...hero, description: e.target.value })}
                  className="w-full px-3 py-2 bg-[#1A1816] border border-[#2D2722] focus:border-[#D4AF6A] rounded-lg text-xs font-mono text-[#F5EFE6] outline-none"
                  placeholder="Personalized A4 framed calligraphy crafted on authentic Persian & oriental aesthetic backgrounds..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-[#A39684] mb-1">
                    Primary CTA Label &amp; Link
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={hero.cta_primary_label}
                      onChange={(e) => setHero({ ...hero, cta_primary_label: e.target.value })}
                      className="px-3 py-2 bg-[#1A1816] border border-[#2D2722] focus:border-[#D4AF6A] rounded-lg text-xs font-mono text-[#F5EFE6] outline-none"
                      placeholder="Customize Yours"
                    />
                    <input
                      type="text"
                      value={hero.cta_primary_link}
                      onChange={(e) => setHero({ ...hero, cta_primary_link: e.target.value })}
                      className="px-3 py-2 bg-[#1A1816] border border-[#2D2722] focus:border-[#D4AF6A] rounded-lg text-xs font-mono text-[#F5EFE6] outline-none"
                      placeholder="#create"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#A39684] mb-1">
                    Secondary CTA Label &amp; Link
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={hero.cta_secondary_label}
                      onChange={(e) => setHero({ ...hero, cta_secondary_label: e.target.value })}
                      className="px-3 py-2 bg-[#1A1816] border border-[#2D2722] focus:border-[#D4AF6A] rounded-lg text-xs font-mono text-[#F5EFE6] outline-none"
                      placeholder="See Real Works"
                    />
                    <input
                      type="text"
                      value={hero.cta_secondary_link}
                      onChange={(e) => setHero({ ...hero, cta_secondary_link: e.target.value })}
                      className="px-3 py-2 bg-[#1A1816] border border-[#2D2722] focus:border-[#D4AF6A] rounded-lg text-xs font-mono text-[#F5EFE6] outline-none"
                      placeholder="#gallery"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-[#A39684] mb-1">
                    Hero Video Path or URL
                  </label>
                  <input
                    type="text"
                    value={hero.video_url}
                    onChange={(e) => setHero({ ...hero, video_url: e.target.value })}
                    className="w-full px-3 py-2 bg-[#1A1816] border border-[#2D2722] focus:border-[#D4AF6A] rounded-lg text-xs font-mono text-[#F5EFE6] outline-none"
                    placeholder="/hero-video.mp4"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-[#A39684] mb-1">
                    Hero Video Poster Image URL
                  </label>
                  <input
                    type="text"
                    value={hero.poster_url}
                    onChange={(e) => setHero({ ...hero, poster_url: e.target.value })}
                    className="w-full px-3 py-2 bg-[#1A1816] border border-[#2D2722] focus:border-[#D4AF6A] rounded-lg text-xs font-mono text-[#F5EFE6] outline-none"
                    placeholder="/design1.jpg"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={savingHero}
                  className="px-5 py-2.5 bg-[#D4AF6A] hover:bg-[#c49e59] text-[#141210] rounded-lg text-xs font-mono font-bold transition-all disabled:opacity-50"
                >
                  {savingHero ? 'Saving Changes...' : 'Save Hero Section'}
                </button>
              </div>
            </form>
          </section>
        </div>
      </AdminLayoutClient>
    </AdminGuard>
  );
}
