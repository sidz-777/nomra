'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface AdminAuthContextType {
  email: string;
  isDemo: boolean;
  logout: () => Promise<void>;
  loading: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType>({
  email: '',
  isDemo: false,
  logout: async () => {},
  loading: true,
});

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string>('');
  const [isDemo, setIsDemo] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      try {
        // 1. Check local demo bypass
        const demoStorage = typeof window !== 'undefined' ? localStorage.getItem('namora_admin_demo') : null;
        if (demoStorage === 'true') {
          if (mounted) {
            setEmail('demo@namoraworld.com (Dev Demo)');
            setIsDemo(true);
            setLoading(false);
          }
          return;
        }

        // 2. Check Supabase auth session
        const supabase = createClient();
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error || !session) {
          if (mounted) {
            router.replace('/admin/login');
          }
          return;
        }

        if (mounted) {
          setEmail(session.user?.email || 'admin@namoraworld.com');
          setIsDemo(false);
          setLoading(false);
        }
      } catch (err) {
        console.warn('Admin auth check error:', err);
        if (mounted) {
          const demoStorage = typeof window !== 'undefined' ? localStorage.getItem('namora_admin_demo') : null;
          if (demoStorage === 'true') {
            setEmail('demo@namoraworld.com (Dev Demo)');
            setIsDemo(true);
            setLoading(false);
          } else {
            router.replace('/admin/login');
          }
        }
      }
    }

    checkAuth();

    return () => {
      mounted = false;
    };
  }, [router]);

  const logout = async () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('namora_admin_demo');
      }
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Sign out error:', e);
    } finally {
      router.push('/admin/login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0E0D0C] text-[#F5EFE6] flex flex-col items-center justify-center p-6">
        <div className="w-8 h-8 border-2 border-[#D4AF6A] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs font-mono tracking-widest text-[#A39684] uppercase">Authenticating Operations Portal...</p>
      </div>
    );
  }

  return (
    <AdminAuthContext.Provider value={{ email, isDemo, logout, loading }}>
      {children}
    </AdminAuthContext.Provider>
  );
}
