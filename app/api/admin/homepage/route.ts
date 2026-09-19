import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAdminActivity } from '@/lib/admin/audit';
import { DEFAULT_HOMEPAGE_CONTENT } from '@/lib/homepage-data';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, ['owner', 'admin', 'staff']);
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('homepage_content')
      .select('key, content, is_active, updated_at, updated_by');

    if (error) {
      // Return fallback if table not yet migrated
      return NextResponse.json({
        success: true,
        source: 'fallback',
        sections: {
          announcement_bar: {
            content: DEFAULT_HOMEPAGE_CONTENT.announcement,
            is_active: true,
          },
          hero_section: {
            content: DEFAULT_HOMEPAGE_CONTENT.hero,
            is_active: true,
          },
        },
      });
    }

    const sections: Record<string, any> = {};
    if (Array.isArray(data)) {
      for (const row of data) {
        sections[row.key] = {
          content: row.content,
          is_active: row.is_active,
          updated_at: row.updated_at,
          updated_by: row.updated_by,
        };
      }
    }

    // Fill defaults if missing
    if (!sections.announcement_bar) {
      sections.announcement_bar = {
        content: DEFAULT_HOMEPAGE_CONTENT.announcement,
        is_active: true,
      };
    }
    if (!sections.hero_section) {
      sections.hero_section = {
        content: DEFAULT_HOMEPAGE_CONTENT.hero,
        is_active: true,
      };
    }

    return NextResponse.json({
      success: true,
      source: 'database',
      sections,
    });
  } catch (err: any) {
    console.error('API GET /api/admin/homepage error:', err?.message);
    return NextResponse.json(
      { success: false, error: 'Database query failed' },
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
    const { key, content, is_active } = body;

    if (!key || typeof key !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Valid section key is required' },
        { status: 400 }
      );
    }

    if (!content || typeof content !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Content object is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const updatedBy = auth.user?.email || 'admin@namoraworld.com';
    const nowIso = new Date().toISOString();

    const { data, error } = await supabase
      .from('homepage_content')
      .upsert(
        {
          key,
          content,
          is_active: is_active !== false,
          updated_at: nowIso,
          updated_by: updatedBy,
        },
        { onConflict: 'key' }
      )
      .select()
      .single();

    if (error) {
      // If table doesn't exist yet, return helpful error
      if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Database table homepage_content is pending remote migration. Please apply migration 008.',
          },
          { status: 503 }
        );
      }
      throw error;
    }

    await logAdminActivity(
      'UPDATE_HOMEPAGE_CONTENT',
      'homepage_content',
      key,
      { key, is_active: is_active !== false, updatedBy },
      updatedBy
    );

    return NextResponse.json({
      success: true,
      section: data,
      message: `Homepage section "${key}" updated successfully.`,
    });
  } catch (err: any) {
    console.error('API POST /api/admin/homepage error:', err?.message);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to update homepage content' },
      { status: 500 }
    );
  }
}
