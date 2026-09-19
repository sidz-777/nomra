'use client';

import React, { useState, useEffect, useMemo } from 'react';
import AdminGuard from '@/components/admin/AdminGuard';
import AdminLayoutClient from '@/components/admin/AdminLayoutClient';

interface AdminReview {
  id: string;
  customer_name: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected' | 'archived';
  is_featured?: boolean;
  display_order?: number;
  location?: string;
  image_url?: string;
  created_at: string;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'featured'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Add review modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: '',
    rating: 5,
    comment: '',
    location: 'Verified Purchase · India',
    is_featured: false,
    status: 'approved' as 'pending' | 'approved',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadReviews = async () => {
    try {
      const res = await fetch('/api/admin/reviews');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.reviews)) {
          setReviews(json.reviews);
        }
      }
    } catch (err: any) {
      console.warn('Failed to load reviews:', err?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  // Metrics computation
  const metrics = useMemo(() => {
    const total = reviews.length;
    const pending = reviews.filter((r) => r.status === 'pending').length;
    const approved = reviews.filter((r) => r.status === 'approved').length;
    const featured = reviews.filter((r) => r.is_featured).length;
    const avgRating = total > 0
      ? (reviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0) / total).toFixed(1)
      : '5.0';

    return { total, pending, approved, featured, avgRating };
  }, [reviews]);

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      if (activeFilter === 'pending' && r.status !== 'pending') return false;
      if (activeFilter === 'approved' && r.status !== 'approved') return false;
      if (activeFilter === 'rejected' && r.status !== 'rejected') return false;
      if (activeFilter === 'featured' && !r.is_featured) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const name = (r.customer_name || '').toLowerCase();
        const comment = (r.comment || '').toLowerCase();
        const loc = (r.location || '').toLowerCase();
        if (!name.includes(q) && !comment.includes(q) && !loc.includes(q)) return false;
      }

      return true;
    });
  }, [reviews, activeFilter, searchQuery]);

  // Actions
  const handleModerate = async (reviewId: string, newStatus: 'approved' | 'rejected' | 'archived') => {
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'moderate', review_id: reviewId, status: newStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setReviews((prev) =>
          prev.map((r) => (r.id === reviewId ? { ...r, status: newStatus } : r))
        );
        showToast(`Review marked as ${newStatus}!`);
      } else {
        showToast(data.error || 'Failed to update review status');
      }
    } catch {
      showToast('Network error updating review');
    }
  };

  const handleToggleFeature = async (reviewId: string) => {
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_feature', review_id: reviewId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setReviews((prev) =>
          prev.map((r) => (r.id === reviewId ? { ...r, is_featured: data.is_featured } : r))
        );
        showToast(data.is_featured ? 'Review featured on storefront!' : 'Review unfeatured');
      }
    } catch {
      showToast('Network error toggling featured status');
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this review?')) return;
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', review_id: reviewId }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setReviews((prev) => prev.filter((r) => r.id !== reviewId));
        showToast('Review permanently deleted');
      }
    } catch {
      showToast('Network error deleting review');
    }
  };

  const handleCreateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          ...formData,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.review) {
        setReviews((prev) => [data.review, ...prev]);
        showToast('New customer review added successfully!');
        setIsAddModalOpen(false);
        setFormData({
          customer_name: '',
          rating: 5,
          comment: '',
          location: 'Verified Purchase · India',
          is_featured: false,
          status: 'approved',
        });
      } else {
        showToast(data.error || 'Failed to create review');
      }
    } catch {
      showToast('Network error creating review');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminGuard>
      <AdminLayoutClient title="Customer Reviews Moderation">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#1A1816] border border-[#D4AF6A] text-[#F5EFE6] px-4 py-3 rounded-lg shadow-2xl text-xs font-mono animate-fade-in flex items-center gap-2">
            <span>⭐</span> {toastMessage}
          </div>
        )}

        <div className="space-y-6">
          {/* Header Banner */}
          <div className="p-6 rounded-xl bg-[#141210] border border-[#2D2722] flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="font-serif text-xl md:text-2xl font-bold text-[#D4AF6A]">
                Customer Reviews &amp; Testimonials Center
              </h1>
              <p className="text-xs font-mono text-[#A39684] mt-1">
                Moderate buyer feedback, feature authentic unboxing reviews, and maintain genuine customer social proof.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 rounded-lg bg-[#D4AF6A] hover:bg-[#c49e59] text-[#141210] text-xs font-mono font-bold transition-all flex items-center gap-2"
            >
              <span>+</span> Add Verified Review
            </button>
          </div>

          {/* KPI Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 font-mono">
            <div className="bg-[#141210] p-4 rounded-xl border border-[#2D2722]">
              <span className="text-[10px] text-[#A39684] uppercase block">Total Reviews</span>
              <span className="text-xl font-bold text-[#F5EFE6] block mt-1">{metrics.total}</span>
            </div>
            <div className="bg-[#141210] p-4 rounded-xl border border-emerald-500/30">
              <span className="text-[10px] text-emerald-400 uppercase block">Approved (Live)</span>
              <span className="text-xl font-bold text-emerald-400 block mt-1">{metrics.approved}</span>
            </div>
            <div className="bg-[#141210] p-4 rounded-xl border border-amber-500/30">
              <span className="text-[10px] text-amber-400 uppercase block">Pending Moderation</span>
              <span className="text-xl font-bold text-amber-400 block mt-1">{metrics.pending}</span>
            </div>
            <div className="bg-[#141210] p-4 rounded-xl border border-[#D4AF6A]/30">
              <span className="text-[10px] text-[#D4AF6A] uppercase block">Featured Reviews</span>
              <span className="text-xl font-bold text-[#D4AF6A] block mt-1">{metrics.featured}</span>
            </div>
            <div className="bg-[#141210] p-4 rounded-xl border border-[#2D2722]">
              <span className="text-[10px] text-[#A39684] uppercase block">Average Rating</span>
              <span className="text-xl font-bold text-[#F5EFE6] block mt-1">★ {metrics.avgRating}</span>
            </div>
          </div>

          {/* Filter Tabs & Search */}
          <div className="bg-[#141210] p-4 rounded-xl border border-[#2D2722] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar font-mono text-xs">
              {[
                { id: 'all', label: `All (${metrics.total})` },
                { id: 'pending', label: `Pending (${metrics.pending})` },
                { id: 'approved', label: `Approved (${metrics.approved})` },
                { id: 'featured', label: `Featured (${metrics.featured})` },
                { id: 'rejected', label: 'Rejected' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveFilter(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    activeFilter === tab.id
                      ? 'bg-[#D4AF6A] text-[#141210] font-bold'
                      : 'text-[#A39684] hover:text-[#F5EFE6] hover:bg-[#1A1816]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="w-full sm:w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search reviews..."
                className="w-full px-3 py-1.5 bg-[#1A1816] border border-[#2D2722] focus:border-[#D4AF6A] rounded-lg text-xs font-mono text-[#F5EFE6] outline-none"
              />
            </div>
          </div>

          {/* Reviews List */}
          <div className="space-y-3">
            {loading ? (
              <div className="p-12 text-center text-xs font-mono text-[#A39684] bg-[#141210] rounded-xl border border-[#2D2722]">
                Loading customer reviews...
              </div>
            ) : filteredReviews.length === 0 ? (
              <div className="p-12 text-center text-xs font-mono text-[#A39684] bg-[#141210] rounded-xl border border-[#2D2722]">
                No reviews found matching current filter.
              </div>
            ) : (
              filteredReviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-[#141210] p-5 rounded-xl border border-[#2D2722] hover:border-[#D4AF6A]/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2 max-w-3xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-[#F5EFE6]">
                        {review.customer_name}
                      </span>
                      <span className="text-xs text-[#A39684] font-mono">
                        • {review.location || 'Verified Buyer'}
                      </span>
                      <span className="text-amber-400 text-xs">
                        {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          review.status === 'approved'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : review.status === 'pending'
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {review.status.toUpperCase()}
                      </span>
                      {review.is_featured && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#D4AF6A]/20 text-[#D4AF6A]">
                          ★ FEATURED ON STOREFRONT
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#D8CFBF] leading-relaxed italic">
                      &quot;{review.comment}&quot;
                    </p>
                    <div className="text-[10px] font-mono text-[#736B63]">
                      Submitted: {new Date(review.created_at).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Actions Strip */}
                  <div className="flex items-center gap-2 shrink-0 font-mono text-xs">
                    {review.status !== 'approved' && (
                      <button
                        type="button"
                        onClick={() => handleModerate(review.id, 'approved')}
                        className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-lg transition-all font-bold"
                      >
                        ✓ Approve
                      </button>
                    )}
                    {review.status !== 'rejected' && (
                      <button
                        type="button"
                        onClick={() => handleModerate(review.id, 'rejected')}
                        className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-lg transition-all"
                      >
                        ✕ Reject
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleToggleFeature(review.id)}
                      className={`px-3 py-1.5 rounded-lg border transition-all ${
                        review.is_featured
                          ? 'bg-[#D4AF6A] text-[#141210] font-bold border-[#D4AF6A]'
                          : 'bg-[#1A1816] text-[#A39684] hover:text-[#D4AF6A] border-[#2D2722]'
                      }`}
                    >
                      ★ {review.is_featured ? 'Featured' : 'Feature'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(review.id)}
                      className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg transition-all"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ADD REVIEW MODAL */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#141210] border border-[#2D2722] rounded-xl max-w-lg w-full p-6 space-y-4 font-mono">
              <div className="flex items-center justify-between border-b border-[#2D2722] pb-3">
                <h3 className="font-serif text-lg font-bold text-[#F5EFE6]">
                  Add Verified Customer Review
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-[#A39684] hover:text-[#F5EFE6]"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateReview} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[#A39684] mb-1">Customer Display Name</label>
                  <input
                    type="text"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    placeholder="e.g. Ayesha K."
                    className="w-full px-3 py-2 bg-[#1A1816] border border-[#2D2722] focus:border-[#D4AF6A] rounded-lg text-[#F5EFE6] outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#A39684] mb-1">Star Rating (1 - 5)</label>
                    <select
                      value={formData.rating}
                      onChange={(e) => setFormData({ ...formData, rating: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-[#1A1816] border border-[#2D2722] focus:border-[#D4AF6A] rounded-lg text-[#F5EFE6] outline-none"
                    >
                      <option value={5}>★★★★★ (5 Stars)</option>
                      <option value={4}>★★★★☆ (4 Stars)</option>
                      <option value={3}>★★★☆☆ (3 Stars)</option>
                      <option value={2}>★★☆☆☆ (2 Stars)</option>
                      <option value={1}>★☆☆☆☆ (1 Star)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[#A39684] mb-1">Location Tag</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g. Mumbai, Maharashtra"
                      className="w-full px-3 py-2 bg-[#1A1816] border border-[#2D2722] focus:border-[#D4AF6A] rounded-lg text-[#F5EFE6] outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#A39684] mb-1">Review Comment</label>
                  <textarea
                    rows={4}
                    value={formData.comment}
                    onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                    placeholder="Customer's genuine reaction or unboxing quote..."
                    className="w-full px-3 py-2 bg-[#1A1816] border border-[#2D2722] focus:border-[#D4AF6A] rounded-lg text-[#F5EFE6] outline-none"
                    required
                  />
                </div>

                <div className="flex items-center gap-4 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_featured}
                      onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                      className="w-4 h-4 accent-[#D4AF6A]"
                    />
                    <span className="text-[#F5EFE6]">Feature on Storefront Homepage</span>
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
                    {submitting ? 'Saving...' : 'Add Review'}
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
