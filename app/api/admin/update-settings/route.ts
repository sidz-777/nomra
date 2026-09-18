import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAdminActivity } from '@/lib/admin/audit';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // 1. Strict Server-Side Authentication & Authorization Guard (Only store OWNER can change store settings)
  const auth = await requireAdmin(request, ['owner']);
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const body = await request.json();
    const { framePrice, deposit, cod, gift, waPhone, upiId } = body;

    const supabase = createAdminClient();

    const settingsToUpdate = [
      { key: 'frame_base_price', value: String(framePrice) },
      { key: 'deposit_amount', value: String(deposit) },
      { key: 'cod_balance', value: String(cod) },
      { key: 'gift_packaging_price', value: String(gift) },
      { key: 'whatsapp_helpline', value: String(waPhone) },
      { key: 'store_upi_id', value: String(upiId) },
    ];

    for (const s of settingsToUpdate) {
      if (s.value && s.value !== 'undefined') {
        try {
          await supabase
            .from('settings')
            .upsert(
              { key: s.key, value: s.value, updated_at: new Date().toISOString() },
              { onConflict: 'key' }
            );
        } catch (uErr: any) {
          console.warn(`Settings update note for ${s.key}:`, uErr?.message);
        }
      }
    }

    // Activity log
    await logAdminActivity(
      'store_settings_updated',
      'settings',
      'store_parameters',
      { framePrice, deposit, cod, gift, waPhone, upiId },
      auth.user?.email || 'owner'
    );

    return NextResponse.json({
      success: true,
      message: 'Store configuration saved successfully',
      settings: body,
    });
  } catch (err: any) {
    console.error('API /api/admin/update-settings error:', err?.message);
    return NextResponse.json(
      { success: false, error: 'Database error updating store parameters' },
      { status: 500 }
    );
  }
}
