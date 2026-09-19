'use client';

import React, { useState, useEffect } from 'react';
import AdminGuard from '@/components/admin/AdminGuard';
import AdminLayoutClient from '@/components/admin/AdminLayoutClient';
import { CMSCollection } from '@/lib/cms/types';

export default function AdminCollectionsPage() {
  const [collections, setCollections] = useState<CMSCollection[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingCollection, setEditingCollection] = useState<CMSCollection | null>(null);
  const [modalSubmitting, setModalSubmitting] = useState<boolean>(false);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    image_url: '/assets/designs/design1.jpg',
    type: 'persian' as CMSCollection['type'],
    sort_order: 1,
    is_active: true,
  });

  const loadCollections = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch('/api/admin/collections');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.collections)) {
          setCollections(json.collections);
        } else {
          setLoadError('Failed to parse collections data');
        }
      } else {
        setLoadError(`Server error HTTP ${res.status}`);
      }
    } catch (err: any) {
      setLoadError('Network error connecting to collections service');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCollections();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const openAddModal = () => {
    setFormData({
      title: '',
      slug: '',
      description: '',
      image_url: '/assets/designs/design1.jpg',
      type: 'custom',
      sort_order: collections.length + 1,
      is_active: true,
    });
    setEditingCollection(null);
    setShowModal(true);
  };

  const openEditModal = (c: CMSCollection) => {
    setFormData({
      title: c.title,
      slug: c.slug,
      description: c.description || '',
      image_url: c.image_url || '',
      type: c.type,
      sort_order: c.sort_order || 1,
      is_active: c.is_active !== false,
    });
    setEditingCollection(c);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalSubmitting(true);

    try {
      const isEditing = Boolean(editingCollection);
      const endpoint = '/api/admin/collections';
      const method = isEditing ? 'PUT' : 'POST';

      const payload = {
        ...(isEditing ? { id: editingCollection!.id } : {}),
        title: formData.title,
        slug: formData.slug,
        description: formData.description,
        image_url: formData.image_url,
        type: formData.type,
        sort_order: formData.sort_order,
        is_active: formData.is_active,
      };

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(isEditing ? '✅ Collection updated' : '✅ Collection created');
        setShowModal(false);
        await loadCollections();
      } else {
        throw new Error(data?.error || 'Operation failed');
      }
    } catch (err: any) {
      showToast(`❌ Error: ${err?.message}`);
    } finally {
      setModalSubmitting(false);
    }
  };

  return (
    <AdminGuard>
      <AdminLayoutClient title="Collections Management">
        {/* Toast */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#1A1816] border border-[#D4AF6A] text-[#F5EFE6] px-4 py-3 rounded-lg shadow-2xl text-xs font-mono animate-fade-in flex items-center gap-2">
            {toastMessage}
          </div>
        )}

        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-serif font-medium text-[#F5EFE6]">
              Storefront Collections ({collections.length})
            </h3>
            <p className="text-xs text-[#A39684] mt-0.5 font-mono">
              Organize curated catalog groups, promotional drops, and hero collections.
            </p>
          </div>

          <div>
            <button
              type="button"
              onClick={openAddModal}
              className="px-4 py-2 bg-[#D4AF6A] text-[#141210] hover:bg-[#E0C082] rounded-lg text-xs font-mono font-semibold transition flex items-center gap-2 shadow-sm"
            >
              <span>+</span>
              <span>Create Collection</span>
            </button>
          </div>
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className="p-8 text-center text-[#A39684] text-sm font-mono border border-[#2D2722] rounded-xl bg-[#1A1816]/40 mb-6">
            <span className="animate-pulse">Loading collections...</span>
          </div>
        )}

        {/* Error Banner */}
        {loadError && (
          <div className="mb-6 p-4 rounded-lg bg-red-950/40 border border-red-800 text-red-300 text-sm flex items-center justify-between">
            <span className="font-mono">⚠️ {loadError}</span>
            <button
              type="button"
              onClick={loadCollections}
              className="px-3 py-1 bg-red-900/60 hover:bg-red-800 text-red-200 text-xs rounded"
            >
              Retry
            </button>
          </div>
        )}

        {/* Collections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {collections.map((c) => {
            const imgSrc = c.image_url
              ? c.image_url.startsWith('http') || c.image_url.startsWith('/')
                ? c.image_url
                : `/${c.image_url}`
              : '/assets/designs/design1.jpg';

            return (
              <div
                key={c.id}
                className="bg-[#1A1816] border border-[#2D2722] hover:border-[#D4AF6A]/30 rounded-xl overflow-hidden transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="h-40 bg-[#141210] relative overflow-hidden">
                    <img
                      src={imgSrc}
                      alt={c.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute top-2 left-2 flex items-center gap-2">
                      <span className="bg-[#141210]/90 text-[#D4AF6A] border border-[#D4AF6A]/30 px-2 py-0.5 rounded text-[10px] font-mono uppercase">
                        {c.type}
                      </span>
                      <span className="bg-[#141210]/90 text-[#A39684] px-2 py-0.5 rounded text-[10px] font-mono">
                        Order #{c.sort_order}
                      </span>
                    </div>

                    <div className="absolute top-2 right-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                          c.is_active !== false
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                            : 'bg-red-950/80 text-red-300 border border-red-800'
                        }`}
                      >
                        {c.is_active !== false ? '● Active' : '○ Inactive'}
                      </span>
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="text-[10px] font-mono text-[#736B5E] mb-1">/{c.slug}</div>
                    <h4 className="text-base font-serif font-medium text-[#F5EFE6] mb-1">{c.title}</h4>
                    {c.description && (
                      <p className="text-xs text-[#A39684] line-clamp-2">{c.description}</p>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-[#141210] border-t border-[#2D2722] flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#736B5E]">ID: {c.id}</span>
                  <button
                    type="button"
                    onClick={() => openEditModal(c)}
                    className="px-3 py-1.5 bg-[#2D2722] hover:bg-[#3D352E] text-[#F5EFE6] rounded text-xs font-mono transition"
                  >
                    ✏️ Edit Collection
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* MODAL: ADD / EDIT COLLECTION */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-[#141210] border border-[#2D2722] rounded-xl w-full max-w-lg my-8 overflow-hidden shadow-2xl animate-fade-in">
              <div className="p-5 border-b border-[#2D2722] flex items-center justify-between">
                <div>
                  <h3 className="text-base font-serif font-semibold text-[#F5EFE6]">
                    {editingCollection ? `Edit Collection: ${editingCollection.title}` : 'Create Collection'}
                  </h3>
                  <p className="text-xs text-[#A39684] font-mono mt-0.5">
                    Define storefront collection grouping and display metadata.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="text-[#A39684] hover:text-[#F5EFE6] text-lg font-mono p-1"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-mono text-[#A39684] mb-1">
                    Collection Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Royal Ramadan Special"
                    className="w-full bg-[#1A1816] border border-[#2D2722] rounded-lg px-3 py-2 text-xs font-mono text-[#F5EFE6] focus:border-[#D4AF6A] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-[#A39684] mb-1">
                      URL Slug
                    </label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="e.g. royal-ramadan"
                      className="w-full bg-[#1A1816] border border-[#2D2722] rounded-lg px-3 py-2 text-xs font-mono text-[#F5EFE6] focus:border-[#D4AF6A] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-[#A39684] mb-1">
                      Type
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                      className="w-full bg-[#1A1816] border border-[#2D2722] rounded-lg px-3 py-2 text-xs font-mono text-[#F5EFE6] focus:border-[#D4AF6A] focus:outline-none"
                    >
                      <option value="persian">Persian Heritage</option>
                      <option value="ready_stock">Ready-to-Ship</option>
                      <option value="custom">Custom Themed</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-mono text-[#A39684] mb-1">
                      Cover Image URL
                    </label>
                    <input
                      type="text"
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      placeholder="/assets/designs/design1.jpg"
                      className="w-full bg-[#1A1816] border border-[#2D2722] rounded-lg px-3 py-2 text-xs font-mono text-[#F5EFE6] focus:border-[#D4AF6A] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-[#A39684] mb-1">
                      Sort Order
                    </label>
                    <input
                      type="number"
                      value={formData.sort_order}
                      onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value, 10) || 1 })}
                      className="w-full bg-[#1A1816] border border-[#2D2722] rounded-lg px-3 py-2 text-xs font-mono text-[#F5EFE6] focus:border-[#D4AF6A] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#A39684] mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Short description of this curated collection..."
                    className="w-full bg-[#1A1816] border border-[#2D2722] rounded-lg px-3 py-2 text-xs font-mono text-[#F5EFE6] focus:border-[#D4AF6A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="rounded border-[#2D2722] bg-[#1A1816] text-[#D4AF6A] focus:ring-0"
                    />
                    <span className="text-xs font-mono text-[#F5EFE6]">Active Collection</span>
                  </label>
                </div>

                <div className="pt-4 border-t border-[#2D2722] flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-[#1A1816] hover:bg-[#2D2722] text-[#A39684] hover:text-[#F5EFE6] rounded-lg text-xs font-mono transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={modalSubmitting}
                    className="px-5 py-2 bg-[#D4AF6A] hover:bg-[#E0C082] text-[#141210] rounded-lg text-xs font-mono font-semibold transition disabled:opacity-50"
                  >
                    {modalSubmitting ? 'Saving...' : editingCollection ? 'Save Changes' : 'Create Collection'}
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
