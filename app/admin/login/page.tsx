'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMsg(error.message || 'Invalid email or password');
        setLoading(false);
      } else if (data?.session) {
        router.push('/admin');
      } else {
        setErrorMsg('Authentication failed. Please check credentials.');
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setErrorMsg(err?.message || 'Network error connecting to authentication provider.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0E0D0C] bg-[radial-gradient(ellipse_at_center,_#1E1B18_0%,_#0E0D0C_100%)] text-[#F5EFE6] flex items-center justify-center p-6 select-none">
      <div className="w-full max-w-md bg-[#1A1816] border border-[#2D2722] rounded-2xl p-8 shadow-2xl relative text-center">
        {/* Brand Header */}
        <div className="font-serif text-3xl font-bold tracking-widest text-[#D4AF6A] mb-1">
          NAMORA
        </div>
        <div className="text-xs font-mono uppercase tracking-widest text-[#A39684] mb-8">
          Protected Admin Portal
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-6 p-3.5 rounded-lg bg-red-950/40 border border-red-500/30 text-red-300 text-xs font-mono text-left">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-left">
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-[#A39684] mb-1.5">
              Admin Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@namoraworld.com"
              className="w-full px-4 py-2.5 bg-[#0E0D0C] border border-[#2D2722] focus:border-[#D4AF6A] rounded-lg text-sm text-[#F5EFE6] outline-none transition-all placeholder:text-[#A39684]/40 font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-[#A39684] mb-1.5">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-4 py-2.5 bg-[#0E0D0C] border border-[#2D2722] focus:border-[#D4AF6A] rounded-lg text-sm text-[#F5EFE6] outline-none transition-all placeholder:text-[#A39684]/40 font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-[#D4AF6A] hover:bg-[#E5C384] disabled:opacity-50 text-[#141210] font-semibold text-sm rounded-lg transition-all shadow-md flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-[#141210] border-t-transparent rounded-full animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Sign In to Portal &rarr;</span>
            )}
          </button>
        </form>

        {/* Return to Customer Storefront */}
        <div className="mt-6 pt-6 border-t border-[#2D2722]">
          <Link
            href="/"
            className="text-xs font-mono text-[#A39684] hover:text-[#D4AF6A] transition-colors inline-flex items-center gap-1.5"
          >
            &larr; Return to Customer Storefront
          </Link>
        </div>
      </div>
    </div>
  );
}
