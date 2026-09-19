import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { createAdminClient } from '@/lib/supabase/admin';
import { PERSIAN_DESIGNS } from '@/lib/storefront-data';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const categoryFilter = url.searchParams.get('category');
    const showAll = url.searchParams.get('all') === 'true';

    // 1. Read local design overrides if present
    const overridesPath = path.join(process.cwd(), 'design_overrides.json');
    let localDesigns: Record<string, any> = {};
    if (fs.existsSync(overridesPath)) {
      try {
        localDesigns = JSON.parse(fs.readFileSync(overridesPath, 'utf8'));
      } catch {
        localDesigns = {};
      }
    }

    let rawDesigns: any[] = [];

    // 2. Query Supabase designs table
    try {
      const supabase = createAdminClient();
      let query = supabase
        .from('designs')
        .select('*');

      if (!showAll) {
        query = query.eq('is_active', true);
      }

      query = query.order('sort_order', { ascending: true });

      const { data, error } = await query;
      if (!error && data && Array.isArray(data) && data.length > 0) {
        rawDesigns = data;
      }
    } catch (e: any) {
      console.warn('Supabase designs query error:', e?.message);
    }

    // 3. Fallback to canonical PERSIAN_DESIGNS if DB empty/unseeded
    if (rawDesigns.length === 0) {
      rawDesigns = PERSIAN_DESIGNS.map((d, index) => ({
        id: d.id,
        slug: d.id.replace(/_/g, '-'),
        title: d.title,
        category: d.category,
        category_label: d.categoryLabel,
        image_url: d.image.startsWith('/') ? d.image : `/${d.image}`,
        preview_image_url: d.assetPath,
        overlay_config: d.overlay,
        is_active: true,
        is_featured: false,
        sort_order: index + 1,
      }));
    }

    // 4. Merge any local designs/overrides
    const mergedMap = new Map<string, any>();
    rawDesigns.forEach((d) => mergedMap.set(d.id, d));
    Object.values(localDesigns).forEach((customDesign: any) => {
      if (customDesign && customDesign.id) {
        const existing = mergedMap.get(customDesign.id) || {};
        mergedMap.set(customDesign.id, { ...existing, ...customDesign });
      }
    });

    let result = Array.from(mergedMap.values());

    // 5. Apply filters
    if (!showAll) {
      result = result.filter((d) => d.is_active !== false);
    }

    if (categoryFilter && categoryFilter !== 'all') {
      if (categoryFilter === 'antique') {
        result = result.filter(
          (d) => d.category === 'amber' || d.category === 'vintage' || d.category === 'antique'
        );
      } else {
        result = result.filter((d) => d.category === categoryFilter);
      }
    }

    // Sort by sort_order
    result.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    // Map to storefront interface format
    const formatted = result.map((d) => ({
      id: d.id,
      category: d.category,
      categoryLabel: d.category_label || d.categoryLabel || 'Persian Heritage',
      title: d.title,
      image: d.image_url || d.image,
      assetPath: d.preview_image_url || d.image_url || d.assetPath,
      overlay: d.overlay_config || d.overlay || {
        posX: 50,
        posY: 46,
        maxWidth: 68,
        fontSizeEn: 28,
        fontSizeAr: 34,
        fontEn: "'Cinzel', serif",
        fontAr: "'Amiri', serif",
        textColor: '#3b0a16',
        textShadow: '0 1px 2px rgba(255,255,255,0.6)',
      },
      is_active: d.is_active !== false,
      is_featured: Boolean(d.is_featured),
      sort_order: d.sort_order || 0,
    }));

    return NextResponse.json({
      success: true,
      designs: formatted,
      total: formatted.length,
    });
  } catch (error: any) {
    console.error('API /api/designs error:', error);
    return NextResponse.json({ success: false, error: 'Failed to retrieve designs' }, { status: 500 });
  }
}
