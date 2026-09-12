import Link from 'next/link';
import { PUBLIC_CONFIG } from '@/lib/config';
import { createClient } from '@/lib/supabase/server';

export default async function HomePage() {
  // Test Supabase client initialization safely on server
  let supabaseConnected = false;
  let productCount: number | null = null;
  let connectionMessage = 'Connected';

  try {
    const supabase = createClient();
    const { count, error } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });

    if (!error) {
      supabaseConnected = true;
      productCount = count ?? 0;
    } else {
      connectionMessage = error.message;
    }
  } catch (err: unknown) {
    connectionMessage = err instanceof Error ? err.message : 'Connection test skipped';
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#141210] text-[#F2EBDD]">
      <div className="max-w-xl w-full bg-[#1E1B18] border border-[#3A322A] rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        {/* Subtle Gold Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#D4AF6A] via-[#E6C585] to-[#D4AF6A]" />

        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-block px-3 py-1 mb-3 text-xs tracking-widest uppercase font-semibold text-[#D4AF6A] bg-[#D4AF6A]/10 border border-[#D4AF6A]/20 rounded-full">
            Phase 2 &mdash; Architecture Foundation
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif tracking-wider text-[#F2EBDD] mb-1">
            NAMORA
          </h1>
          <p className="text-sm tracking-widest text-[#9B8E7A] uppercase font-mono">
            Your Name. Your Space.
          </p>
        </div>

        {/* Architecture Status Grid */}
        <div className="space-y-3 mb-8 text-sm">
          <div className="flex items-center justify-between p-3 bg-[#141210] border border-[#2A241D] rounded-lg">
            <span className="text-[#9B8E7A]">Framework</span>
            <span className="font-mono text-[#D4AF6A]">Next.js 14 (App Router)</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-[#141210] border border-[#2A241D] rounded-lg">
            <span className="text-[#9B8E7A]">Language & UI</span>
            <span className="font-mono text-[#D4AF6A]">React 18 + TypeScript</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-[#141210] border border-[#2A241D] rounded-lg">
            <span className="text-[#9B8E7A]">Styling System</span>
            <span className="font-mono text-[#D4AF6A]">Tailwind CSS (Luxury Tokens)</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-[#141210] border border-[#2A241D] rounded-lg">
            <span className="text-[#9B8E7A]">Supabase Database</span>
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  supabaseConnected ? 'bg-[#8FA878]' : 'bg-[#D4AF6A]'
                }`}
              />
              <span className="font-mono text-xs">
                {supabaseConnected
                  ? `Active (${productCount} SKUs verified)`
                  : connectionMessage}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-[#141210] border border-[#2A241D] rounded-lg">
            <span className="text-[#9B8E7A]">Commercial Invariant</span>
            <span className="font-mono text-[#F2EBDD]">
              ₹{PUBLIC_CONFIG.PRICING.FRAME_BASE_PRICE} Base &bull; ₹{PUBLIC_CONFIG.PRICING.DEPOSIT_PER_FRAME} Deposit
            </span>
          </div>
        </div>

        {/* Route Placeholders */}
        <div className="border-t border-[#3A322A] pt-6 mb-6">
          <p className="text-xs uppercase tracking-wider text-[#9B8E7A] mb-3">
            Initial Route Architecture
          </p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <Link
              href="/track-order"
              className="p-2.5 text-center bg-[#141210] hover:bg-[#D4AF6A]/10 border border-[#2A241D] hover:border-[#D4AF6A]/40 rounded-lg text-[#F2EBDD] transition"
            >
              Track Order
            </Link>
            <Link
              href="/admin"
              className="p-2.5 text-center bg-[#141210] hover:bg-[#D4AF6A]/10 border border-[#2A241D] hover:border-[#D4AF6A]/40 rounded-lg text-[#F2EBDD] transition"
            >
              Admin Area
            </Link>
            <Link
              href="/admin/login"
              className="p-2.5 text-center bg-[#141210] hover:bg-[#D4AF6A]/10 border border-[#2A241D] hover:border-[#D4AF6A]/40 rounded-lg text-[#F2EBDD] transition"
            >
              Admin Login
            </Link>
          </div>
        </div>

        {/* Production Compatibility Notice */}
        <div className="p-4 bg-[#141210]/60 border border-[#2A241D] rounded-xl text-xs text-[#9B8E7A] leading-relaxed">
          <strong className="text-[#D4AF6A] block mb-1">Production Isolation Notice:</strong>
          The live storefront, admin hub, and Razorpay payment checkout continue to run on port 3300.
          Full UI &amp; customizer migration commences in Phase 5&ndash;8.
        </div>
      </div>
    </main>
  );
}
