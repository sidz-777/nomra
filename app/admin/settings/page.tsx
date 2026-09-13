'use client';

import React, { useState } from 'react';
import AdminGuard from '@/components/admin/AdminGuard';
import AdminLayoutClient from '@/components/admin/AdminLayoutClient';
import { PUBLIC_CONFIG } from '@/lib/config';

export default function AdminSettingsPage() {
  const [framePrice, setFramePrice] = useState<number | string>(PUBLIC_CONFIG.PRICING.FRAME_BASE_PRICE);
  const [deposit, setDeposit] = useState<number | string>(PUBLIC_CONFIG.PRICING.DEPOSIT_PER_FRAME);
  const [cod, setCod] = useState<number | string>(PUBLIC_CONFIG.PRICING.COD_BALANCE);
  const [gift, setGift] = useState<number | string>(PUBLIC_CONFIG.PRICING.GIFT_PACKAGING_PRICE);
  const [waPhone, setWaPhone] = useState<string>(PUBLIC_CONFIG.WHATSAPP_PHONE);
  const [upiId, setUpiId] = useState<string>('namoraworld@upi');

  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/admin/update-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          framePrice: Number(framePrice),
          deposit: Number(deposit),
          cod: Number(cod),
          gift: Number(gift),
          waPhone,
          upiId,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({
          type: 'success',
          message: '✅ Store parameters updated successfully! In-memory and database sync complete.',
        });
      } else {
        throw new Error(data?.error || 'Failed to update settings');
      }
    } catch (err: any) {
      console.error('Settings save error:', err);
      setFeedback({
        type: 'error',
        message: `❌ ${err?.message || 'Failed to save store parameters'}`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminGuard>
      <AdminLayoutClient title="Store Parameters &amp; Credentials">
        <div className="max-w-3xl space-y-6">
          {/* FEEDBACK ALERT */}
          {feedback && (
            <div
              className={`p-4 rounded-xl text-xs font-mono border ${
                feedback.type === 'success'
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                  : 'bg-red-950/40 border-red-500/30 text-red-300'
              }`}
            >
              {feedback.message}
            </div>
          )}

          {/* CARD 1: COMMERCIAL PRICING & DEPOSIT RULES */}
          <div className="bg-[#1A1816] border border-[#2D2722] rounded-2xl p-6 sm:p-8">
            <div className="font-serif text-lg font-bold text-[#D4AF6A] mb-1">
              Commercial Pricing &amp; Deposit Rules
            </div>
            <p className="text-xs text-[#A39684] mb-6">
              Control standard A4 frame prices, advance reservation deposits, and add-on rates across the storefront.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-[#A39684] mb-1.5">
                    Standard Frame Price (INR)
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={framePrice}
                    onChange={(e) => setFramePrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#0E0D0C] border border-[#2D2722] focus:border-[#D4AF6A] rounded-lg text-sm font-mono text-[#F5EFE6] outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-[#A39684] mb-1.5">
                    Online Advance Deposit per Frame
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={deposit}
                    onChange={(e) => setDeposit(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#0E0D0C] border border-[#2D2722] focus:border-[#D4AF6A] rounded-lg text-sm font-mono text-[#F5EFE6] outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-[#A39684] mb-1.5">
                    Standard COD Balance to Collect
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={cod}
                    onChange={(e) => setCod(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#0E0D0C] border border-[#2D2722] focus:border-[#D4AF6A] rounded-lg text-sm font-mono text-[#F5EFE6] outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-[#A39684] mb-1.5">
                    Luxury Gift Add-on (+INR)
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={gift}
                    onChange={(e) => setGift(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#0E0D0C] border border-[#2D2722] focus:border-[#D4AF6A] rounded-lg text-sm font-mono text-[#F5EFE6] outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-[#A39684] mb-1.5">
                    Official WhatsApp Helpline Phone
                  </label>
                  <input
                    type="text"
                    required
                    value={waPhone}
                    onChange={(e) => setWaPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#0E0D0C] border border-[#2D2722] focus:border-[#D4AF6A] rounded-lg text-sm font-mono text-[#F5EFE6] outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-[#A39684] mb-1.5">
                    Store UPI ID (For Advance Deposits)
                  </label>
                  <input
                    type="text"
                    required
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#0E0D0C] border border-[#2D2722] focus:border-[#D4AF6A] rounded-lg text-sm font-mono text-[#F5EFE6] outline-none transition-all"
                  />
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-[#D4AF6A] hover:bg-[#E5C384] disabled:opacity-50 text-[#141210] font-semibold text-sm rounded-lg transition-all shadow-md inline-flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-[#141210] border-t-transparent rounded-full animate-spin" />
                      <span>Saving Parameters...</span>
                    </>
                  ) : (
                    <span>💾 Save Store Parameters</span>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* CARD 2: SUPABASE DATABASE SETUP GUIDE */}
          <div className="bg-[#1A1816] border border-[#2D2722] rounded-2xl p-6 sm:p-8">
            <div className="font-serif text-lg font-bold text-[#D4AF6A] mb-1">
              Supabase Database Setup Guide
            </div>
            <p className="text-xs text-[#A39684] mb-4">
              Follow these two quick steps to link your live Supabase project.
            </p>

            <div className="space-y-4 text-xs text-[#F5EFE6] leading-relaxed">
              <div className="p-4 bg-[#0E0D0C] rounded-lg border border-[#2D2722]">
                <strong className="text-[#D4AF6A] block mb-1">Step 1: Run the Database Schema SQL</strong>
                Open your Supabase Project Dashboard &rarr; <strong>SQL Editor</strong> &rarr; Click <strong>New query</strong> &rarr; Paste the contents of <code className="text-[#D4AF6A] font-mono">supabase_schema.sql</code> and click <strong>Run</strong>.
              </div>

              <div className="p-4 bg-[#0E0D0C] rounded-lg border border-[#2D2722]">
                <strong className="text-[#D4AF6A] block mb-1">Step 2: Connect Your API Keys</strong>
                Open your Supabase Project Settings &rarr; <strong>API</strong> &rarr; Add Project URL &amp; <code className="text-[#D4AF6A] font-mono">anon</code> public key to your environment variables:
                <pre className="mt-2.5 p-3 bg-[#141210] border border-[#2D2722] rounded text-[#D4AF6A] font-mono text-[11px] overflow-x-auto">
{`NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOi..."
SUPABASE_SERVICE_KEY="eyJhbGciOi..."`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </AdminLayoutClient>
    </AdminGuard>
  );
}
