import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { DEFAULT_HOMEPAGE_CONTENT } from '@/lib/homepage-data';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('homepage_content')
      .select('key, content, is_active');

    if (error || !data || !Array.isArray(data)) {
      // Resilient fallback if table does not exist yet or error occurs
      return NextResponse.json({
        success: true,
        source: 'fallback',
        ...DEFAULT_HOMEPAGE_CONTENT,
      });
    }

    const announcementRow = data.find((row) => row.key === 'announcement_bar');
    const heroRow = data.find((row) => row.key === 'hero_section');

    const announcement = announcementRow && announcementRow.is_active !== false
      ? { ...DEFAULT_HOMEPAGE_CONTENT.announcement, ...announcementRow.content }
      : { ...DEFAULT_HOMEPAGE_CONTENT.announcement, enabled: false };

    const hero = heroRow && heroRow.is_active !== false
      ? { ...DEFAULT_HOMEPAGE_CONTENT.hero, ...heroRow.content }
      : DEFAULT_HOMEPAGE_CONTENT.hero;

    return NextResponse.json({
      success: true,
      source: 'database',
      announcement,
      hero,
    });
  } catch (err: any) {
    console.warn('API GET /api/homepage fallback triggered:', err?.message);
    return NextResponse.json({
      success: true,
      source: 'fallback',
      ...DEFAULT_HOMEPAGE_CONTENT,
    });
  }
}
