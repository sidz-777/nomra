import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createAdminClient();
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('campaigns')
      .select('id, name, badge_text, headline, description, is_active, start_date, end_date, product_ids')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error || !data || !Array.isArray(data)) {
      return NextResponse.json({
        success: true,
        source: 'fallback',
        campaigns: [],
        productBadges: {},
      });
    }

    // Filter by dates if set
    const activeCampaigns = data.filter((c: any) => {
      if (c.start_date && new Date(c.start_date).toISOString() > now) return false;
      if (c.end_date && new Date(c.end_date).toISOString() < now) return false;
      return true;
    });

    // Build productId -> badgeText mapping
    const productBadges: Record<string, string> = {};
    for (const c of activeCampaigns) {
      if (Array.isArray(c.product_ids)) {
        for (const pid of c.product_ids) {
          if (pid && !productBadges[pid]) {
            productBadges[pid] = c.badge_text;
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      source: 'database',
      campaigns: activeCampaigns,
      productBadges,
    });
  } catch (err: any) {
    console.warn('API GET /api/campaigns fallback triggered:', err?.message);
    return NextResponse.json({
      success: true,
      source: 'fallback',
      campaigns: [],
      productBadges: {},
    });
  }
}
