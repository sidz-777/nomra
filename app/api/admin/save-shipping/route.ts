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
    const {
      order_id,
      courier_name = '',
      tracking_number = '',
      tracking_url = '',
      mark_shipped = false,
    } = body;

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

    const nowIso = new Date().toISOString();
    const patchData: Record<string, any> = {
      courier_name: courier_name.trim(),
      tracking_number: tracking_number.trim(),
      tracking_url: tracking_url.trim(),
      updated_at: nowIso,
    };

    if (mark_shipped) {
      patchData.status = 'dispatched';
      patchData.dispatched_at = nowIso;
    }

    const { data: updatedOrder, error: updateErr } = await supabase
      .from('orders')
      .update(patchData)
      .eq('id', targetId)
      .select('id, status')
      .single();

    if (updateErr || !updatedOrder) {
      return NextResponse.json(
        { success: false, error: 'Order not found in database or update failed' },
        { status: 404 }
      );
    }

    // Audit log
    await logAdminActivity(
      'shipping_info_updated',
      'orders',
      targetId,
      { courier_name, tracking_number, tracking_url, mark_shipped },
      auth.user?.email || 'admin'
    );

    return NextResponse.json({
      success: true,
      order_id: targetId,
      courier_name,
      tracking_number,
      tracking_url,
      status: mark_shipped ? 'shipped' : updatedOrder.status,
    });
  } catch (err: any) {
    console.error('API /api/admin/save-shipping error:', err?.message);
    return NextResponse.json(
      { success: false, error: 'Database error saving shipping information' },
      { status: 500 }
    );
  }
}
