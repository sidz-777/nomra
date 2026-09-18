import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, ['owner', 'admin', 'staff']);
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const reviews = Array.isArray(data) ? data : [];
    return NextResponse.json({ success: true, reviews });
  } catch (err: any) {
    console.error('API GET /api/admin/reviews error:', err?.message);
    return NextResponse.json({ success: false, error: 'Database error fetching reviews' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Strict moderation check: only owner and admin can moderate/delete reviews
  const auth = await requireAdmin(request, ['owner', 'admin']);
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const body = await request.json();
    const { action, review_id, status } = body;

    const supabase = createAdminClient();

    if (action === 'delete' && review_id) {
      await supabase.from('reviews').delete().eq('id', review_id);
      return NextResponse.json({ success: true, deleted: review_id });
    } else if (action === 'moderate' && review_id && status) {
      await supabase.from('reviews').update({ status }).eq('id', review_id);
      return NextResponse.json({ success: true, updated: review_id, status });
    }

    return NextResponse.json({ success: false, error: 'Invalid review action' }, { status: 400 });
  } catch (err: any) {
    console.error('API POST /api/admin/reviews error:', err?.message);
    return NextResponse.json({ success: false, error: 'Failed to execute review action' }, { status: 500 });
  }
}
