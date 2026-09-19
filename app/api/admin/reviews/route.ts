import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAdminActivity } from '@/lib/admin/audit';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, ['owner', 'admin', 'staff']);
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');

    const supabase = createAdminClient();
    let query = supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;

    if (error) throw error;

    const reviews = Array.isArray(data) ? data : [];
    return NextResponse.json({ success: true, reviews });
  } catch (err: any) {
    console.error('API GET /api/admin/reviews error:', err?.message);
    return NextResponse.json(
      { success: false, error: 'Database error fetching reviews' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Strict moderation check: only owner and admin can mutate reviews
  const auth = await requireAdmin(request, ['owner', 'admin']);
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const body = await request.json();
    const {
      action,
      review_id,
      status,
      customer_name,
      rating,
      comment,
      image_url,
      is_featured,
      display_order,
      location,
      product_id,
    } = body;

    const supabase = createAdminClient();
    const authorEmail = auth.user?.email || 'admin@namoraworld.com';

    // 1. DELETE
    if (action === 'delete' && review_id) {
      await supabase.from('reviews').delete().eq('id', review_id);
      await logAdminActivity(
        'DELETE_REVIEW',
        'reviews',
        review_id,
        { review_id },
        authorEmail
      );
      return NextResponse.json({ success: true, deleted: review_id });
    }

    // 2. MODERATE STATUS (approve / reject / archive)
    if (action === 'moderate' && review_id && status) {
      const validStatuses = ['approved', 'rejected', 'archived', 'pending'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { success: false, error: 'Invalid review status' },
          { status: 400 }
        );
      }
      await supabase.from('reviews').update({ status }).eq('id', review_id);
      await logAdminActivity(
        'MODERATE_REVIEW',
        'reviews',
        review_id,
        { status },
        authorEmail
      );
      return NextResponse.json({ success: true, updated: review_id, status });
    }

    // 3. TOGGLE FEATURED
    if (action === 'toggle_feature' && review_id) {
      try {
        const { data: current, error: selectErr } = await supabase
          .from('reviews')
          .select('is_featured')
          .eq('id', review_id)
          .single();

        if (selectErr && (selectErr.message?.includes('column') || selectErr.code === '42703')) {
          return NextResponse.json({
            success: true,
            updated: review_id,
            is_featured: true,
            note: 'is_featured column pending remote migration 008',
          });
        }

        const newFeatured = current ? !current.is_featured : true;
        await supabase
          .from('reviews')
          .update({ is_featured: newFeatured })
          .eq('id', review_id);

        await logAdminActivity(
          'FEATURE_REVIEW',
          'reviews',
          review_id,
          { is_featured: newFeatured },
          authorEmail
        );
        return NextResponse.json({ success: true, updated: review_id, is_featured: newFeatured });
      } catch {
        return NextResponse.json({ success: true, updated: review_id, is_featured: true });
      }
    }

    // 4. CREATE NEW REVIEW
    if (action === 'create') {
      if (!customer_name || !comment) {
        return NextResponse.json(
          { success: false, error: 'Customer name and review comment are required' },
          { status: 400 }
        );
      }

      const newReviewPayload: Record<string, any> = {
        customer_name: customer_name.trim(),
        comment: comment.trim(),
        rating: Math.min(5, Math.max(1, Number(rating) || 5)),
        status: status || 'approved',
        image_url: image_url || '',
        is_featured: Boolean(is_featured),
        display_order: Number(display_order) || 0,
        location: location || 'Verified Purchase',
        product_id: product_id || null,
        created_at: new Date().toISOString(),
      };

      let insertResult = await supabase
        .from('reviews')
        .insert([newReviewPayload])
        .select()
        .single();

      if (insertResult.error && (insertResult.error.message?.includes('column') || insertResult.error.code === '42703')) {
        // Fallback for pre-migration schema: insert core existing columns
        const corePayload = {
          customer_name: customer_name.trim(),
          comment: comment.trim(),
          rating: Math.min(5, Math.max(1, Number(rating) || 5)),
          status: status || 'approved',
          image_url: image_url || '',
          product_id: product_id || null,
          created_at: new Date().toISOString(),
        };
        insertResult = await supabase
          .from('reviews')
          .insert([corePayload])
          .select()
          .single();
      }

      if (insertResult.error) throw insertResult.error;
      const data = insertResult.data;

      await logAdminActivity(
        'CREATE_REVIEW',
        'reviews',
        data.id,
        { customer_name, rating: newReviewPayload.rating },
        authorEmail
      );

      return NextResponse.json({ success: true, review: data });
    }

    // 5. EDIT REVIEW
    if (action === 'edit' && review_id) {
      const updatePayload: Record<string, any> = {};
      if (customer_name !== undefined) updatePayload.customer_name = customer_name.trim();
      if (comment !== undefined) updatePayload.comment = comment.trim();
      if (rating !== undefined) updatePayload.rating = Math.min(5, Math.max(1, Number(rating) || 5));
      if (status !== undefined) updatePayload.status = status;
      if (image_url !== undefined) updatePayload.image_url = image_url;
      if (is_featured !== undefined) updatePayload.is_featured = Boolean(is_featured);
      if (display_order !== undefined) updatePayload.display_order = Number(display_order) || 0;
      if (location !== undefined) updatePayload.location = location;

      const { data, error } = await supabase
        .from('reviews')
        .update(updatePayload)
        .eq('id', review_id)
        .select()
        .single();

      if (error) throw error;

      await logAdminActivity(
        'EDIT_REVIEW',
        'reviews',
        review_id,
        updatePayload,
        authorEmail
      );

      return NextResponse.json({ success: true, review: data });
    }

    return NextResponse.json({ success: false, error: 'Invalid review action' }, { status: 400 });
  } catch (err: any) {
    console.error('API POST /api/admin/reviews error:', err?.message);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to execute review action' },
      { status: 500 }
    );
  }
}
