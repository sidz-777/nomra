import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAdminActivity } from '@/lib/admin/audit';
import { adminOrdersStore } from '@/lib/admin/order-memory-store';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      order_id,
      courier_name = '',
      tracking_number = '',
      tracking_url = '',
      mark_shipped = false,
      admin_user = 'admin',
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

    // 1. Check duplicate AWB tracking numbers
    let duplicateWarning: string | null = null;
    if (tracking_number && tracking_number.trim()) {
      const tTrim = tracking_number.trim();
      const { data: dupOrders } = await supabase
        .from('orders')
        .select('order_number')
        .eq('tracking_number', tTrim)
        .neq('id', targetId);

      if (dupOrders && dupOrders.length > 0) {
        duplicateWarning = `Warning: AWB "${tracking_number}" is already attached to order ${dupOrders[0].order_number}.`;
      }
    }

    // 2. Prepare patch data
    const nowIso = new Date().toISOString();
    const patchData: Record<string, any> = {
      courier_name: courier_name.trim(),
      tracking_number: tracking_number.trim(),
      tracking_url: tracking_url.trim(),
      updated_at: nowIso,
    };

    if (mark_shipped) {
      patchData.status = 'shipped';
      patchData.dispatched_at = nowIso;
    }

    await supabase.from('orders').update(patchData).eq('id', targetId);
    adminOrdersStore.saveShipping(targetId, courier_name, tracking_number, tracking_url, mark_shipped);

    // 3. Activity log
    await logAdminActivity(
      'shipping_updated',
      'orders',
      targetId,
      { courier_name, tracking_number, tracking_url, mark_shipped, duplicateWarning },
      admin_user
    );

    // 4. Proxy to legacy server if running
    try {
      await fetch('http://localhost:3300/api/save-shipping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: targetId,
          courier_name,
          tracking_number,
          tracking_url,
          mark_shipped,
          admin_user,
        }),
      });
    } catch {}

    return NextResponse.json({
      success: true,
      order_id: targetId,
      courier_name,
      tracking_number,
      tracking_url,
      duplicate_warning: !!duplicateWarning,
      warning: duplicateWarning,
    });
  } catch (err: any) {
    console.error('API /api/admin/save-shipping error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to save shipping information' },
      { status: 500 }
    );
  }
}
