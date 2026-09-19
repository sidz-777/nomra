'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export interface AdminAuthContextType {
  email: string;
  role: 'owner' | 'admin' | 'staff';
  isDemo: boolean;
  logout: () => Promise<void>;
  loading: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType>({
  email: '',
  role: 'admin',
  isDemo: false,
  logout: async () => {},
  loading: true,
});

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}

export default function AdminGuard({
  children,
  requiredRoles,
}: {
  children: React.ReactNode;
  requiredRoles?: string[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState<string>('');
  const [role, setRole] = useState<'owner' | 'admin' | 'staff'>('admin');
  const [isDemo, setIsDemo] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      try {
        // Enforce genuine Supabase server/client session verification
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
          router.replace('/admin/login');
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
    <AdminAuthContext.Provider value={{ email, role, isDemo, logout, loading }}>
      {children}
    </AdminAuthContext.Provider>
  );
}
