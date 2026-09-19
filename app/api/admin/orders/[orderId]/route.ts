import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { VALID_ORDER_TRANSITIONS } from '@/lib/admin/types';
import { NotificationService } from '@/lib/notifications/service';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  // 1. Strict Server-Side Authentication & Authorization Guard
  const auth = await requireAdmin(request, ['owner', 'admin', 'staff']);
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  const { orderId } = params;
  if (!orderId) {
    return NextResponse.json({ success: false, error: 'Order identifier is required.' }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();

    // 2. Query orders table by UUID or order_number
    let query = supabase.from('orders').select('*');
    if (orderId.includes('-') && orderId.length === 36) {
      query = query.eq('id', orderId);
    } else {
      query = query.eq('order_number', orderId);
    }

    const { data: orderData, error: orderError } = await query.maybeSingle();

    if (orderError) {
      throw orderError;
    }

    if (!orderData) {
      return NextResponse.json({ success: false, error: 'Order not found.' }, { status: 404 });
    }

    const order = orderData;

    // 3. Query order items
    const { data: itemsData } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', order.id);

    const items = Array.isArray(itemsData) ? itemsData : [];

    // 4. Query payments
    let payments: any[] = [];
    try {
      const { data: pData } = await supabase
        .from('payments')
        .select('*')
        .or(`order_id.eq.${order.id},order_number.eq.${order.order_number}`);
      if (Array.isArray(pData)) payments = pData;
    } catch {
      // Ignore if payments table is empty or missing columns
    }

    // 5. Query customer profile by phone
    let customer: any = null;
    if (order.phone) {
      try {
        const { data: cData } = await supabase
          .from('customers')
          .select('*')
          .eq('phone', order.phone)
          .maybeSingle();
        if (cData) customer = cData;
      } catch {
        // Ignore customer fetch error
      }
    }

    // 6. Query internal notes
    let notes: any[] = [];
    try {
      const { data: notesData, error: nErr } = await supabase
        .from('order_notes')
        .select('*')
        .eq('order_id', order.id)
        .order('created_at', { ascending: false });
      if (!nErr && Array.isArray(notesData)) {
        notes = notesData;
      }
    } catch {
      // order_notes fallback handled below
    }

    // If no order_notes rows found, check admin_audit_logs for ADD_ORDER_NOTE or parse order.admin_notes
    if (notes.length === 0) {
      try {
        const { data: auditNotes } = await supabase
          .from('admin_audit_logs')
          .select('*')
          .eq('entity_type', 'orders')
          .eq('entity_id', order.id)
          .eq('action', 'ADD_ORDER_NOTE')
          .order('created_at', { ascending: false });

        if (Array.isArray(auditNotes) && auditNotes.length > 0) {
          notes = auditNotes.map((an) => ({
            id: an.id,
            order_id: order.id,
            author_email: an.admin_email,
            note_text: an.details?.note_text || an.details?.notes || '',
            is_internal: true,
            created_at: an.created_at,
          }));
        }
      } catch {}

      if (notes.length === 0 && order.admin_notes) {
        notes.push({
          id: 'legacy-note-1',
          order_id: order.id,
          author_email: 'admin@namoraworld.com',
          note_text: order.admin_notes,
          is_internal: true,
          created_at: order.updated_at || order.created_at,
        });
      }
    }

    // 7. Query notification history
    let notifications: any[] = [];
    try {
      const { data: notifData, error: nErr } = await supabase
        .from('notification_logs')
        .select('*')
        .eq('order_id', order.id)
        .order('created_at', { ascending: false });
      if (!nErr && Array.isArray(notifData)) {
        notifications = notifData;
      }
    } catch {
      // Table fallback handled below
    }

    if (notifications.length === 0) {
      notifications = NotificationService.getFallbackLogs().filter(
        (l) => l.order_id === order.id || l.order_number === order.order_number
      );
    }

    // 8. Calculate valid next transitions
    const currentStatus = order.status || 'pending_payment';
    const allowedTransitions = VALID_ORDER_TRANSITIONS[currentStatus] || [];

    return NextResponse.json({
      success: true,
      order: {
        ...order,
        items,
        payments,
        customer,
        notes,
        notifications,
        allowed_transitions: allowedTransitions,
      },
    });
  } catch (err: any) {
    console.error('API /api/admin/orders/[orderId] error:', err?.message);
    return NextResponse.json(
      { success: false, error: 'Database error retrieving order details.' },
      { status: 500 }
    );
  }
}
