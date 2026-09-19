import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAdminActivity } from '@/lib/admin/audit';
import { triggerShippingNotification } from '@/lib/notifications/triggers';

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
      carrier = '',
      tracking_number = '',
      tracking_url = '',
      estimated_delivery_date = null,
      mark_shipped = false,
    } = body;

    if (!order_id) {
      return NextResponse.json({ success: false, error: 'order_id is required' }, { status: 400 });
    }

    const finalCarrier = (carrier || courier_name || '').trim();
    const cleanTrackingUrl = (tracking_url || '').trim();

    // Security check: only allow safe https:// URLs
    if (cleanTrackingUrl && !cleanTrackingUrl.startsWith('https://')) {
      return NextResponse.json(
        { success: false, error: 'Tracking URL must use secure https:// protocol' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    let targetId = order_id;
    let existingOrder: any = null;
    let orderQuery = supabase.from('orders').select('*');
    if (!order_id.includes('-') || order_id.length !== 36) {
      orderQuery = orderQuery.eq('order_number', order_id);
    } else {
      orderQuery = orderQuery.eq('id', order_id);
    }
    const { data: fetched } = await orderQuery.maybeSingle();
    if (fetched) {
      targetId = fetched.id;
      existingOrder = fetched;
    }

    const nowIso = new Date().toISOString();
    const patchData: Record<string, any> = {
      carrier: finalCarrier,
      courier_name: finalCarrier,
      tracking_number: tracking_number.trim(),
      tracking_url: cleanTrackingUrl,
      updated_at: nowIso,
    };

    if (estimated_delivery_date) {
      patchData.estimated_delivery_date = new Date(estimated_delivery_date).toISOString();
    }

    if (mark_shipped) {
      patchData.status = 'dispatched';
      patchData.dispatched_at = nowIso;
    }

    let { data: updatedOrder, error: updateErr } = await supabase
      .from('orders')
      .update(patchData)
      .eq('id', targetId)
      .select('*')
      .single();

    // Fallback if carrier or estimated_delivery_date columns pending remote migration
    if (updateErr && (updateErr.message?.includes('carrier') || updateErr.message?.includes('estimated_delivery_date'))) {
      delete patchData.carrier;
      delete patchData.estimated_delivery_date;
      const retry = await supabase
        .from('orders')
        .update(patchData)
        .eq('id', targetId)
        .select('*')
        .single();
      updatedOrder = retry.data;
      updateErr = retry.error;
    }

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

    // Trigger durable shipping notification if marked shipped or already dispatched (non-blocking)
    if (mark_shipped || updatedOrder.status === 'shipped' || updatedOrder.status === 'dispatched') {
      triggerShippingNotification(
        {
          ...(existingOrder || updatedOrder),
          carrier: finalCarrier,
          tracking_number,
          tracking_url: cleanTrackingUrl,
        },
        {
          carrier: finalCarrier,
          tracking_number,
          tracking_url: cleanTrackingUrl,
        }
      ).catch((notifErr) => {
        console.warn('[Save Shipping] Non-blocking notification note:', notifErr?.message);
      });
    }

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
