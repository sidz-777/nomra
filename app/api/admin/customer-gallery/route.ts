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
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('customer_gallery')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
        return NextResponse.json({
          success: true,
          source: 'fallback',
          items: [
            {
              id: 'gal-1',
              image_url: '/frame1.jpg',
              title: 'Fatima — Red Persian Frame',
              caption: 'Customized Wall Frame Sample 1',
              customer_name: 'Fatima',
              is_approved: true,
              is_featured: true,
              sort_order: 1,
            },
            {
              id: 'gal-2',
              image_url: '/frame2.jpeg',
              title: 'Omar — Blue Oriental Frame',
              caption: 'Customized Wall Frame Sample 2',
              customer_name: 'Omar',
              is_approved: true,
              is_featured: true,
              sort_order: 2,
            },
            {
              id: 'gal-3',
              image_url: '/frame3.jpeg',
              title: 'Aisha — Purple Floral Frame',
              caption: 'Customized Wall Frame Sample 3',
              customer_name: 'Aisha',
              is_approved: true,
              is_featured: true,
              sort_order: 3,
            },
            {
              id: 'gal-4',
              image_url: '/frame4.jpg',
              title: 'Zayd — Book Stack Rug Frame',
              caption: 'Customized Wall Frame Sample 4',
              customer_name: 'Zayd',
              is_approved: true,
              is_featured: true,
              sort_order: 4,
            },
          ],
        });
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      source: 'database',
      items: Array.isArray(data) ? data : [],
    });
  } catch (err: any) {
    console.error('API GET /api/admin/customer-gallery error:', err?.message);
    return NextResponse.json(
      { success: false, error: 'Database error fetching gallery items' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request, ['owner', 'admin']);
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const body = await request.json();
    const {
      action,
      item_id,
      image_url,
      title,
      caption,
      customer_name,
      is_approved,
      is_featured,
      sort_order,
    } = body;

    const supabase = createAdminClient();
    const authorEmail = auth.user?.email || 'admin@namoraworld.com';

    // 1. DELETE
    if (action === 'delete' && item_id) {
      await supabase.from('customer_gallery').delete().eq('id', item_id);
      await logAdminActivity(
        'DELETE_GALLERY_ITEM',
        'customer_gallery',
        item_id,
        { item_id },
        authorEmail
      );
      return NextResponse.json({ success: true, deleted: item_id });
    }

    // 2. MODERATE APPROVAL
    if (action === 'moderate' && item_id) {
      const approvedVal = is_approved !== undefined ? Boolean(is_approved) : true;
      const { data, error } = await supabase
        .from('customer_gallery')
        .update({ is_approved: approvedVal, updated_at: new Date().toISOString() })
        .eq('id', item_id)
        .select()
        .single();

      if (error) throw error;

      await logAdminActivity(
        'MODERATE_GALLERY_ITEM',
        'customer_gallery',
        item_id,
        { is_approved: approvedVal },
        authorEmail
      );
      return NextResponse.json({ success: true, item: data });
    }

    // 3. TOGGLE FEATURED
    if (action === 'toggle_feature' && item_id) {
      const { data: current } = await supabase
        .from('customer_gallery')
        .select('is_featured')
        .eq('id', item_id)
        .single();

      const newFeatured = current ? !current.is_featured : true;
      const { data, error } = await supabase
        .from('customer_gallery')
        .update({ is_featured: newFeatured, updated_at: new Date().toISOString() })
        .eq('id', item_id)
        .select()
        .single();

      if (error) throw error;

      await logAdminActivity(
        'FEATURE_GALLERY_ITEM',
        'customer_gallery',
        item_id,
        { is_featured: newFeatured },
        authorEmail
      );
      return NextResponse.json({ success: true, item: data });
    }

    // 4. CREATE
    if (action === 'create') {
      if (!image_url || !title) {
        return NextResponse.json(
          { success: false, error: 'Image URL and Title are required' },
          { status: 400 }
        );
      }

      const newPayload = {
        image_url: image_url.trim(),
        title: title.trim(),
        caption: caption ? caption.trim() : '',
        customer_name: customer_name ? customer_name.trim() : '',
        is_approved: is_approved !== undefined ? Boolean(is_approved) : true,
        is_featured: Boolean(is_featured),
        sort_order: Number(sort_order) || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('customer_gallery')
        .insert([newPayload])
        .select()
        .single();

      if (error) throw error;

      await logAdminActivity(
        'CREATE_GALLERY_ITEM',
        'customer_gallery',
        data.id,
        { title: newPayload.title },
        authorEmail
      );

      return NextResponse.json({ success: true, item: data });
    }

    // 5. EDIT
    if (action === 'edit' && item_id) {
      const updatePayload: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (image_url !== undefined) updatePayload.image_url = image_url.trim();
      if (title !== undefined) updatePayload.title = title.trim();
      if (caption !== undefined) updatePayload.caption = caption.trim();
      if (customer_name !== undefined) updatePayload.customer_name = customer_name.trim();
      if (sort_order !== undefined) updatePayload.sort_order = Number(sort_order) || 0;
      if (is_approved !== undefined) updatePayload.is_approved = Boolean(is_approved);
      if (is_featured !== undefined) updatePayload.is_featured = Boolean(is_featured);

      const { data, error } = await supabase
        .from('customer_gallery')
        .update(updatePayload)
        .eq('id', item_id)
        .select()
        .single();

      if (error) throw error;

      await logAdminActivity(
        'EDIT_GALLERY_ITEM',
        'customer_gallery',
        item_id,
        updatePayload,
        authorEmail
      );

      return NextResponse.json({ success: true, item: data });
    }

    return NextResponse.json({ success: false, error: 'Invalid gallery action' }, { status: 400 });
  } catch (err: any) {
    console.error('API POST /api/admin/customer-gallery error:', err?.message);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to execute gallery action' },
      { status: 500 }
    );
  }
}
