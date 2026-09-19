import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAdminActivity } from '@/lib/admin/audit';

export const dynamic = 'force-dynamic';

const defaultSettings = [
  { channel: 'email', is_enabled: true, provider: 'mock', test_mode: true },
  { channel: 'whatsapp', is_enabled: true, provider: 'mock', test_mode: true },
  { channel: 'sms', is_enabled: true, provider: 'mock', test_mode: true },
];

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, ['owner', 'admin', 'staff']);
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from('notification_settings').select('*');

    if (!error && Array.isArray(data) && data.length > 0) {
      return NextResponse.json({ success: true, settings: data });
    }

    return NextResponse.json({ success: true, settings: defaultSettings });
  } catch (err: any) {
    console.error('API /api/admin/settings/notifications GET error:', err?.message);
    return NextResponse.json({ success: true, settings: defaultSettings });
  }
}

export async function POST(request: NextRequest) {
  // Only owner and admin can mutate notification configurations
  const auth = await requireAdmin(request, ['owner', 'admin']);
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const body = await request.json();
    const { channel, is_enabled, test_mode } = body;

    if (!channel) {
      return NextResponse.json({ success: false, error: 'channel is required' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const nowIso = new Date().toISOString();

    const { data, error } = await supabase
      .from('notification_settings')
      .upsert(
        {
          channel,
          is_enabled: Boolean(is_enabled),
          test_mode: Boolean(test_mode),
          provider: 'mock', // Strictly enforce mock in Phase 4
          updated_at: nowIso,
        },
        { onConflict: 'channel' }
      )
      .select()
      .single();

    if (error && error.code !== 'PGRST205') {
      throw error;
    }

    await logAdminActivity(
      'notification_settings_updated',
      'notification_settings',
      channel,
      { channel, is_enabled, test_mode },
      auth.user?.email || 'admin'
    );

    return NextResponse.json({
      success: true,
      setting: data || { channel, is_enabled, test_mode, provider: 'mock' },
    });
  } catch (err: any) {
    console.error('API /api/admin/settings/notifications POST error:', err?.message);
    return NextResponse.json(
      { success: false, error: 'Failed to update notification settings' },
      { status: 500 }
    );
  }
}
