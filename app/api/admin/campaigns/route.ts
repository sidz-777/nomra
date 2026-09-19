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
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
        return NextResponse.json({
          success: true,
          source: 'fallback',
          campaigns: [],
        });
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      source: 'database',
      campaigns: Array.isArray(data) ? data : [],
    });
  } catch (err: any) {
    console.error('API GET /api/admin/campaigns error:', err?.message);
    return NextResponse.json(
      { success: false, error: 'Database error fetching campaigns' },
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
      id,
      name,
      badge_text,
      headline,
      description,
      is_active,
      start_date,
      end_date,
      product_ids,
    } = body;

    if (!name || !badge_text) {
      return NextResponse.json(
        { success: false, error: 'Campaign name and badge text are required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const authorEmail = auth.user?.email || 'admin@namoraworld.com';
    const nowIso = new Date().toISOString();

    const campaignPayload = {
      name: name.trim(),
      badge_text: badge_text.trim().toUpperCase(),
      headline: headline ? headline.trim() : '',
      description: description ? description.trim() : '',
      is_active: is_active !== false,
      start_date: start_date || null,
      end_date: end_date || null,
      product_ids: Array.isArray(product_ids) ? product_ids : [],
      updated_at: nowIso,
    };

    let result;
    if (id) {
      // Update
      const { data, error } = await supabase
        .from('campaigns')
        .update(campaignPayload)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      result = data;

      await logAdminActivity(
        'UPDATE_CAMPAIGN',
        'campaigns',
        id,
        { name: campaignPayload.name, badge_text: campaignPayload.badge_text },
        authorEmail
      );
    } else {
      // Create
      const { data, error } = await supabase
        .from('campaigns')
        .insert([{ ...campaignPayload, created_at: nowIso }])
        .select()
        .single();

      if (error) throw error;
      result = data;

      await logAdminActivity(
        'CREATE_CAMPAIGN',
        'campaigns',
        result.id,
        { name: campaignPayload.name, badge_text: campaignPayload.badge_text },
        authorEmail
      );
    }

    return NextResponse.json({
      success: true,
      campaign: result,
      message: `Campaign "${campaignPayload.name}" saved successfully.`,
    });
  } catch (err: any) {
    console.error('API POST /api/admin/campaigns error:', err?.message);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to save campaign' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdmin(request, ['owner', 'admin']);
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Campaign ID is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const authorEmail = auth.user?.email || 'admin@namoraworld.com';

    const { error } = await supabase.from('campaigns').delete().eq('id', id);
    if (error) throw error;

    await logAdminActivity(
      'DELETE_CAMPAIGN',
      'campaigns',
      id,
      { id },
      authorEmail
    );

    return NextResponse.json({
      success: true,
      deleted: id,
      message: 'Campaign deleted successfully.',
    });
  } catch (err: any) {
    console.error('API DELETE /api/admin/campaigns error:', err?.message);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to delete campaign' },
      { status: 500 }
    );
  }
}
