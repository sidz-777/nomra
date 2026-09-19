'use client';

import React, { useState, useEffect } from 'react';
import AdminGuard from '@/components/admin/AdminGuard';
import AdminLayoutClient from '@/components/admin/AdminLayoutClient';
import { CMSDesign, CMSOverlayConfig } from '@/lib/cms/types';

const DEFAULT_OVERLAY: CMSOverlayConfig = {
  posX: 50,
  posY: 46,
  maxWidth: 68,
  fontSizeEn: 28,
  fontSizeAr: 34,
  fontEn: "'Cinzel', serif",
  fontAr: "'Amiri', serif",
  textColor: '#ffffff',
  textShadow: '0 2px 7px rgba(0,0,0,0.85)',
};

export default function AdminDesignsPage() {
  const [designs, setDesigns] = useState<CMSDesign[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Modal states
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingDesign, setEditingDesign] = useState<CMSDesign | null>(null);
  const [modalSubmitting, setModalSubmitting] = useState<boolean>(false);

  // Form state
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    category: 'crimson' as CMSDesign['category'],
    category_label: 'Crimson & Ruby',
    image_url: '/assets/designs/design1.jpg',
    description: '',
    sort_order: 1,
    is_active: true,
    is_featured: false,
    overlay_config: { ...DEFAULT_OVERLAY },
  });

  const loadDesigns = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch('/api/admin/designs');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.designs)) {
          setDesigns(json.designs);
        } else {
          setLoadError('Failed to parse designs catalog');
        }
      } else {
        setLoadError(`Server error HTTP ${res.status}`);
      }
    } catch (err: any) {
      setLoadError('Network error connecting to designs service');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDesigns();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleToggleStatus = async (designId: string, currentStatus: boolean) => {
    setTogglingId(designId);
    const nextStatus = !currentStatus;
    try {
      const res = await fetch('/api/admin/designs/toggle-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ design_id: designId, is_active: nextStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setDesigns((prev) =>
          prev.map((d) => (d.id === designId ? { ...d, is_active: nextStatus } : d))
        );
        showToast(
          nextStatus
            ? '✅ Design activated on customer storefront'
            : '⏸️ Design hidden from storefront'
        );
      } else {
        throw new Error(data?.error || 'Toggle failed');
      }
    } catch (err: any) {
      showToast(`❌ Error: ${err?.message}`);
    } finally {
      setTogglingId(null);
    }
  };

  const openAddModal = () => {
    const nextOrder = designs.length + 1;
    setFormData({
      id: '',
      title: '',
      category: 'crimson',
      category_label: 'Crimson & Ruby',
      image_url: '/assets/designs/design1.jpg',
      description: '',
      sort_order: nextOrder,
      is_active: true,
      is_featured: false,
      overlay_config: { ...DEFAULT_OVERLAY },
    });
    setEditingDesign(null);
    setShowModal(true);
  };

  const openEditModal = (d: CMSDesign) => {
    setFormData({
      id: d.id,
      title: d.title,
      category: d.category,
      category_label: d.category_label,
      image_url: d.image_url,
      description: d.description || '',
      sort_order: d.sort_order || 1,
      is_active: d.is_active !== false,
      is_featured: Boolean(d.is_featured),
      overlay_config: {
        ...(DEFAULT_OVERLAY),
        ...(d.overlay_config || {}),
      },
    });
    setEditingDesign(d);
    setShowModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalSubmitting(true);

    try {
      const isEditing = Boolean(editingDesign);
      const endpoint = '/api/admin/designs';
      const method = isEditing ? 'PUT' : 'POST';

      const payload = {
        ...(isEditing ? { id: editingDesign!.id } : {}),
        title: formData.title,
        category: formData.category,
        category_label: formData.category_label,
        image_url: formData.image_url,
        description: formData.description,
        sort_order: formData.sort_order,
        is_active: formData.is_active,
        is_featured: formData.is_featured,
        overlay_config: formData.overlay_config,
      };

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(isEditing ? '✅ Design updated successfully' : '✅ New design created successfully');
        setShowModal(false);
        await loadDesigns();
      } else {
        throw new Error(data?.error || 'Operation failed');
      }
    } catch (err: any) {
      showToast(`❌ Error: ${err?.message}`);
    } finally {
      setModalSubmitting(false);
    }
  };

  const filteredDesigns =
    selectedCategory === 'all'
      ? designs
      : designs.filter((d) => d.category === selectedCategory);

  return (
    <AdminGuard>
      <AdminLayoutClient title="Design Studio Manager">
        {/* Toast */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#1A1816] border border-[#D4AF6A] text-[#F5EFE6] px-4 py-3 rounded-lg shadow-2xl text-xs font-mono animate-fade-in flex items-center gap-2">
            {toastMessage}
          </div>
        )}

        {/* Error Banner */}
        {loadError && (
          <div className="mb-6 p-4 rounded-lg bg-red-950/40 border border-red-800 text-red-300 text-sm flex items-center justify-between">
            <span className="font-mono">⚠️ {loadError}</span>
            <button
              type="button"
              onClick={loadDesigns}
              className="px-3 py-1 bg-red-900/60 hover:bg-red-800 text-red-200 text-xs rounded"
            >
              Retry
            </button>
          </div>
        )}

        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-serif font-medium text-[#F5EFE6]">
              Persian &amp; Oriental Frame Designs ({designs.length})
            </h3>
            <p className="text-xs text-[#A39684] mt-0.5 font-mono">
              Add new frame artwork, calibrate typography overlay coordinates, and control storefront availability.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={openAddModal}
              className="px-4 py-2 bg-[#D4AF6A] text-[#141210] hover:bg-[#E0C082] rounded-lg text-xs font-mono font-semibold transition flex items-center gap-2 shadow-sm"
            >
              <span>+</span>
              <span>Add New Frame Design</span>
            </button>
          </div>
        </div>

        {/* Category Filters */}
        <div className="bg-[#141210] border border-[#2D2722] rounded-xl p-3 mb-6 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition ${
              selectedCategory === 'all'
                ? 'bg-[#D4AF6A] text-[#141210]'
                : 'bg-[#1A1816] text-[#A39684] hover:text-[#F5EFE6]'
            }`}
          >
            All Designs ({designs.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('crimson')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition ${
              selectedCategory === 'crimson'
                ? 'bg-[#D4AF6A] text-[#141210]'
                : 'bg-[#1A1816] text-[#A39684] hover:text-[#F5EFE6]'
            }`}
          >
            🔴 Crimson
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('blue')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition ${
              selectedCategory === 'blue'
                ? 'bg-[#D4AF6A] text-[#141210]'
                : 'bg-[#1A1816] text-[#A39684] hover:text-[#F5EFE6]'
            }`}
          >
            🔵 Royal Blue
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('pastel')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition ${
              selectedCategory === 'pastel'
                ? 'bg-[#D4AF6A] text-[#141210]'
                : 'bg-[#1A1816] text-[#A39684] hover:text-[#F5EFE6]'
            }`}
          >
            🌸 Pastel
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('amber')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition ${
              selectedCategory === 'amber'
                ? 'bg-[#D4AF6A] text-[#141210]'
                : 'bg-[#1A1816] text-[#A39684] hover:text-[#F5EFE6]'
            }`}
          >
            🟡 Amber
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('vintage')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition ${
              selectedCategory === 'vintage'
                ? 'bg-[#D4AF6A] text-[#141210]'
                : 'bg-[#1A1816] text-[#A39684] hover:text-[#F5EFE6]'
            }`}
          >
            📜 Vintage
          </button>
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className="p-8 text-center text-[#A39684] text-sm font-mono border border-[#2D2722] rounded-xl bg-[#1A1816]/40">
            <span className="animate-pulse">Loading frame designs...</span>
          </div>
        )}

        {/* Designs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredDesigns.map((d) => {
            const isToggling = togglingId === d.id;
            const imgSrc = d.image_url.startsWith('http') || d.image_url.startsWith('/')
              ? d.image_url
              : `/${d.image_url}`;

            return (
              <div
                key={d.id}
                className={`bg-[#1A1816] border rounded-xl overflow-hidden transition-all flex flex-col justify-between ${
                  d.is_active === false
                    ? 'border-red-950/60 opacity-70'
                    : 'border-[#2D2722] hover:border-[#D4AF6A]/30'
                }`}
              >
                <div>
                  {/* Artwork Preview Card */}
                  <div className="relative aspect-[1/1.414] bg-black overflow-hidden border-b border-[#2D2722]">
                    <img
                      src={imgSrc}
                      alt={d.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />

                    {/* Live Preview Overlay Simulation */}
                    <div
                      className="absolute pointer-events-none flex flex-col items-center justify-center text-center select-none"
                      style={{
                        top: `${d.overlay_config?.posY || 46}%`,
                        left: `${d.overlay_config?.posX || 50}%`,
                        width: `${d.overlay_config?.maxWidth || 68}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: d.overlay_config?.fontAr || "'Amiri', serif",
                          fontSize: `${(d.overlay_config?.fontSizeAr || 34) * 0.45}px`,
                          color: d.overlay_config?.textColor || '#ffffff',
                          textShadow: d.overlay_config?.textShadow || '0 2px 7px rgba(0,0,0,0.85)',
                          lineHeight: 1.2,
                        }}
                      >
                        نور العالم
                      </span>
                      <span
                        style={{
                          fontFamily: d.overlay_config?.fontEn || "'Cinzel', serif",
                          fontSize: `${(d.overlay_config?.fontSizeEn || 28) * 0.45}px`,
                          color: d.overlay_config?.textColor || '#ffffff',
                          textShadow: d.overlay_config?.textShadow || '0 2px 7px rgba(0,0,0,0.85)',
                          letterSpacing: '1px',
                          textTransform: 'uppercase',
                        }}
                      >
                        NOOR
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div className="absolute top-2 left-2 flex items-center gap-1">
                      <span className="bg-[#141210]/90 text-[#D4AF6A] border border-[#D4AF6A]/30 px-2 py-0.5 rounded text-[10px] font-mono">
                        #{d.sort_order || 0}
                      </span>
                      {d.is_active === false && (
                        <span className="bg-red-950/90 text-red-300 border border-red-800 px-2 py-0.5 rounded text-[10px] font-mono font-semibold">
                          INACTIVE
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Info Body */}
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#2D2722] text-[#A39684]">
                        {d.category_label || d.category}
                      </span>
                      <span className="text-[10px] font-mono text-[#736B5E] truncate">
                        {d.id}
                      </span>
                    </div>

                    <h4 className="text-sm font-serif font-medium text-[#F5EFE6] truncate" title={d.title}>
                      {d.title}
                    </h4>

                    {d.description && (
                      <p className="text-[11px] text-[#A39684] line-clamp-2 mt-1">
                        {d.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="p-3 bg-[#141210] border-t border-[#2D2722] flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(d)}
                    className="px-3 py-1.5 bg-[#2D2722] hover:bg-[#3D352E] text-[#F5EFE6] rounded text-xs font-mono transition"
                  >
                    ✏️ Configure
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleStatus(d.id, d.is_active !== false)}
                    disabled={isToggling}
                    className={`px-3 py-1.5 rounded text-xs font-mono font-medium transition ${
                      d.is_active !== false
                        ? 'bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/60 border border-emerald-800'
                        : 'bg-red-950/40 text-red-300 hover:bg-red-900/60 border border-red-800'
                    }`}
                  >
                    {isToggling ? '...' : d.is_active !== false ? 'Active ●' : 'Hidden ○'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* MODAL: ADD / EDIT DESIGN */}
        {showModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-[#141210] border border-[#2D2722] rounded-xl w-full max-w-2xl my-8 overflow-hidden shadow-2xl animate-fade-in">
              {/* Modal Header */}
              <div className="p-5 border-b border-[#2D2722] flex items-center justify-between">
                <div>
                  <h3 className="text-base font-serif font-semibold text-[#F5EFE6]">
                    {editingDesign ? `Configure Design: ${editingDesign.title}` : 'Add New Persian Frame Design'}
                  </h3>
                  <p className="text-xs text-[#A39684] font-mono mt-0.5">
                    Set artwork image, category, and typography overlay coordinates.
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

              {/* Form */}
              <form onSubmit={handleFormSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-[#A39684] mb-1">
                      Design Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. Damascus Royal Silk Frame"
                      className="w-full bg-[#1A1816] border border-[#2D2722] rounded-lg px-3 py-2 text-xs font-mono text-[#F5EFE6] focus:border-[#D4AF6A] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-[#A39684] mb-1">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => {
                        const cat = e.target.value as CMSDesign['category'];
                        const map: Record<string, string> = {
                          crimson: 'Crimson & Ruby',
                          blue: 'Royal Blue & Indigo',
                          pastel: 'Pastel & Garden',
                          amber: 'Amber & Heritage',
                          vintage: 'Vintage & Classical',
                          custom: 'Custom Frame',
                        };
                        setFormData({
                          ...formData,
                          category: cat,
                          category_label: map[cat] || cat,
                        });
                      }}
                      className="w-full bg-[#1A1816] border border-[#2D2722] rounded-lg px-3 py-2 text-xs font-mono text-[#F5EFE6] focus:border-[#D4AF6A] focus:outline-none"
                    >
                      <option value="crimson">Crimson &amp; Ruby</option>
                      <option value="blue">Royal Blue &amp; Indigo</option>
                      <option value="pastel">Pastel &amp; Garden</option>
                      <option value="amber">Amber &amp; Heritage</option>
                      <option value="vintage">Vintage &amp; Classical</option>
                      <option value="custom">Custom Frame</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-mono text-[#A39684] mb-1">
                      Image URL or Path *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      placeholder="/assets/designs/design1.jpg or Storage URL"
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

                {/* Overlay Position Calibration */}
                <div className="p-4 bg-[#1A1816] border border-[#2D2722] rounded-xl space-y-3">
                  <h4 className="text-xs font-mono font-semibold text-[#D4AF6A] uppercase tracking-wider">
                    Typography Overlay Calibration
                  </h4>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-mono text-[#A39684] mb-1">
                        X Center (%): {formData.overlay_config.posX}%
                      </label>
                      <input
                        type="range"
                        min="20"
                        max="80"
                        value={formData.overlay_config.posX}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            overlay_config: {
                              ...formData.overlay_config,
                              posX: parseInt(e.target.value, 10),
                            },
                          })
                        }
                        className="w-full accent-[#D4AF6A]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-[#A39684] mb-1">
                        Y Center (%): {formData.overlay_config.posY}%
                      </label>
                      <input
                        type="range"
                        min="20"
                        max="80"
                        value={formData.overlay_config.posY}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            overlay_config: {
                              ...formData.overlay_config,
                              posY: parseInt(e.target.value, 10),
                            },
                          })
                        }
                        className="w-full accent-[#D4AF6A]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-[#A39684] mb-1">
                        Max Width (%): {formData.overlay_config.maxWidth}%
                      </label>
                      <input
                        type="range"
                        min="40"
                        max="90"
                        value={formData.overlay_config.maxWidth}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            overlay_config: {
                              ...formData.overlay_config,
                              maxWidth: parseInt(e.target.value, 10),
                            },
                          })
                        }
                        className="w-full accent-[#D4AF6A]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-[11px] font-mono text-[#A39684] mb-1">
                        Font Color
                      </label>
                      <input
                        type="text"
                        value={formData.overlay_config.textColor}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            overlay_config: {
                              ...formData.overlay_config,
                              textColor: e.target.value,
                            },
                          })
                        }
                        className="w-full bg-[#141210] border border-[#2D2722] rounded px-2.5 py-1.5 text-xs font-mono text-[#F5EFE6]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono text-[#A39684] mb-1">
                        Text Shadow
                      </label>
                      <input
                        type="text"
                        value={formData.overlay_config.textShadow}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            overlay_config: {
                              ...formData.overlay_config,
                              textShadow: e.target.value,
                            },
                          })
                        }
                        className="w-full bg-[#141210] border border-[#2D2722] rounded px-2.5 py-1.5 text-xs font-mono text-[#F5EFE6]"
                      />
                    </div>
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="flex items-center gap-6 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="rounded border-[#2D2722] bg-[#1A1816] text-[#D4AF6A] focus:ring-0"
                    />
                    <span className="text-xs font-mono text-[#F5EFE6]">Active on Storefront</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_featured}
                      onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                      className="rounded border-[#2D2722] bg-[#1A1816] text-[#D4AF6A] focus:ring-0"
                    />
                    <span className="text-xs font-mono text-[#F5EFE6]">Featured</span>
                  </label>
                </div>

                {/* Modal Footer */}
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
                    {modalSubmitting ? 'Saving...' : editingDesign ? 'Save Changes' : 'Create Design'}
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
