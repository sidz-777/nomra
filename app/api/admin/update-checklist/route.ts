import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAdminActivity } from '@/lib/admin/audit';
import { adminOrdersStore } from '@/lib/admin/order-memory-store';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { order_id, checklist = {}, admin_user = 'admin' } = body;

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
    await supabase
      .from('orders')
      .update({
        production_checklist: checklist,
        updated_at: new Date().toISOString(),
      })
      .eq('id', targetId);

    adminOrdersStore.updateChecklist(targetId, checklist);

    // Audit log
    await logAdminActivity('checklist_updated', 'orders', targetId, { checklist }, admin_user);

    // Proxy to legacy server.js if running
    try {
      await fetch('http://localhost:3300/api/update-checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: targetId, checklist, admin_user }),
      });
    } catch {}

    return NextResponse.json({ success: true, checklist });
  } catch (err: any) {
    console.error('API /api/admin/update-checklist error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to update checklist' },
      { status: 500 }
    );
  }
}
