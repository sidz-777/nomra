import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });

    let reviews = (!error && Array.isArray(data)) ? data : [];

    if (!reviews.length) {
      try {
        const proxyRes = await fetch('http://localhost:3300/api/reviews');
        if (proxyRes.ok) {
          const pData = await proxyRes.json();
          if (pData.success && Array.isArray(pData.reviews)) {
            reviews = pData.reviews;
          }
        }
      } catch {}
    }

    return NextResponse.json({ success: true, reviews });
  } catch (err: any) {
    console.error('API GET /api/admin/reviews error:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Failed to fetch reviews' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, review_id, status } = body;

    const supabase = createAdminClient();

    if (action === 'delete' && review_id) {
      await supabase.from('reviews').delete().eq('id', review_id);

      // Proxy to legacy server if running
      try {
        await fetch('http://localhost:3300/api/admin/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } catch {}

      return NextResponse.json({ success: true, deleted: review_id });
    } else if (action === 'moderate' && review_id && status) {
      await supabase.from('reviews').update({ status }).eq('id', review_id);

      // Proxy to legacy server if running
      try {
        await fetch('http://localhost:3300/api/admin/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } catch {}

      return NextResponse.json({ success: true, review_id, status });
    }

    return NextResponse.json({ success: false, error: 'Invalid review action or parameters' }, { status: 400 });
  } catch (err: any) {
    console.error('API POST /api/admin/reviews error:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Failed to moderate review' }, { status: 500 });
  }
}
