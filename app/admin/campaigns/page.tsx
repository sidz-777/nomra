'use client';

import React, { useState, useEffect } from 'react';
import AdminGuard from '@/components/admin/AdminGuard';
import AdminLayoutClient from '@/components/admin/AdminLayoutClient';

interface Campaign {
  id: string;
  name: string;
  badge_text: string;
  headline?: string;
  description?: string;
  is_active: boolean;
  start_date?: string | null;
  end_date?: string | null;
  product_ids?: string[];
  created_at: string;
}

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    badge_text: 'FESTIVE PICK',
    headline: '',
    description: '',
    is_active: true,
    start_date: '',
    end_date: '',
    product_ids_text: '',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadCampaigns = async () => {
    try {
      const res = await fetch('/api/admin/campaigns');
      if (res.ok) {
        const json = await res.json();
        if (json.campaigns && Array.isArray(json.campaigns)) {
          setCampaigns(json.campaigns);
        }
      }
    } catch (err: any) {
      console.warn('Failed to load campaigns:', err?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      name: '',
      badge_text: 'FESTIVE PICK',
      headline: '',
      description: '',
      is_active: true,
      start_date: '',
      end_date: '',
      product_ids_text: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Campaign) => {
    setEditingId(c.id);
    setFormData({
      name: c.name,
      badge_text: c.badge_text,
      headline: c.headline || '',
      description: c.description || '',
      is_active: c.is_active,
      start_date: c.start_date ? c.start_date.split('T')[0] : '',
      end_date: c.end_date ? c.end_date.split('T')[0] : '',
      product_ids_text: Array.isArray(c.product_ids) ? c.product_ids.join(', ') : '',
    });
    setIsModalOpen(true);
  };

  const handleToggleActive = async (c: Campaign) => {
    try {
      const res = await fetch('/api/admin/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: c.id,
          name: c.name,
          badge_text: c.badge_text,
          is_active: !c.is_active,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCampaigns((prev) =>
          prev.map((item) => (item.id === c.id ? { ...item, is_active: !c.is_active } : item))
        );
        showToast(!c.is_active ? 'Campaign activated!' : 'Campaign paused');
      }
    } catch {
      showToast('Network error toggling campaign');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this promotional campaign?')) return;
    try {
      const res = await fetch(`/api/admin/campaigns?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCampaigns((prev) => prev.filter((c) => c.id !== id));
        showToast('Campaign deleted successfully');
      }
    } catch {
      showToast('Network error deleting campaign');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const pids = formData.product_ids_text
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        id: editingId || undefined,
        name: formData.name,
        badge_text: formData.badge_text,
        headline: formData.headline,
        description: formData.description,
        is_active: formData.is_active,
        start_date: formData.start_date ? new Date(formData.start_date).toISOString() : null,
        end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
        product_ids: pids,
      };

      const res = await fetch('/api/admin/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success && data.campaign) {
        if (editingId) {
          setCampaigns((prev) =>
            prev.map((c) => (c.id === editingId ? data.campaign : c))
          );
          showToast('Campaign updated successfully!');
        } else {
          setCampaigns((prev) => [data.campaign, ...prev]);
          showToast('Campaign created successfully!');
        }
        setIsModalOpen(false);
      } else {
        showToast(data.error || 'Failed to save campaign');
      }
    } catch {
      showToast('Network error saving campaign');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminGuard>
      <AdminLayoutClient title="Promotional Campaigns & Badges">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#1A1816] border border-[#D4AF6A] text-[#F5EFE6] px-4 py-3 rounded-lg shadow-2xl text-xs font-mono animate-fade-in flex items-center gap-2">
            <span>🏷️</span> {toastMessage}
          </div>
        )}

        <div className="space-y-6 font-mono">
          {/* Header Banner */}
          <div className="p-6 rounded-xl bg-[#141210] border border-[#2D2722] flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="font-serif text-xl md:text-2xl font-bold text-[#D4AF6A]">
                Promotional Campaigns &amp; Product Badges
              </h1>
              <p className="text-xs text-[#A39684] mt-1">
                Attach marketing ribbons (e.g. BESTSELLER, LIMITED, FESTIVE PICK) to specific products and control campaign schedules.
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenCreate}
              className="px-4 py-2 rounded-lg bg-[#D4AF6A] hover:bg-[#c49e59] text-[#141210] text-xs font-bold transition-all flex items-center gap-2"
            >
              <span>+</span> Create Campaign
            </button>
          </div>

          {/* Campaigns List */}
          {loading ? (
            <div className="p-12 text-center text-xs text-[#A39684] bg-[#141210] rounded-xl border border-[#2D2722]">
              Loading marketing campaigns...
            </div>
          ) : campaigns.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#A39684] bg-[#141210] rounded-xl border border-[#2D2722]">
              No promotional campaigns configured. Click &quot;Create Campaign&quot; to launch a campaign badge.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {campaigns.map((c) => (
                <div
                  key={c.id}
                  className="bg-[#141210] p-5 rounded-xl border border-[#2D2722] hover:border-[#D4AF6A]/30 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-[#F5EFE6] truncate">
                        {c.name}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          c.is_active
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-zinc-700/30 text-[#A39684]'
                        }`}
                      >
                        {c.is_active ? 'ACTIVE' : 'PAUSED'}
                      </span>
                    </div>

                    {/* Badge Preview */}
                    <div className="pt-2 flex items-center gap-2">
                      <span className="text-[10px] text-[#A39684]">Badge:</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#D4AF6A] text-[#141210] tracking-wider uppercase shadow-sm">
                        {c.badge_text}
                      </span>
                    </div>

                    {c.headline && (
                      <div className="text-xs text-[#D8CFBF] font-serif">
                        {c.headline}
                      </div>
                    )}

                    {c.description && (
                      <p className="text-[11px] text-[#A39684] line-clamp-2">
                        {c.description}
                      </p>
                    )}

                    <div className="text-[10px] text-[#736B63] pt-1">
                      Target Products:{' '}
                      <span className="text-[#F5EFE6]">
                        {Array.isArray(c.product_ids) && c.product_ids.length > 0
                          ? `${c.product_ids.length} items linked`
                          : 'Storewide default'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#2D2722] flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(c)}
                      className={`px-3 py-1 rounded text-[11px] transition-all ${
                        c.is_active
                          ? 'bg-zinc-700/30 text-[#A39684] hover:text-white'
                          : 'bg-emerald-500/20 text-emerald-400 font-bold'
                      }`}
                    >
                      {c.is_active ? 'Pause' : 'Activate'}
                    </button>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(c)}
                        className="text-[#D4AF6A] hover:underline text-[11px]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(c.id)}
                        className="text-red-400 hover:underline text-[11px]"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CREATE / EDIT CAMPAIGN MODAL */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#141210] border border-[#2D2722] rounded-xl max-w-lg w-full p-6 space-y-4 font-mono">
              <div className="flex items-center justify-between border-b border-[#2D2722] pb-3">
                <h3 className="font-serif text-lg font-bold text-[#F5EFE6]">
                  {editingId ? 'Edit Promotional Campaign' : 'Create New Campaign'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="text-[#A39684] hover:text-[#F5EFE6]"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[#A39684] mb-1">Campaign Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Wedding Season 2026"
                    className="w-full px-3 py-2 bg-[#1A1816] border border-[#2D2722] focus:border-[#D4AF6A] rounded-lg text-[#F5EFE6] outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#A39684] mb-1">Badge Text (Uppercase)</label>
                    <input
                      type="text"
                      value={formData.badge_text}
                      onChange={(e) => setFormData({ ...formData, badge_text: e.target.value.toUpperCase() })}
                      placeholder="e.g. BESTSELLER"
                      className="w-full px-3 py-2 bg-[#1A1816] border border-[#2D2722] focus:border-[#D4AF6A] rounded-lg text-[#F5EFE6] outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[#A39684] mb-1">Badge Preview</label>
                    <div className="h-9 px-3 flex items-center bg-[#1A1816] rounded-lg border border-[#2D2722]">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#D4AF6A] text-[#141210] uppercase">
                        {formData.badge_text || 'BADGE'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[#A39684] mb-1">Optional Headline</label>
                  <input
                    type="text"
                    value={formData.headline}
                    onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                    placeholder="e.g. Special Handmade Editions"
                    className="w-full px-3 py-2 bg-[#1A1816] border border-[#2D2722] focus:border-[#D4AF6A] rounded-lg text-[#F5EFE6] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#A39684] mb-1">Optional Description</label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Campaign details..."
                    className="w-full px-3 py-2 bg-[#1A1816] border border-[#2D2722] focus:border-[#D4AF6A] rounded-lg text-[#F5EFE6] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#A39684] mb-1">
                    Linked Product IDs (Comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.product_ids_text}
                    onChange={(e) => setFormData({ ...formData, product_ids_text: e.target.value })}
                    placeholder="car-1, sport-14, name-1 (or leave blank for storewide)"
                    className="w-full px-3 py-2 bg-[#1A1816] border border-[#2D2722] focus:border-[#D4AF6A] rounded-lg text-[#F5EFE6] outline-none"
                  />
                  <span className="text-[10px] text-[#736B63] block mt-0.5">
                    Leave blank to show on all products where campaign is active.
                  </span>
                </div>

                <div className="flex items-center gap-4 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4 accent-[#D4AF6A]"
                    />
                    <span className="text-[#F5EFE6]">Campaign Active</span>
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-[#2D2722]">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-[#1A1816] hover:bg-[#221F1C] text-[#A39684] rounded-lg border border-[#2D2722]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-[#D4AF6A] hover:bg-[#c49e59] text-[#141210] font-bold rounded-lg disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : editingId ? 'Update Campaign' : 'Create Campaign'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AdminLayoutClient>
    </AdminGuard>
  );
}
