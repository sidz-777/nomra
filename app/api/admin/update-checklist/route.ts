import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAdminActivity } from '@/lib/admin/audit';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // 1. Strict Server-Side Authentication & Authorization Guard
  const auth = await requireAdmin(request, ['owner', 'admin', 'staff']);
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const body = await request.json();
    const { order_id, checklist = {} } = body;

    if (!order_id) {
      return NextResponse.json({ success: false, error: 'order_id is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    let targetId = order_id;
    if (!order_id.includes('-') || order_id.length !== 36) {
      const { data } = await supabase
        .from('orders')
        .select('id')
        .eq('order_number', order_id)
        .single();
      if (data?.id) targetId = data.id;
    }

    // Update in Supabase orders
    const { data: updatedOrder, error: updateErr } = await supabase
      .from('orders')
      .update({
        production_checklist: checklist,
        updated_at: new Date().toISOString(),
      })
      .eq('id', targetId)
      .select('id')
      .single();

    if (updateErr || !updatedOrder) {
      return NextResponse.json(
        { success: false, error: 'Order not found in database' },
        { status: 404 }
      );
    }

    // Audit log
    await logAdminActivity('checklist_updated', 'orders', targetId, { checklist }, auth.user?.email || 'admin');

    return NextResponse.json({ success: true, checklist });
  } catch (err: any) {
    console.error('API /api/admin/update-checklist error:', err?.message);
    return NextResponse.json(
      { success: false, error: 'Database error updating checklist' },
      { status: 500 }
    );
  }
}
