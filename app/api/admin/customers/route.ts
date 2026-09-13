import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('total_spent', { ascending: false })
      .limit(100);

    if (error) {
      throw error;
    }

    let customers = Array.isArray(data) ? data : [];

    // Fallback proxy to port 3300 if database empty
    if (!customers.length) {
      try {
        const proxyRes = await fetch('http://localhost:3300/api/customers');
        if (proxyRes.ok) {
          const pData = await proxyRes.json();
          if (pData.success && Array.isArray(pData.customers)) {
            customers = pData.customers;
          }
        }
      } catch {}
    }

    return NextResponse.json({ success: true, customers });
  } catch (err: any) {
    console.error('API /api/admin/customers error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}
