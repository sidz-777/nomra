'use client';

import React, { useState, useEffect } from 'react';
import AdminGuard from '@/components/admin/AdminGuard';
import AdminLayoutClient from '@/components/admin/AdminLayoutClient';

interface SeoRecord {
  page_path: string;
  title: string;
  meta_description: string;
  canonical_url?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
  robots?: string;
}

const AVAILABLE_PAGES = [
  { path: '/', label: 'Homepage (/)' },
  { path: '/customize', label: 'Calligraphy Studio (/customize)' },
  { path: '/products', label: 'Ready-Stock Products (/products)' },
  { path: '/collections', label: 'Heritage Collections (/collections)' },
];

export default function AdminSeoPage() {
  const [pages, setPages] = useState<SeoRecord[]>([]);
  const [selectedPath, setSelectedPath] = useState<string>('/');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [currentForm, setCurrentForm] = useState<SeoRecord>({
    page_path: '/',
    title: '',
    meta_description: '',
    canonical_url: '',
    og_title: '',
    og_description: '',
    og_image: '',
    robots: 'index, follow',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadSeoData = async () => {
    try {
      const res = await fetch('/api/admin/seo');
      if (res.ok) {
        const json = await res.json();
        if (json.pages && Array.isArray(json.pages)) {
          setPages(json.pages);
          const activePage = json.pages.find((p: SeoRecord) => p.page_path === selectedPath) || json.pages[0];
          if (activePage) setCurrentForm(activePage);
        }
      }
    } catch (err: any) {
      console.warn('Failed to load SEO data:', err?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSeoData();
  }, []);

  const handleSelectPage = (path: string) => {
    setSelectedPath(path);
    const found = pages.find((p) => p.page_path === path);
    if (found) {
      setCurrentForm(found);
    } else {
      setCurrentForm({
        page_path: path,
        title: 'NAMORA | Handcrafted A4 Calligraphy Frames',
        meta_description: 'Order personalized framed calligraphy crafted in India.',
        canonical_url: `https://namoraworld.com${path === '/' ? '' : path}`,
        og_title: 'NAMORA Calligraphy Frames',
        og_description: 'Luxury personalized A4 frames with dual English & Arabic names.',
        og_image: 'https://namoraworld.com/assets/designs/design1.jpg',
        robots: 'index, follow',
      });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentForm),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`SEO metadata for "${selectedPath}" saved successfully!`);
        setPages((prev) => {
          const idx = prev.findIndex((p) => p.page_path === selectedPath);
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = currentForm;
            return copy;
          }
          return [...prev, currentForm];
        });
      } else {
        showToast(data.error || 'Failed to save SEO metadata');
      }
    } catch {
      showToast('Network error saving SEO metadata');
    } finally {
      setSaving(false);
    }
  };

  const titleLength = currentForm.title.length;
  const descLength = currentForm.meta_description.length;

  return (
    <AdminGuard>
      <AdminLayoutClient title="Page SEO Metadata Manager">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#1A1816] border border-[#D4AF6A] text-[#F5EFE6] px-4 py-3 rounded-lg shadow-2xl text-xs font-mono animate-fade-in flex items-center gap-2">
            <span>🔍</span> {toastMessage}
          </div>
        )}

        <div className="max-w-6xl space-y-6 font-mono">
          {/* Header Banner */}
          <div className="p-6 rounded-xl bg-[#141210] border border-[#2D2722] flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="font-serif text-xl md:text-2xl font-bold text-[#D4AF6A]">
                Page SEO &amp; Social Meta CMS
              </h1>
              <p className="text-xs text-[#A39684] mt-1">
                Configure meta titles, descriptions, canonical URLs, and Open Graph cards across high-converting storefront routes.
              </p>
            </div>
          </div>

          {/* Page Tabs */}
          <div className="flex items-center gap-2 border-b border-[#2D2722] pb-3 overflow-x-auto no-scrollbar">
            {AVAILABLE_PAGES.map((page) => (
              <button
                key={page.path}
                type="button"
                onClick={() => handleSelectPage(page.path)}
                className={`px-4 py-2 rounded-lg text-xs font-medium shrink-0 transition-all ${
                  selectedPath === page.path
                    ? 'bg-[#D4AF6A] text-[#141210] font-bold shadow-md'
                    : 'text-[#A39684] hover:text-[#F5EFE6] hover:bg-[#1A1816]'
                }`}
              >
                {page.label}
              </button>
            ))}
          </div>

          {/* 2-Column: Form & Live Previews */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form Column */}
            <form onSubmit={handleSave} className="lg:col-span-7 bg-[#141210] p-6 rounded-xl border border-[#2D2722] space-y-4 text-xs">
              <div className="border-b border-[#2D2722] pb-3">
                <h3 className="font-serif text-base font-bold text-[#F5EFE6]">
                  Metadata for <span className="text-[#D4AF6A]">{selectedPath}</span>
                </h3>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[#A39684]">Page Title</label>
                  <span className={`text-[10px] ${titleLength > 60 ? 'text-amber-400' : 'text-[#736B63]'}`}>
                    {titleLength} / 60 characters
                  </span>
                </div>
                <input
                  type="text"
                  value={currentForm.title}
                  onChange={(e) => setCurrentForm({ ...currentForm, title: e.target.value })}
                  placeholder="Primary page title..."
                  className="w-full px-3 py-2 bg-[#1A1816] border border-[#2D2722] focus:border-[#D4AF6A] rounded-lg text-[#F5EFE6] outline-none"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[#A39684]">Meta Description</label>
                  <span className={`text-[10px] ${descLength > 160 ? 'text-amber-400' : 'text-[#736B63]'}`}>
                    {descLength} / 160 characters
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={currentForm.meta_description}
                  onChange={(e) => setCurrentForm({ ...currentForm, meta_description: e.target.value })}
                  placeholder="Brief summary displayed in Google search results..."
                  className="w-full px-3 py-2 bg-[#1A1816] border border-[#2D2722] focus:border-[#D4AF6A] rounded-lg text-[#F5EFE6] outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#A39684] mb-1">Canonical URL</label>
                  <input
                    type="url"
                    value={currentForm.canonical_url}
                    onChange={(e) => setCurrentForm({ ...currentForm, canonical_url: e.target.value })}
                    placeholder="https://namoraworld.com"
                    className="w-full px-3 py-2 bg-[#1A1816] border border-[#2D2722] focus:border-[#D4AF6A] rounded-lg text-[#F5EFE6] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#A39684] mb-1">Robots Directives</label>
                  <select
                    value={currentForm.robots}
                    onChange={(e) => setCurrentForm({ ...currentForm, robots: e.target.value })}
                    className="w-full px-3 py-2 bg-[#1A1816] border border-[#2D2722] focus:border-[#D4AF6A] rounded-lg text-[#F5EFE6] outline-none"
                  >
                    <option value="index, follow">index, follow (Standard)</option>
                    <option value="noindex, follow">noindex, follow</option>
                    <option value="noindex, nofollow">noindex, nofollow</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-[#2D2722] space-y-3">
                <h4 className="font-bold text-[#F5EFE6] text-xs">Social Open Graph Sharing</h4>

                <div>
                  <label className="block text-[#A39684] mb-1">OG Title</label>
                  <input
                    type="text"
                    value={currentForm.og_title}
                    onChange={(e) => setCurrentForm({ ...currentForm, og_title: e.target.value })}
                    placeholder="Title for WhatsApp / Twitter preview"
                    className="w-full px-3 py-2 bg-[#1A1816] border border-[#2D2722] focus:border-[#D4AF6A] rounded-lg text-[#F5EFE6] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#A39684] mb-1">OG Description</label>
                  <textarea
                    rows={2}
                    value={currentForm.og_description}
                    onChange={(e) => setCurrentForm({ ...currentForm, og_description: e.target.value })}
                    placeholder="Short summary for social card..."
                    className="w-full px-3 py-2 bg-[#1A1816] border border-[#2D2722] focus:border-[#D4AF6A] rounded-lg text-[#F5EFE6] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#A39684] mb-1">OG Share Image URL</label>
                  <input
                    type="text"
                    value={currentForm.og_image}
                    onChange={(e) => setCurrentForm({ ...currentForm, og_image: e.target.value })}
                    placeholder="https://namoraworld.com/assets/designs/design1.jpg"
                    className="w-full px-3 py-2 bg-[#1A1816] border border-[#2D2722] focus:border-[#D4AF6A] rounded-lg text-[#F5EFE6] outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-[#D4AF6A] hover:bg-[#c49e59] text-[#141210] font-bold rounded-lg disabled:opacity-50 transition-all"
                >
                  {saving ? 'Saving...' : 'Save SEO Changes'}
                </button>
              </div>
            </form>

            {/* Previews Column */}
            <div className="lg:col-span-5 space-y-6">
              {/* Google SERP Preview */}
              <div className="bg-[#141210] p-5 rounded-xl border border-[#2D2722] space-y-3">
                <span className="text-[10px] uppercase tracking-wider text-[#A39684] block font-bold">
                  Google Search Snippet Preview
                </span>
                <div className="bg-white text-black p-4 rounded-lg font-sans space-y-1 text-left">
                  <div className="text-[11px] text-zinc-600 truncate">
                    {currentForm.canonical_url || 'https://namoraworld.com'}
                  </div>
                  <div className="text-sm font-medium text-[#1a0dab] hover:underline cursor-pointer line-clamp-1">
                    {currentForm.title || 'NAMORA | Handcrafted A4 Frames'}
                  </div>
                  <div className="text-xs text-zinc-700 line-clamp-2 leading-relaxed">
                    {currentForm.meta_description || 'Personalized calligraphy on Persian aesthetics...'}
                  </div>
                </div>
              </div>

              {/* Social Card Preview */}
              <div className="bg-[#141210] p-5 rounded-xl border border-[#2D2722] space-y-3">
                <span className="text-[10px] uppercase tracking-wider text-[#A39684] block font-bold">
                  Social Share Card (WhatsApp / X / FB)
                </span>
                <div className="bg-[#1A1816] rounded-lg border border-[#2D2722] overflow-hidden">
                  <div className="aspect-[16/9] bg-[#0E0D0C] relative">
                    <img
                      src={currentForm.og_image || '/assets/designs/design1.jpg'}
                      alt="Open Graph Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3 space-y-1">
                    <div className="text-[10px] text-[#A39684] uppercase">namoraworld.com</div>
                    <div className="font-bold text-xs text-[#F5EFE6] truncate">
                      {currentForm.og_title || currentForm.title}
                    </div>
                    <div className="text-[11px] text-[#A39684] line-clamp-2 leading-snug">
                      {currentForm.og_description || currentForm.meta_description}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AdminLayoutClient>
    </AdminGuard>
  );
}
