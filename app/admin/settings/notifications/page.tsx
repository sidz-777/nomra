'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminGuard from '@/components/admin/AdminGuard';
import AdminLayoutClient from '@/components/admin/AdminLayoutClient';
import { NotificationSetting, NOTIFICATION_TYPE_LABELS, NotificationType } from '@/lib/notifications/types';
import { renderNotificationTemplate } from '@/lib/notifications/templates';

export default function AdminNotificationSettingsPage() {
  const [settings, setSettings] = useState<NotificationSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingChannel, setSavingChannel] = useState<string | null>(null);
  const [selectedPreviewType, setSelectedPreviewType] = useState<NotificationType>('order_confirmed');
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/settings/notifications');
        const data = await res.json();
        if (data.success) {
          setSettings(data.settings || []);
        }
      } catch (err: any) {
        console.error('Failed to load notification settings:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleToggle = async (channel: string, currentEnabled: boolean, testMode: boolean) => {
    setSavingChannel(channel);
    setFeedback(null);
    try {
      const res = await fetch('/api/admin/settings/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel,
          is_enabled: !currentEnabled,
          test_mode: testMode,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSettings((prev) =>
          prev.map((s) => (s.channel === channel ? { ...s, is_enabled: !currentEnabled } : s))
        );
        setFeedback(`Updated ${channel.toUpperCase()} channel status.`);
      }
    } catch (err: any) {
      console.error('Toggle error:', err);
    } finally {
      setSavingChannel(null);
    }
  };

  const preview = renderNotificationTemplate(selectedPreviewType, {
    orderId: 'demo-id',
    orderNumber: 'NAM-8429',
    customerName: 'Fatima Al-Zahra',
    phone: '9876543210',
    email: 'fatima@example.com',
    type: selectedPreviewType,
    channel: 'whatsapp',
    trackingUrl: 'https://namoraworld.com/track?token=demo_token_32_characters_long',
    carrier: 'BlueDart Express Air',
    trackingNumber: 'BLU-98234710',
    depositAmount: 49,
    codAmount: 450,
    totalAmount: 499,
  });

  return (
    <AdminGuard requiredRoles={['owner', 'admin']}>
      <AdminLayoutClient title="Notification Settings">
        <div className="space-y-6 max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Link href="/admin/notifications" className="text-xs text-[#D4AF6A] hover:underline font-mono">
                  &larr; Notification Center
                </Link>
              </div>
              <h1 className="font-luxury text-2xl sm:text-3xl font-bold text-[#F5EFE6] tracking-tight mt-1">
                Notification Channel Configuration
              </h1>
              <p className="text-xs sm:text-sm text-[#A39684] mt-1">
                Configure dispatch channels, enforce mock test mode, and inspect standard customer message templates.
              </p>
            </div>
          </div>

          {/* Feedback Toast */}
          {feedback && (
            <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-950/30 text-emerald-300 text-xs flex items-center justify-between animate-fadeIn">
              <span>{feedback}</span>
              <button type="button" onClick={() => setFeedback(null)} className="text-xs opacity-70 hover:opacity-100">
                ✕
              </button>
            </div>
          )}

          {/* Channels Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['whatsapp', 'email', 'sms'].map((ch) => {
              const setting = settings.find((s) => s.channel === ch) || {
                channel: ch,
                is_enabled: true,
                provider: 'mock',
                test_mode: true,
              };
              const isSaving = savingChannel === ch;

              return (
                <div
                  key={ch}
                  className="p-5 rounded-2xl border border-[#2A241C] bg-[#17130E] space-y-4 shadow-luxury"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-luxury font-bold text-base text-[#F5EFE6] uppercase tracking-wider">
                      {ch}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-amber-500/30 bg-amber-950/30 text-amber-300">
                      MOCK ONLY
                    </span>
                  </div>

                  <p className="text-xs text-[#A39684] leading-relaxed">
                    {ch === 'whatsapp'
                      ? 'Automated delivery notifications sent directly to customer WhatsApp mobile numbers.'
                      : ch === 'email'
                      ? 'HTML & text order confirmations sent to verified customer email addresses.'
                      : 'High-priority SMS alerts for dispatch and out-for-delivery notifications.'}
                  </p>

                  <div className="pt-2 border-t border-[#2A241C] flex items-center justify-between">
                    <span className="text-xs text-[#A39684]">Channel Status:</span>
                    <button
                      type="button"
                      disabled={loading || isSaving}
                      onClick={() => handleToggle(ch, setting.is_enabled, setting.test_mode)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        setting.is_enabled
                          ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-800/60'
                          : 'bg-[#2A241C] text-[#A39684] border border-[#3A3226] hover:text-[#F5EFE6]'
                      }`}
                    >
                      {isSaving ? 'Saving...' : setting.is_enabled ? 'Active / Enabled' : 'Disabled'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Template Preview Section */}
          <div className="p-6 rounded-2xl border border-[#2A241C] bg-[#17130E] space-y-4 shadow-luxury">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-wider text-[#A39684] font-semibold">
                  Standard Message Templates
                </span>
                <h2 className="font-luxury text-lg font-bold text-[#F5EFE6] mt-0.5">
                  Template Content Inspection
                </h2>
              </div>

              <select
                value={selectedPreviewType}
                onChange={(e) => setSelectedPreviewType(e.target.value as NotificationType)}
                className="px-3.5 py-2 rounded-xl border border-[#2A241C] bg-[#0E0C0A] text-[#F5EFE6] text-xs font-mono focus:outline-none focus:border-[#D4AF6A] transition"
              >
                {Object.keys(NOTIFICATION_TYPE_LABELS).map((t) => (
                  <option key={t} value={t}>
                    {NOTIFICATION_TYPE_LABELS[t as NotificationType]}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-4 rounded-xl border border-[#2A241C] bg-[#0E0C0A] space-y-2">
              <div className="flex justify-between items-center text-xs pb-2 border-b border-[#2A241C]/60 text-[#A39684]">
                <span className="font-mono">Subject: {preview.subject}</span>
                <span className="text-[10px] font-mono text-[#D4AF6A]">Standard Luxury Copy</span>
              </div>
              <p className="text-xs text-[#F5EFE6] font-mono leading-relaxed whitespace-pre-wrap pt-1">
                {preview.body}
              </p>
            </div>
          </div>

          {/* Security & Isolation Note */}
          <div className="p-4 rounded-xl border border-[#2A241C] bg-[#17130E] text-xs text-[#A39684] space-y-1">
            <strong className="text-[#F5EFE6] font-semibold block">Production Isolation Guarantee:</strong>
            <p>
              Provider secrets and webhook tokens are never returned by the settings endpoint or exposed to client-side bundles. In Phase 4, the platform remains locked to Mock Provider adapters, safeguarding your live external notification budgets and preventing unintended production messaging.
            </p>
          </div>
        </div>
      </AdminLayoutClient>
    </AdminGuard>
  );
}
