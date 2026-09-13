import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAdminActivity } from '@/lib/admin/audit';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { framePrice, deposit, cod, gift, waPhone, upiId, admin_user = 'admin' } = body;

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
          // Attempt RPC update_store_setting first
          const { error: rpcErr } = await supabase.rpc('update_store_setting', {
            p_key: s.key,
            p_value: s.value,
          });

          if (rpcErr) {
            // Upsert directly to settings table
            await supabase
              .from('settings')
              .upsert(
                { key: s.key, value: s.value, updated_at: new Date().toISOString() },
                { onConflict: 'key' }
              );
          }
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
      admin_user
    );

    // Proxy to legacy server if running
    try {
      await fetch('http://localhost:3300/api/admin/update-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
    } catch {}

    return NextResponse.json({
      success: true,
      message: 'Store parameters updated successfully.',
      updated_settings: body,
    });
  } catch (err: any) {
    console.error('API /api/admin/update-settings error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to update store settings' },
      { status: 500 }
    );
  }
}
