'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import AdminGuard, { useAdminAuth } from '@/components/admin/AdminGuard';
import AdminLayoutClient from '@/components/admin/AdminLayoutClient';
import {
  CHECKLIST_STEPS,
  STATUS_LABELS,
  STATUS_COLORS,
  COURIERS,
  VALID_ORDER_TRANSITIONS,
} from '@/lib/admin/types';

export default function AdminOrderDetailPage() {
  const params = useParams();
  const orderId = params?.orderId as string;
  const { role, email: adminEmail } = useAdminAuth();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Status transition state
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Checklist state
  const [checklist, setChecklist] = useState<Record<string, boolean>>({});
  const [savingChecklist, setSavingChecklist] = useState(false);

  // Shipping state
  const [courierName, setCourierName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [savingShipping, setSavingShipping] = useState(false);

  // Notes state
  const [notes, setNotes] = useState<any[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  // Load full order details
  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`);
      const data = await res.json();
      if (data.success && data.order) {
        setOrder(data.order);
        setChecklist(data.order.production_checklist || {});
        setCourierName(data.order.courier_name || '');
        setTrackingNumber(data.order.tracking_number || '');
        setTrackingUrl(data.order.tracking_url || '');
        setNotes(data.order.notes || []);
      } else {
        setError(data.error || 'Order not found');
      }
    } catch (err: any) {
      setError(err?.message || 'Error connecting to database');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // Handle Order Status Progression
  const handleUpdateStatus = async (newStatus: string) => {
    if (!order) return;
    if (newStatus === 'cancelled') {
      const confirmed = window.confirm('Are you sure you want to cancel this order? This action will be audited.');
      if (!confirmed) return;
    }

    setUpdatingStatus(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/admin/update-order-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: order.id,
          new_status: newStatus,
          notes: `Updated to ${newStatus} from Order Operations Detail`,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setStatusMessage(`Order updated to ${STATUS_LABELS[newStatus] || newStatus}`);
        await fetchOrder();
      } else {
        alert(data.error || 'Failed to update status');
      }
    } catch (err: any) {
      alert(err?.message || 'Network error updating status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Handle Checklist Item Toggle
  const handleToggleChecklist = async (stepId: string) => {
    if (!order) return;
    const updated = {
      ...checklist,
      [stepId]: !checklist[stepId],
    };
    setChecklist(updated);
    setSavingChecklist(true);

    try {
      await fetch('/api/admin/update-checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: order.id,
          checklist: updated,
        }),
      });
    } catch (err: any) {
      console.error('Checklist update error:', err);
    } finally {
      setSavingChecklist(false);
    }
  };

  // Handle Save Shipping & Dispatch
  const handleSaveShipping = async (markShipped = false) => {
    if (!order) return;
    setSavingShipping(true);
    try {
      let finalTrackingUrl = trackingUrl;
      if (!finalTrackingUrl && trackingNumber) {
        if (courierName.includes('BlueDart')) {
          finalTrackingUrl = `https://www.bluedart.com/tracking?track=${encodeURIComponent(trackingNumber)}`;
        } else if (courierName.includes('Delhivery')) {
          finalTrackingUrl = `https://www.delhivery.com/track/package/${encodeURIComponent(trackingNumber)}`;
        }
      }

      const res = await fetch('/api/admin/save-shipping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: order.id,
          courier_name: courierName,
          tracking_number: trackingNumber,
          tracking_url: finalTrackingUrl,
          mark_shipped: markShipped,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert(markShipped ? 'Shipping details saved and order marked DISPATCHED!' : 'Shipping details saved successfully!');
        await fetchOrder();
      } else {
        alert(data.error || 'Failed to save shipping');
      }
    } catch (err: any) {
      alert(err?.message || 'Network error saving shipping');
    } finally {
      setSavingShipping(false);
    }
  };

  // Handle Add Internal Operational Note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim() || !order) return;

    setAddingNote(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          note_text: newNoteText.trim(),
          is_internal: true,
        }),
      });

      const data = await res.json();
      if (data.success && data.note) {
        setNotes([data.note, ...notes]);
        setNewNoteText('');
      } else {
        alert(data.error || 'Failed to save note');
      }
    } catch (err: any) {
      alert(err?.message || 'Network error saving note');
    } finally {
      setAddingNote(false);
    }
  };

  if (loading) {
    return (
      <AdminGuard requiredRoles={['owner', 'admin', 'staff']}>
        <AdminLayoutClient title="Order Details">
          <div className="bg-[#141210] border border-[#2D2722] rounded-xl p-16 text-center text-xs font-mono text-[#A39684]">
            <div className="inline-block animate-spin text-3xl mb-3">⏳</div>
            <p>Loading order details from Supabase...</p>
          </div>
        </AdminLayoutClient>
      </AdminGuard>
    );
  }

  if (error || !order) {
    return (
      <AdminGuard requiredRoles={['owner', 'admin', 'staff']}>
        <AdminLayoutClient title="Order Not Found">
          <div className="bg-[#141210] border border-red-500/30 rounded-xl p-12 text-center text-xs font-mono text-red-400">
            <p className="text-lg font-bold mb-2">Order Not Found</p>
            <p>{error || 'The requested order could not be located in the database.'}</p>
            <Link
              href="/admin/orders"
              className="inline-block mt-4 px-4 py-2 bg-[#1E1B18] text-[#D4AF6A] border border-[#2D2722] rounded-lg"
            >
              ← Return to Orders
            </Link>
          </div>
        </AdminLayoutClient>
      </AdminGuard>
    );
  }

  const statusStyle = STATUS_COLORS[order.status] || {
    bg: 'bg-zinc-800',
    text: 'text-zinc-400',
    border: 'border-zinc-700',
  };

  const allowedTransitions = VALID_ORDER_TRANSITIONS[order.status] || [];
  const checklistCheckedCount = Object.values(checklist).filter(Boolean).length;
  const items = order.items || [];

  // WhatsApp Message Templates Generator
  const waPhone = (order.phone || '').replace(/[^0-9]/g, '');
  const waTemplates = [
    {
      title: '1. Deposit Confirmation & Review',
      text: `Hello ${order.customer_name || 'there'}, your NAMORA bespoke calligraphy order #${order.order_number} is confirmed! We have received your ₹${order.deposit_amount} advance deposit and our master artisan is preparing your artwork.`,
    },
    {
      title: '2. Artwork in Production',
      text: `Greetings ${order.customer_name || ''}! Your custom Arabic calligraphy frame (#${order.order_number}) is currently in production at our studio. Quality inspection will be conducted shortly.`,
    },
    {
      title: '3. Dispatched & Tracking Link',
      text: `Great news ${order.customer_name || ''}! Your NAMORA frame has been dispatched via ${order.courier_name || 'courier'} (AWB: ${order.tracking_number || 'N/A'}). Track your package here: ${order.tracking_url || 'https://namoraworld.com/track-order'}. The remaining balance due on delivery is ₹${order.cod_amount}.`,
    },
    {
      title: '4. Delivery Reminder',
      text: `Hello ${order.customer_name || ''}, your NAMORA package is scheduled for delivery today. Please keep ₹${order.cod_amount} cash/UPI ready for the delivery partner. Thank you!`,
    },
  ];

  return (
    <AdminGuard requiredRoles={['owner', 'admin', 'staff']}>
      <AdminLayoutClient title={`Order ${order.order_number || order.id}`}>
        <div className="flex flex-col gap-6 max-w-7xl mx-auto pb-16">
          {/* Header Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#141210] p-6 rounded-xl border border-[#2D2722]">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
                <Link
                  href="/admin/orders"
                  className="text-xs font-mono text-[#A39684] hover:text-[#D4AF6A] flex items-center gap-1 transition-colors"
                >
                  <span>←</span> Orders
                </Link>
                <span className="text-[#A39684]">/</span>
                <span className="font-mono text-sm text-[#D4AF6A] font-bold">
                  {order.order_number || `#${order.id.slice(0, 8)}`}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                >
                  {STATUS_LABELS[order.status] || order.status}
                </span>
              </div>
              <div className="text-[11px] font-mono text-[#A39684]">
                Placed on{' '}
                {new Date(order.created_at).toLocaleString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {waPhone && (
                <a
                  href={`https://wa.me/${waPhone.length === 10 ? '91' + waPhone : waPhone}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 rounded-lg text-xs font-mono transition-all flex items-center gap-2"
                >
                  <span>💬</span> WhatsApp Customer
                </a>
              )}
              <Link
                href={`/track-order?orderId=${encodeURIComponent(order.order_number || order.id)}`}
                target="_blank"
                className="px-3.5 py-2 bg-[#1E1B18] hover:bg-[#2A2420] text-[#F5EFE6] border border-[#2D2722] hover:border-[#D4AF6A]/50 rounded-lg text-xs font-mono transition-all flex items-center gap-2"
              >
                <span>🔍</span> Public Tracking View
              </Link>
            </div>
          </div>

          {/* Status Message Notification */}
          {statusMessage && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl text-xs font-mono">
              ✓ {statusMessage}
            </div>
          )}

          {/* Grid: 2 Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT COLUMN (2 Cols): Products, Personalization, Lifecycle Actions, Checklist */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              {/* Order Items & Personalization */}
              <div className="bg-[#141210] rounded-xl border border-[#2D2722] p-6">
                <h2 className="font-serif text-base font-bold text-[#F5EFE6] mb-4 flex items-center justify-between">
                  <span>Artisanal Items &amp; Personalization</span>
                  <span className="text-xs font-mono font-normal text-[#A39684]">
                    {items.length} item{items.length === 1 ? '' : 's'}
                  </span>
                </h2>

                <div className="flex flex-col gap-4">
                  {items.map((item: any, idx: number) => (
                    <div
                      key={item.id || idx}
                      className="bg-[#1A1816] rounded-xl border border-[#2D2722] p-4 flex flex-col gap-3 font-mono"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="font-bold text-[#F5EFE6] text-sm">
                            {item.product_title || 'Bespoke Calligraphy Frame'}
                          </div>
                          <div className="text-[11px] text-[#A39684] mt-0.5">
                            Unit Price: ₹{item.price ?? 499}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-[#D4AF6A]">
                            ₹{(item.price ?? 499) + (item.has_gift ? item.gift_price || 69 : 0)}
                          </span>
                        </div>
                      </div>

                      {/* Personalization Details Box */}
                      <div className="bg-[#141210] p-3.5 rounded-lg border border-[#2D2722]/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-[#A39684] block text-[10px] uppercase">
                            English Name
                          </span>
                          <span className="font-bold text-[#F5EFE6]">
                            {item.english_name || '—'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#A39684] block text-[10px] uppercase">
                            Arabic Calligraphy
                          </span>
                          <span className="font-bold text-[#D4AF6A] text-sm">
                            {item.arabic_name || '—'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#A39684] block text-[10px] uppercase">
                            Ink Style / Foil
                          </span>
                          <span className="text-[#F5EFE6]">
                            {item.ink_style || 'Gold Foil'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#A39684] block text-[10px] uppercase">
                            Calligraphy Script
                          </span>
                          <span className="text-[#F5EFE6]">
                            {item.font_style || 'Diwani Royal'}
                          </span>
                        </div>
                      </div>

                      {/* Gift Option Box */}
                      {item.has_gift && (
                        <div className="bg-amber-500/5 p-3 rounded-lg border border-amber-500/20 text-xs">
                          <div className="font-bold text-amber-400 mb-1 flex items-center gap-1">
                            <span>🎁</span> Gift Packaging Included (+₹{item.gift_price || 69})
                          </div>
                          <div className="text-[#F5EFE6] text-[11px] space-y-0.5">
                            {item.gift_to && <div><span className="text-[#A39684]">To:</span> {item.gift_to}</div>}
                            {item.gift_from && <div><span className="text-[#A39684]">From:</span> {item.gift_from}</div>}
                            {item.gift_message && (
                              <div className="italic text-[#D4AF6A] mt-1 bg-[#141210] p-2 rounded border border-[#2D2722]">
                                &ldquo;{item.gift_message}&rdquo;
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Lifecycle Progression Actions */}
              <div className="bg-[#141210] rounded-xl border border-[#2D2722] p-6">
                <h2 className="font-serif text-base font-bold text-[#F5EFE6] mb-2">
                  Order Status Progression
                </h2>
                <p className="text-xs font-mono text-[#A39684] mb-4">
                  Current Status:{' '}
                  <span className={`font-bold ${statusStyle.text}`}>
                    {STATUS_LABELS[order.status] || order.status}
                  </span>
                  . Authorized next transitions are enforced by state machine.
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  {allowedTransitions.length === 0 ? (
                    <div className="text-xs font-mono text-[#A39684] italic">
                      No further status transitions available for this terminal state.
                    </div>
                  ) : (
                    allowedTransitions.map((nextSt) => {
                      const isDanger = nextSt === 'cancelled' || nextSt === 'returned';
                      return (
                        <button
                          key={nextSt}
                          type="button"
                          disabled={updatingStatus}
                          onClick={() => handleUpdateStatus(nextSt)}
                          className={`px-4 py-2 rounded-lg text-xs font-mono font-semibold transition-all border disabled:opacity-50 ${
                            isDanger
                              ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30'
                              : 'bg-[#D4AF6A]/10 hover:bg-[#D4AF6A]/20 text-[#D4AF6A] border-[#D4AF6A]/40'
                          }`}
                        >
                          Mark as {STATUS_LABELS[nextSt] || nextSt} →
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* 10-Point Artisanal Production Checklist */}
              <div className="bg-[#141210] rounded-xl border border-[#2D2722] p-6">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="font-serif text-base font-bold text-[#F5EFE6]">
                      10-Point Artisanal Production Checklist
                    </h2>
                    <p className="text-xs font-mono text-[#A39684] mt-0.5">
                      Completed: {checklistCheckedCount} of 10 checks verified
                    </p>
                  </div>
                  {savingChecklist && (
                    <span className="text-[10px] font-mono text-[#D4AF6A] animate-pulse">
                      Saving checklist...
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-[#1E1B18] rounded-full overflow-hidden mb-4 border border-[#2D2722]">
                  <div
                    className="h-full bg-[#D4AF6A] transition-all duration-300"
                    style={{ width: `${(checklistCheckedCount / 10) * 100}%` }}
                  />
                </div>

                <div className="flex flex-col gap-2 font-mono text-xs">
                  {CHECKLIST_STEPS.map((step) => {
                    const checked = Boolean(checklist[step.id]);
                    return (
                      <label
                        key={step.id}
                        className={`flex items-center gap-3 p-2.5 rounded-lg border transition-colors cursor-pointer ${
                          checked
                            ? 'bg-[#1E1B18] border-[#D4AF6A]/40 text-[#F5EFE6]'
                            : 'bg-[#141210] border-[#2D2722] text-[#A39684] hover:border-[#D4AF6A]/20'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleToggleChecklist(step.id)}
                          className="w-4 h-4 rounded border-[#2D2722] text-[#D4AF6A] focus:ring-0 focus:ring-offset-0 bg-[#0E0D0C] cursor-pointer"
                        />
                        <span className={checked ? 'text-[#F5EFE6] font-medium' : ''}>
                          {step.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Internal Operational Notes Feed */}
              <div className="bg-[#141210] rounded-xl border border-[#2D2722] p-6">
                <h2 className="font-serif text-base font-bold text-[#F5EFE6] mb-1">
                  Internal Operational Notes
                </h2>
                <p className="text-xs font-mono text-[#A39684] mb-4">
                  Internal notes are never exposed to customers. All additions are audited.
                </p>

                {/* Add note form */}
                <form onSubmit={handleAddNote} className="mb-6 flex flex-col gap-2">
                  <textarea
                    rows={2}
                    placeholder="Add operational or artisanal notes (e.g. Calligraphy approved, customer requested black frame)..."
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    className="w-full bg-[#1E1B18] border border-[#2D2722] focus:border-[#D4AF6A] text-[#F5EFE6] p-3 rounded-lg text-xs font-mono outline-none resize-none placeholder-[#736B63]"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={addingNote || !newNoteText.trim()}
                      className="px-4 py-2 bg-[#D4AF6A] hover:bg-[#b89555] text-[#0E0D0C] font-mono text-xs font-bold rounded-lg transition-all disabled:opacity-50"
                    >
                      {addingNote ? 'Saving Note...' : 'Add Internal Note'}
                    </button>
                  </div>
                </form>

                {/* Notes Stream */}
                <div className="flex flex-col gap-3 font-mono text-xs">
                  {notes.length === 0 ? (
                    <div className="text-[#736B63] italic py-2">No internal notes logged yet.</div>
                  ) : (
                    notes.map((n: any, idx: number) => (
                      <div
                        key={n.id || idx}
                        className="bg-[#1A1816] p-3 rounded-lg border border-[#2D2722] flex flex-col gap-1"
                      >
                        <div className="flex items-center justify-between text-[10px] text-[#A39684]">
                          <span className="font-semibold text-[#D4AF6A]">
                            {n.author_email || 'admin@namoraworld.com'}
                          </span>
                          <span>
                            {n.created_at ? new Date(n.created_at).toLocaleString('en-GB') : '—'}
                          </span>
                        </div>
                        <div className="text-[#F5EFE6] whitespace-pre-wrap mt-0.5">
                          {n.note_text}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN (1 Col): Customer, Financials, Shipping, WhatsApp */}
            <div className="flex flex-col gap-6">
              {/* Customer Profile & Shipping Address */}
              <div className="bg-[#141210] rounded-xl border border-[#2D2722] p-6">
                <h2 className="font-serif text-base font-bold text-[#F5EFE6] mb-4 flex items-center justify-between">
                  <span>Customer &amp; Address</span>
                  {order.phone && (
                    <Link
                      href={`/admin/customers/${encodeURIComponent(order.phone)}`}
                      className="text-xs font-mono text-[#D4AF6A] hover:underline font-normal"
                    >
                      View CRM Profile →
                    </Link>
                  )}
                </h2>

                <div className="space-y-3 font-mono text-xs">
                  <div>
                    <span className="text-[#A39684] block text-[10px] uppercase">Name</span>
                    <span className="font-semibold text-[#F5EFE6] text-sm">
                      {order.customer_name || 'Anonymous Customer'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[#A39684] block text-[10px] uppercase">Phone</span>
                    <span className="text-[#F5EFE6]">{order.phone || '—'}</span>
                  </div>

                  <div>
                    <span className="text-[#A39684] block text-[10px] uppercase">Delivery Address</span>
                    <span className="text-[#F5EFE6] leading-relaxed block mt-0.5">
                      {order.address || '—'}
                      {order.city ? `, ${order.city}` : ''}
                      {order.state ? `, ${order.state}` : ''}
                      {order.pincode ? ` - ${order.pincode}` : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* Financials & Payment Breakdown */}
              <div className="bg-[#141210] rounded-xl border border-[#2D2722] p-6">
                <h2 className="font-serif text-base font-bold text-[#F5EFE6] mb-4">
                  Financial Breakdown
                </h2>

                <div className="space-y-2.5 font-mono text-xs">
                  <div className="flex justify-between text-[#A39684]">
                    <span>Total Order Value</span>
                    <span className="font-bold text-[#F5EFE6] text-sm">₹{order.total_amount ?? 0}</span>
                  </div>

                  <div className="flex justify-between text-emerald-400">
                    <span>Advance Deposit Paid</span>
                    <span className="font-bold">₹{order.deposit_amount ?? 0}</span>
                  </div>

                  <div className="flex justify-between text-amber-400 pt-2 border-t border-[#2D2722]">
                    <span>COD Due on Delivery</span>
                    <span className="font-bold text-sm">₹{order.cod_amount ?? 0}</span>
                  </div>

                  <div className="pt-3 border-t border-[#2D2722] space-y-1.5 text-[11px] text-[#A39684]">
                    <div>
                      Payment Status:{' '}
                      <span className="text-[#F5EFE6] font-semibold uppercase">
                        {order.payment_status || 'unpaid'}
                      </span>
                    </div>
                    {order.razorpay_payment_id && (
                      <div className="truncate">
                        Razorpay ID: <span className="text-[#F5EFE6]">{order.razorpay_payment_id}</span>
                      </div>
                    )}
                    <div className="pt-1">
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                        ⚡ RAZORPAY TEST MODE
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Shipping & Dispatch Controls */}
              <div className="bg-[#141210] rounded-xl border border-[#2D2722] p-6">
                <h2 className="font-serif text-base font-bold text-[#F5EFE6] mb-4">
                  Shipping &amp; Dispatch
                </h2>

                <div className="space-y-3 font-mono text-xs">
                  <div>
                    <label className="text-[#A39684] block text-[10px] uppercase mb-1">
                      Courier Partner
                    </label>
                    <select
                      value={courierName}
                      onChange={(e) => setCourierName(e.target.value)}
                      className="w-full bg-[#1E1B18] border border-[#2D2722] focus:border-[#D4AF6A] text-[#F5EFE6] p-2.5 rounded-lg text-xs outline-none"
                    >
                      <option value="">Select Courier Partner</option>
                      {COURIERS.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[#A39684] block text-[10px] uppercase mb-1">
                      Tracking / AWB Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. BLUEDART-984218"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      className="w-full bg-[#1E1B18] border border-[#2D2722] focus:border-[#D4AF6A] text-[#F5EFE6] p-2.5 rounded-lg text-xs outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[#A39684] block text-[10px] uppercase mb-1">
                      Tracking URL
                    </label>
                    <input
                      type="text"
                      placeholder="https://..."
                      value={trackingUrl}
                      onChange={(e) => setTrackingUrl(e.target.value)}
                      className="w-full bg-[#1E1B18] border border-[#2D2722] focus:border-[#D4AF6A] text-[#F5EFE6] p-2.5 rounded-lg text-xs outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-2 pt-2">
                    <button
                      type="button"
                      disabled={savingShipping}
                      onClick={() => handleSaveShipping(false)}
                      className="w-full py-2 bg-[#1E1B18] hover:bg-[#2A2420] text-[#D4AF6A] border border-[#2D2722] hover:border-[#D4AF6A] rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                    >
                      {savingShipping ? 'Saving...' : 'Save Shipping Info'}
                    </button>

                    <button
                      type="button"
                      disabled={savingShipping || !trackingNumber}
                      onClick={() => handleSaveShipping(true)}
                      className="w-full py-2 bg-[#D4AF6A] hover:bg-[#b89555] text-[#0E0D0C] rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                    >
                      Save &amp; Mark as Dispatched 🚚
                    </button>
                  </div>
                </div>
              </div>

              {/* WhatsApp Operational Templates */}
              <div className="bg-[#141210] rounded-xl border border-[#2D2722] p-6">
                <h2 className="font-serif text-base font-bold text-[#F5EFE6] mb-2">
                  WhatsApp Quick Messages
                </h2>
                <p className="text-xs font-mono text-[#A39684] mb-3">
                  Click to copy or send prefilled notification to customer.
                </p>

                <div className="flex flex-col gap-2.5 font-mono text-xs">
                  {waTemplates.map((tpl, i) => (
                    <div
                      key={i}
                      className="bg-[#1A1816] p-3 rounded-lg border border-[#2D2722] flex flex-col gap-1.5"
                    >
                      <div className="font-semibold text-[#D4AF6A] text-[11px]">{tpl.title}</div>
                      <p className="text-[#A39684] text-[11px] leading-relaxed line-clamp-2">
                        {tpl.text}
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(tpl.text);
                            alert('Message template copied to clipboard!');
                          }}
                          className="px-2.5 py-1 bg-[#141210] hover:bg-[#221F1C] border border-[#2D2722] text-[#F5EFE6] rounded text-[10px]"
                        >
                          Copy
                        </button>
                        {waPhone && (
                          <a
                            href={`https://wa.me/${waPhone.length === 10 ? '91' + waPhone : waPhone}?text=${encodeURIComponent(tpl.text)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded text-[10px]"
                          >
                            Send on WhatsApp ↗
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </AdminLayoutClient>
    </AdminGuard>
  );
}
