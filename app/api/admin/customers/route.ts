import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // 1. Strict Server-Side Authentication & Authorization Guard (Only owner and admin)
  const auth = await requireAdmin(request, ['owner', 'admin']);
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

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

    const customers = Array.isArray(data) ? data : [];
    return NextResponse.json({ success: true, customers });
  } catch (err: any) {
    console.error('API /api/admin/customers error:', err?.message);
    return NextResponse.json(
      { success: false, error: 'Database error fetching customer directory.' },
      { status: 500 }
    );
  }
}
