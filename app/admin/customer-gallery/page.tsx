'use client';

import React, { useState, useEffect } from 'react';
import AdminGuard from '@/components/admin/AdminGuard';
import AdminLayoutClient from '@/components/admin/AdminLayoutClient';

interface GalleryItem {
  id: string;
  image_url: string;
  title: string;
  caption?: string;
  customer_name?: string;
  is_approved: boolean;
  is_featured?: boolean;
  sort_order: number;
}

export default function AdminCustomerGalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Add photo modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    image_url: '',
    title: '',
    caption: '',
    customer_name: '',
    is_approved: true,
    is_featured: true,
    sort_order: 1,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadGallery = async () => {
    try {
      const res = await fetch('/api/admin/customer-gallery');
      if (res.ok) {
        const json = await res.json();
        if (json.items && Array.isArray(json.items)) {
          setItems(json.items);
        }
      }
    } catch (err: any) {
      console.warn('Failed to load gallery items:', err?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGallery();
  }, []);

  const handleToggleApprove = async (item: GalleryItem) => {
    try {
      const res = await fetch('/api/admin/customer-gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'moderate',
          item_id: item.id,
          is_approved: !item.is_approved,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, is_approved: !item.is_approved } : i))
        );
        showToast(!item.is_approved ? 'Photo approved for storefront!' : 'Photo unapproved');
      }
    } catch {
      showToast('Network error toggling approval');
    }
  };

  const handleToggleFeature = async (item: GalleryItem) => {
    try {
      const res = await fetch('/api/admin/customer-gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle_feature',
          item_id: item.id,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, is_featured: !item.is_featured } : i))
        );
        showToast(!item.is_featured ? 'Photo featured in top gallery!' : 'Photo unfeatured');
      }
    } catch {
      showToast('Network error toggling featured');
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!window.confirm('Are you sure you want to delete this lookbook photo?')) return;
    try {
      const res = await fetch('/api/admin/customer-gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', item_id: itemId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setItems((prev) => prev.filter((i) => i.id !== itemId));
        showToast('Gallery photo deleted');
      }
    } catch {
      showToast('Network error deleting photo');
    }
  };

  const handleCreatePhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/customer-gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          ...formData,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.item) {
        setItems((prev) => [...prev, data.item]);
        showToast('Lookbook photo added successfully!');
        setIsAddModalOpen(false);
        setFormData({
          image_url: '',
          title: '',
          caption: '',
          customer_name: '',
          is_approved: true,
          is_featured: true,
          sort_order: items.length + 1,
        });
      } else {
        showToast(data.error || 'Failed to add photo');
      }
    } catch {
      showToast('Network error adding photo');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminGuard>
      <AdminLayoutClient title="Real Finished Works Lookbook">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#1A1816] border border-[#D4AF6A] text-[#F5EFE6] px-4 py-3 rounded-lg shadow-2xl text-xs font-mono animate-fade-in flex items-center gap-2">
            <span>📷</span> {toastMessage}
          </div>
        )}

        <div className="space-y-6">
          {/* Header Banner */}
          <div className="p-6 rounded-xl bg-[#141210] border border-[#2D2722] flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="font-serif text-xl md:text-2xl font-bold text-[#D4AF6A]">
                Customer Lookbook Gallery CMS
              </h1>
              <p className="text-xs font-mono text-[#A39684] mt-1">
                Curate real customized frames photographed after production. Displayed on the storefront &quot;How It Looks in Real Life&quot; lookbook section.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 rounded-lg bg-[#D4AF6A] hover:bg-[#c49e59] text-[#141210] text-xs font-mono font-bold transition-all flex items-center gap-2"
            >
              <span>+</span> Add Lookbook Photo
            </button>
          </div>

          {/* Gallery Grid */}
          {loading ? (
            <div className="p-12 text-center text-xs font-mono text-[#A39684] bg-[#141210] rounded-xl border border-[#2D2722]">
              Loading lookbook photos...
            </div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center text-xs font-mono text-[#A39684] bg-[#141210] rounded-xl border border-[#2D2722]">
              No lookbook photos found. Click &quot;Add Lookbook Photo&quot; to add your first real work.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#141210] rounded-xl border border-[#2D2722] overflow-hidden flex flex-col justify-between hover:border-[#D4AF6A]/40 transition-all group"
                >
                  <div className="relative aspect-[3/4] bg-[#1A1816] overflow-hidden">
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                    />
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          item.is_approved
                            ? 'bg-emerald-500/80 text-white'
                            : 'bg-amber-500/80 text-black'
                        }`}
                      >
                        {item.is_approved ? 'LIVE ON STORE' : 'PENDING'}
                      </span>
                      {item.is_featured && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#D4AF6A] text-[#141210]">
                          ★ FEATURED
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-4 space-y-2 font-mono">
                    <h4 className="font-serif text-sm font-bold text-[#F5EFE6] truncate">
                      {item.title}
                    </h4>
                    {item.caption && (
                      <p className="text-[11px] text-[#A39684] truncate">
                        {item.caption}
                      </p>
                    )}

                    <div className="pt-2 border-t border-[#2D2722] flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={() => handleToggleApprove(item)}
                        className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                          item.is_approved
                            ? 'bg-zinc-700/30 text-[#A39684] hover:text-white'
                            : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                        }`}
                      >
                        {item.is_approved ? 'Hide' : 'Approve'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleFeature(item)}
                        className={`px-2.5 py-1 rounded text-[11px] transition-all ${
                          item.is_featured
                            ? 'bg-[#D4AF6A]/20 text-[#D4AF6A]'
                            : 'text-[#A39684] hover:text-[#D4AF6A]'
                        }`}
                      >
                        ★ Feature
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="text-red-400/80 hover:text-red-400 text-[11px]"
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

        {/* ADD PHOTO MODAL */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#141210] border border-[#2D2722] rounded-xl max-w-md w-full p-6 space-y-4 font-mono">
              <div className="flex items-center justify-between border-b border-[#2D2722] pb-3">
                <h3 className="font-serif text-lg font-bold text-[#F5EFE6]">
                  Add Finished Work Photo
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-[#A39684] hover:text-[#F5EFE6]"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreatePhoto} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[#A39684] mb-1">Image URL or Local Path</label>
                  <input
                    type="text"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="/frame1.jpg or Supabase storage URL"
                    className="w-full px-3 py-2 bg-[#1A1816] border border-[#2D2722] focus:border-[#D4AF6A] rounded-lg text-[#F5EFE6] outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[#A39684] mb-1">Title (e.g. Fatima — Red Persian)</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Fatima — Red Persian Frame"
                    className="w-full px-3 py-2 bg-[#1A1816] border border-[#2D2722] focus:border-[#D4AF6A] rounded-lg text-[#F5EFE6] outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[#A39684] mb-1">Caption</label>
                  <input
                    type="text"
                    value={formData.caption}
                    onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                    placeholder="Customized Wall Frame Sample"
                    className="w-full px-3 py-2 bg-[#1A1816] border border-[#2D2722] focus:border-[#D4AF6A] rounded-lg text-[#F5EFE6] outline-none"
                  />
                </div>

                <div className="flex items-center gap-4 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_approved}
                      onChange={(e) => setFormData({ ...formData, is_approved: e.target.checked })}
                      className="w-4 h-4 accent-[#D4AF6A]"
                    />
                    <span className="text-[#F5EFE6]">Approved for Public</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_featured}
                      onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                      className="w-4 h-4 accent-[#D4AF6A]"
                    />
                    <span className="text-[#F5EFE6]">Featured</span>
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-[#2D2722]">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 bg-[#1A1816] hover:bg-[#221F1C] text-[#A39684] rounded-lg border border-[#2D2722]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-[#D4AF6A] hover:bg-[#c49e59] text-[#141210] font-bold rounded-lg disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : 'Add to Lookbook'}
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
