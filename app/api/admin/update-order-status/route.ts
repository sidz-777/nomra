import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { isValidOrderTransition, VALID_ORDER_TRANSITIONS } from '@/lib/admin/types';
import { logAdminActivity } from '@/lib/admin/audit';
import { triggerOrderStatusTransition } from '@/lib/notifications/triggers';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // 1. Strict Server-Side Authentication & Authorization Guard
  const auth = await requireAdmin(request, ['owner', 'admin', 'staff']);
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const body = await request.json();
    const order_id = (body.order_id || body.orderId || '').toString().trim();
    const new_status = (body.new_status || body.status || '').toString().trim();
    const notes = body.notes || '';
    const emergency_override = Boolean(body.emergency_override);

    // Strict Emergency Override: ONLY owner role can invoke emergency override explicitly.
    const isOwnerOverride = Boolean(emergency_override) && auth.role === 'owner';
    const adminUser = auth.user?.email || 'admin';

    if (!order_id || !new_status) {
      return NextResponse.json(
        { success: false, error: 'Both order_id and new_status are required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Fetch current order state
    let order: any = null;
    let q = supabase.from('orders').select('*');
    if (order_id.includes('-') && order_id.length === 36) {
      q = q.eq('id', order_id);
    } else {
      q = q.eq('order_number', order_id);
    }
    const { data, error } = await q.maybeSingle();
    if (!error && data) {
      order = data;
    }

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found in database.' }, { status: 404 });
    }

    const prevStatus = order.status;

    // 2. Validate transition strictly against state machine
    if (!isValidOrderTransition(prevStatus, new_status, isOwnerOverride)) {
      const allowedNext = VALID_ORDER_TRANSITIONS[prevStatus] || [];
      return NextResponse.json(
        {
          success: false,
          error: `Invalid transition from "${prevStatus}" to "${new_status}". Allowed next: ${allowedNext.join(', ') || 'none'}`,
        },
        { status: 400 }
      );
    }

    // 3. Set timestamp fields
    const nowIso = new Date().toISOString();
    const patchData: Record<string, any> = {
      status: new_status,
      updated_at: nowIso,
    };

    if (new_status === 'shipped' || new_status === 'dispatched') {
      patchData.dispatched_at = nowIso;
    }
    if (new_status === 'delivered') {
      patchData.delivered_at = nowIso;
    }
    if (new_status === 'cancelled') {
      patchData.cancelled_at = nowIso;
    }

    // Update orders table in database
    const { error: updateErr } = await supabase.from('orders').update(patchData).eq('id', order.id);
    if (updateErr) {
      throw updateErr;
    }

    // 4. Record Administrative Audit Log
    await logAdminActivity(
      isOwnerOverride ? 'order_status_emergency_override' : 'order_status_updated',
      'orders',
      order.id,
      {
        order_number: order.order_number,
        previous_status: prevStatus,
        new_status,
        notes,
        is_override: isOwnerOverride,
      },
      adminUser
    );

    // 5. Trigger durable notification transition (non-blocking)
    triggerOrderStatusTransition(
      {
        ...order,
        ...patchData,
        tracking_url: order.tracking_token ? `/track?token=${order.tracking_token}` : `/track?orderNumber=${order.order_number}`,
      },
      new_status
    ).catch((notifErr) => {
      console.warn('[Update Status] Non-blocking notification note:', notifErr?.message);
    });

    return NextResponse.json({
      success: true,
      order_id: order.id,
      order_number: order.order_number,
      previous_status: prevStatus,
      new_status,
      updated_at: nowIso,
      is_override: isOwnerOverride,
    });
  } catch (err: any) {
    console.error('API /api/admin/update-order-status error:', err?.message);
    return NextResponse.json(
      { success: false, error: 'Database error updating order status' },
      { status: 500 }
    );
  }
}
