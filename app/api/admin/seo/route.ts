import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAdminActivity } from '@/lib/admin/audit';

export const dynamic = 'force-dynamic';

const DEFAULT_SEO_PAGES = [
  {
    page_path: '/',
    title: 'NAMORA | Personalized Handcrafted A4 Wall Frames with Arabic & Persian Calligraphy',
    meta_description: 'Order personalized handmade A4 framed calligraphy with Arabic & English names on authentic Persian designs. ₹499 with ₹49 advance deposit and ₹450 Cash on Delivery.',
    canonical_url: 'https://namoraworld.com',
    og_title: 'NAMORA — Handcrafted Personalized Calligraphy Frames',
    og_description: 'Because some names deserve to be framed. A4 luxury frames hand-finished and delivered across India.',
    og_image: 'https://namoraworld.com/assets/designs/design1.jpg',
    robots: 'index, follow',
  },
  {
    page_path: '/customize',
    title: 'Customize Your Handcrafted Frame | NAMORA Calligraphy Studio',
    meta_description: 'Design your custom A4 wall frame. Real-time preview with dual English & Arabic calligraphy on authentic Persian rugs and heritage backgrounds.',
    canonical_url: 'https://namoraworld.com/customize',
    og_title: 'Personalize Your Frame — NAMORA Studio',
    og_description: 'Create your bespoke calligraphy frame in seconds with live preview.',
    og_image: 'https://namoraworld.com/assets/designs/design1.jpg',
    robots: 'index, follow',
  },
  {
    page_path: '/products',
    title: 'Ready-to-Ship Editions & Art Prints | NAMORA Gallery',
    meta_description: 'Browse authentic ready-to-ship A4 frames. Supercars, sports champions, Quranic calligraphy, and pop culture art in solid satin black moulding.',
    canonical_url: 'https://namoraworld.com#ready-to-ship',
    og_title: 'Ready-to-Ship A4 Framed Art — NAMORA',
    og_description: 'Instant dispatch frames ready for gifting and home decor.',
    og_image: 'https://namoraworld.com/assets/products/car-1.jpg',
    robots: 'index, follow',
  },
  {
    page_path: '/collections',
    title: 'Heritage Collections & Curated Art | NAMORA',
    meta_description: 'Explore curated Persian, Oriental, and classical heritage collections framed in gallery-grade acrylic glass.',
    canonical_url: 'https://namoraworld.com#heritage',
    og_title: 'Curated Heritage Collections — NAMORA',
    og_description: 'Artisanal frames inspired by centuries of calligraphy mastery.',
    og_image: 'https://namoraworld.com/assets/designs/design2.jpg',
    robots: 'index, follow',
  },
];

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, ['owner', 'admin', 'staff']);
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('seo_metadata')
      .select('*')
      .order('page_path', { ascending: true });

    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
        return NextResponse.json({
          success: true,
          source: 'fallback',
          pages: DEFAULT_SEO_PAGES,
        });
      }
      throw error;
    }

    const pages = Array.isArray(data) && data.length > 0 ? data : DEFAULT_SEO_PAGES;
    return NextResponse.json({
      success: true,
      source: 'database',
      pages,
    });
  } catch (err: any) {
    console.error('API GET /api/admin/seo error:', err?.message);
    return NextResponse.json(
      { success: false, error: 'Database error fetching SEO metadata' },
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
      page_path,
      title,
      meta_description,
      canonical_url,
      og_title,
      og_description,
      og_image,
      robots,
    } = body;

    if (!page_path || !title || !meta_description) {
      return NextResponse.json(
        { success: false, error: 'Page path, title, and meta description are required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const authorEmail = auth.user?.email || 'admin@namoraworld.com';
    const nowIso = new Date().toISOString();

    const upsertPayload = {
      page_path: page_path.trim(),
      title: title.trim(),
      meta_description: meta_description.trim(),
      canonical_url: canonical_url ? canonical_url.trim() : '',
      og_title: og_title ? og_title.trim() : '',
      og_description: og_description ? og_description.trim() : '',
      og_image: og_image ? og_image.trim() : '',
      robots: robots || 'index, follow',
      updated_at: nowIso,
    };

    const { data, error } = await supabase
      .from('seo_metadata')
      .upsert(upsertPayload, { onConflict: 'page_path' })
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Database table seo_metadata is pending remote migration. Please apply migration 008.',
          },
          { status: 503 }
        );
      }
      throw error;
    }

    await logAdminActivity(
      'UPDATE_SEO_METADATA',
      'seo_metadata',
      page_path,
      { page_path, title },
      authorEmail
    );

    return NextResponse.json({
      success: true,
      page: data,
      message: `SEO metadata for "${page_path}" updated successfully.`,
    });
  } catch (err: any) {
    console.error('API POST /api/admin/seo error:', err?.message);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to update SEO metadata' },
      { status: 500 }
    );
  }
}
