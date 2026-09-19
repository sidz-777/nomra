import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAdminActivity } from '@/lib/admin/audit';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  const auth = await requireAdmin(request, ['owner', 'admin', 'staff']);
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  const { orderId } = params;
  if (!orderId) {
    return NextResponse.json({ success: false, error: 'Order ID is required.' }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();

    let targetId = orderId;
    if (!orderId.includes('-') || orderId.length !== 36) {
      const { data } = await supabase.from('orders').select('id').eq('order_number', orderId).maybeSingle();
      if (data?.id) targetId = data.id;
    }

    // Try fetching from order_notes table
    let notes: any[] = [];
    const { data: notesData, error: notesError } = await supabase
      .from('order_notes')
      .select('*')
      .eq('order_id', targetId)
      .order('created_at', { ascending: false });

    if (!notesError && Array.isArray(notesData) && notesData.length > 0) {
      notes = notesData;
    } else {
      // Fallback to audit logs
      const { data: auditNotes } = await supabase
        .from('admin_audit_logs')
        .select('*')
        .eq('entity_type', 'orders')
        .eq('entity_id', targetId)
        .eq('action', 'ADD_ORDER_NOTE')
        .order('created_at', { ascending: false });

      if (Array.isArray(auditNotes) && auditNotes.length > 0) {
        notes = auditNotes.map((an) => ({
          id: an.id,
          order_id: targetId,
          author_email: an.admin_email,
          note_text: an.details?.note_text || an.details?.notes || '',
          is_internal: true,
          created_at: an.created_at,
        }));
      }
    }

    return NextResponse.json({ success: true, notes });
  } catch (err: any) {
    console.error('API /api/admin/orders/[orderId]/notes GET error:', err?.message);
    return NextResponse.json(
      { success: false, error: 'Database error fetching order notes.' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  const auth = await requireAdmin(request, ['owner', 'admin', 'staff']);
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  const { orderId } = params;
  if (!orderId) {
    return NextResponse.json({ success: false, error: 'Order ID is required.' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const noteText = (body.note_text || body.note || '').toString().trim();
    const isInternal = body.is_internal !== undefined ? Boolean(body.is_internal) : true;

    if (!noteText) {
      return NextResponse.json({ success: false, error: 'Note text cannot be empty.' }, { status: 400 });
    }

    const supabase = createAdminClient();

    let targetId = orderId;
    let orderNum = '';
    let existingNotes = '';

    const { data: orderData } = await supabase
      .from('orders')
      .select('id, order_number, admin_notes')
      .or(`id.eq.${orderId.includes('-') && orderId.length === 36 ? orderId : '00000000-0000-0000-0000-000000000000'},order_number.eq.${orderId}`)
      .maybeSingle();

    if (orderData) {
      targetId = orderData.id;
      orderNum = orderData.order_number;
      existingNotes = orderData.admin_notes || '';
    }

    const authorEmail = auth.user?.email || 'admin@namoraworld.com';
    const nowIso = new Date().toISOString();

    const newNoteObj = {
      id: crypto.randomUUID(),
      order_id: targetId,
      author_email: authorEmail,
      note_text: noteText,
      is_internal: isInternal,
      created_at: nowIso,
    };

    // 1. Attempt insert into order_notes
    try {
      const { error: insErr } = await supabase.from('order_notes').insert([newNoteObj]);
      if (insErr) {
        console.warn('order_notes insert note:', insErr.message);
      }
    } catch (err: any) {
      console.warn('order_notes table not available, falling back to audit & admin_notes');
    }

    // 2. Append to order.admin_notes
    const timestampedEntry = `[${new Date().toLocaleDateString('en-GB')} ${new Date().toLocaleTimeString('en-GB')}] (${authorEmail}): ${noteText}`;
    const updatedAdminNotes = existingNotes ? `${existingNotes}\n${timestampedEntry}` : timestampedEntry;

    await supabase
      .from('orders')
      .update({
        admin_notes: updatedAdminNotes,
        updated_at: nowIso,
      })
      .eq('id', targetId);

    // 3. Log to admin_audit_logs
    await logAdminActivity(
      'ADD_ORDER_NOTE',
      'orders',
      targetId,
      {
        order_number: orderNum,
        note_text: noteText,
        is_internal: isInternal,
      },
      authorEmail
    );

    return NextResponse.json({
      success: true,
      note: newNoteObj,
      message: 'Operational note recorded successfully.',
    });
  } catch (err: any) {
    console.error('API /api/admin/orders/[orderId]/notes POST error:', err?.message);
    return NextResponse.json(
      { success: false, error: 'Failed to record operational note.' },
      { status: 500 }
    );
  }
}
