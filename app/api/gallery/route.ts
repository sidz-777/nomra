import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export interface PublicGalleryItem {
  id?: string;
  image: string;
  title: string;
  caption: string;
}

const DEFAULT_GALLERY: PublicGalleryItem[] = [
  {
    id: 'gal-1',
    image: '/frame1.jpg',
    title: 'Fatima — Red Persian Frame',
    caption: 'Customized Wall Frame Sample 1',
  },
  {
    id: 'gal-2',
    image: '/frame2.jpeg',
    title: 'Omar — Blue Oriental Frame',
    caption: 'Customized Wall Frame Sample 2',
  },
  {
    id: 'gal-3',
    image: '/frame3.jpeg',
    title: 'Aisha — Purple Floral Frame',
    caption: 'Customized Wall Frame Sample 3',
  },
  {
    id: 'gal-4',
    image: '/frame4.jpg',
    title: 'Zayd — Book Stack Rug Frame',
    caption: 'Customized Wall Frame Sample 4',
  },
];

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from('customer_gallery')
      .select('id, image_url, title, caption, sort_order')
      .eq('is_approved', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });

    if (error || !data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json({
        success: true,
        source: 'fallback',
        items: DEFAULT_GALLERY,
      });
    }

    const items: PublicGalleryItem[] = data.map((item: any, idx: number) => ({
      id: item.id || `gal-${idx + 1}`,
      image: item.image_url,
      title: item.title,
      caption: item.caption || item.title,
    }));

    return NextResponse.json({
      success: true,
      source: 'database',
      items,
    });
  } catch (err: any) {
    console.warn('API GET /api/gallery fallback triggered:', err?.message);
    return NextResponse.json({
      success: true,
      source: 'fallback',
      items: DEFAULT_GALLERY,
    });
  }
}
