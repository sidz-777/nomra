import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isValidOrderTransition, VALID_ORDER_TRANSITIONS } from '@/lib/admin/types';
import { logAdminActivity } from '@/lib/admin/audit';
import { adminOrdersStore } from '@/lib/admin/order-memory-store';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { order_id, new_status, admin_user = 'admin', admin_override = false, notes = '' } = body;

    if (!order_id || !new_status) {
      return NextResponse.json(
        { success: false, error: 'Both order_id and new_status are required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // 1. Fetch current order state
    let order: any = null;
    try {
      let q = supabase.from('orders').select('*');
      if (order_id.includes('-') && order_id.length === 36) {
        q = q.eq('id', order_id);
      } else {
        q = q.eq('order_number', order_id);
      }
      const { data, error } = await q.single();
      if (!error && data) {
        order = data;
      }
    } catch (err: any) {
      console.warn('Order query note in update-order-status:', err?.message);
    }

    if (!order) {
      order = adminOrdersStore.getOrder(order_id);
    }

    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const prevStatus = order.status;

    // 2. Validate transition
    if (!isValidOrderTransition(prevStatus, new_status, admin_override)) {
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

    // Update orders table
    await supabase.from('orders').update(patchData).eq('id', order.id);
    adminOrdersStore.updateOrderStatus(order.id, new_status);

    // 4. Inventory reversal on cancellation or return
    if (
      (new_status === 'cancelled' || new_status === 'returned') &&
      prevStatus !== 'cancelled' &&
      prevStatus !== 'returned'
    ) {
      try {
        const { data: items } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', order.id);

        if (Array.isArray(items)) {
          for (const itm of items) {
            if (itm.is_ready_made && itm.product_id) {
              const { data: prod } = await supabase
                .from('products')
                .select('stock_quantity')
                .eq('id', itm.product_id)
                .single();

              const currentStock = prod?.stock_quantity ?? 0;
              const restoredStock = currentStock + 1;

              await supabase
                .from('products')
                .update({ stock_quantity: restoredStock, in_stock: true })
                .eq('id', itm.product_id);

              await supabase.from('inventory_movements').insert([
                {
                  product_id: itm.product_id,
                  order_id: order.id,
                  order_number: order.order_number,
                  change_quantity: 1,
                  movement_type: new_status === 'cancelled' ? 'cancellation' : 'restock',
                  notes: `Restored stock from order ${order.order_number} (${new_status})`,
                  created_at: nowIso,
                },
              ]);
            }
          }
        }
      } catch (invErr: any) {
        console.warn('Inventory reversal note:', invErr?.message);
      }
    }

    // 5. Activity log
    await logAdminActivity(
      'order_status_updated',
      'orders',
      order.id,
      { order_number: order.order_number, from: prevStatus, to: new_status, notes },
      admin_user
    );

    // 6. Proxy to legacy server.js if running to keep memory in sync
    try {
      await fetch('http://localhost:3300/api/update-order-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: order.id,
          new_status,
          admin_user,
          admin_override,
          notes,
        }),
      });
    } catch {
      // Optional proxy
    }

    return NextResponse.json({
      success: true,
      order_number: order.order_number,
      previous_status: prevStatus,
      status: new_status,
    });
  } catch (err: any) {
    console.error('API /api/admin/update-order-status error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to update order status' },
      { status: 500 }
    );
  }
}
