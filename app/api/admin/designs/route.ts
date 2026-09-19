import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { recordAdminAudit } from '@/lib/cms/audit';
import { PERSIAN_DESIGNS } from '@/lib/storefront-data';

export const dynamic = 'force-dynamic';

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

function updateLocalDesign(designId: string, data: Record<string, any>) {
  try {
    const overridesPath = path.join(process.cwd(), 'design_overrides.json');
    let overrides: Record<string, any> = {};
    if (fs.existsSync(overridesPath)) {
      overrides = JSON.parse(fs.readFileSync(overridesPath, 'utf8'));
    }
    overrides[designId] = {
      ...(overrides[designId] || {}),
      ...data,
      updated_at: new Date().toISOString(),
    };
    fs.writeFileSync(overridesPath, JSON.stringify(overrides, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to update local design override:', err);
  }
}

/**
 * GET /api/admin/designs — List all designs for admin
 */
export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.authorized || !auth.user) {
    return auth.errorResponse || NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    let rawDesigns: any[] = [];
    try {
      const { data, error } = await supabase
        .from('designs')
        .select('*')
        .order('sort_order', { ascending: true });

      if (!error && data && Array.isArray(data) && data.length > 0) {
        rawDesigns = data;
      }
    } catch (e: any) {
      console.warn('Supabase admin designs error:', e?.message);
    }

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

    // Merge local design overrides
    const overridesPath = path.join(process.cwd(), 'design_overrides.json');
    if (fs.existsSync(overridesPath)) {
      try {
        const localOverrides = JSON.parse(fs.readFileSync(overridesPath, 'utf8'));
        const map = new Map();
        rawDesigns.forEach((d) => map.set(d.id, d));
        Object.values(localOverrides).forEach((custom: any) => {
          if (custom && custom.id) {
            map.set(custom.id, { ...(map.get(custom.id) || {}), ...custom });
          }
        });
        rawDesigns = Array.from(map.values());
      } catch {}
    }

    rawDesigns.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    return NextResponse.json({ success: true, designs: rawDesigns });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Server error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/designs — Create a new design
 */
export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.authorized || !auth.user) {
    return auth.errorResponse || NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      id: customId,
      title,
      category = 'crimson',
      category_label,
      image_url,
      preview_image_url,
      description = '',
      overlay_config,
      collection_id = null,
      is_active = true,
      is_featured = false,
      sort_order = 99,
    } = body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'Design title is required' }, { status: 400 });
    }

    if (!image_url || typeof image_url !== 'string' || image_url.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'Design image_url is required' }, { status: 400 });
    }

    const resolvedCategoryLabel =
      category_label ||
      (category === 'crimson'
        ? 'Crimson & Ruby'
        : category === 'blue'
        ? 'Royal Blue & Indigo'
        : category === 'pastel'
        ? 'Pastel & Garden'
        : category === 'amber'
        ? 'Amber & Heritage'
        : category === 'vintage'
        ? 'Vintage & Classical'
        : 'Custom Frame');

    const resolvedId =
      customId && customId.trim()
        ? customId.trim()
        : `design_${slugify(title)}_${Date.now().toString().slice(-4)}`;
    const resolvedSlug = slugify(title);

    const defaultOverlay = {
      posX: 50,
      posY: 46,
      maxWidth: 68,
      fontSizeEn: 28,
      fontSizeAr: 34,
      fontEn: "'Cinzel', serif",
      fontAr: "'Amiri', serif",
      textColor: '#3b0a16',
      textShadow: '0 1px 2px rgba(255,255,255,0.6)',
    };

    const newDesign = {
      id: resolvedId,
      slug: resolvedSlug,
      title: title.trim(),
      category,
      category_label: resolvedCategoryLabel,
      image_url: image_url.trim(),
      preview_image_url: preview_image_url ? preview_image_url.trim() : image_url.trim(),
      description: description.trim(),
      overlay_config: overlay_config || defaultOverlay,
      collection_id,
      is_active: Boolean(is_active),
      is_featured: Boolean(is_featured),
      sort_order: parseInt(sort_order, 10) || 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 1. Try Supabase Insert
    let dbPersisted = false;
    try {
      const supabase = createAdminClient();
      const { error } = await supabase.from('designs').insert([newDesign]);
      if (!error) {
        dbPersisted = true;
      } else {
        console.warn('Supabase design insert error:', error.message);
      }
    } catch (err: any) {
      console.warn('Supabase DB error on design insert:', err?.message);
    }

    // 2. Persist to local design overrides
    updateLocalDesign(resolvedId, newDesign);

    // 3. Log audit event
    await recordAdminAudit(auth.user.email, 'CREATE_DESIGN', 'design', resolvedId, {
      title,
      category,
      db_persisted: dbPersisted,
    });

    return NextResponse.json({
      success: true,
      message: dbPersisted ? 'Design created in database' : 'Design created in local configuration',
      design: newDesign,
      db_persisted: dbPersisted,
    });
  } catch (error: any) {
    console.error('Error creating design:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Server error' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/designs — Update design
 */
export async function PUT(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.authorized || !auth.user) {
    return auth.errorResponse || NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      id,
      title,
      category,
      category_label,
      image_url,
      preview_image_url,
      description,
      overlay_config,
      collection_id,
      is_active,
      is_featured,
      sort_order,
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Design id is required' }, { status: 400 });
    }

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (title !== undefined) updates.title = title.trim();
    if (category !== undefined) updates.category = category;
    if (category_label !== undefined) updates.category_label = category_label;
    if (image_url !== undefined) updates.image_url = image_url;
    if (preview_image_url !== undefined) updates.preview_image_url = preview_image_url;
    if (description !== undefined) updates.description = description;
    if (overlay_config !== undefined) updates.overlay_config = overlay_config;
    if (collection_id !== undefined) updates.collection_id = collection_id;
    if (is_active !== undefined) updates.is_active = Boolean(is_active);
    if (is_featured !== undefined) updates.is_featured = Boolean(is_featured);
    if (sort_order !== undefined) updates.sort_order = parseInt(sort_order, 10);

    // 1. Try Supabase Update
    let dbPersisted = false;
    try {
      const supabase = createAdminClient();
      const { error } = await supabase.from('designs').update(updates).eq('id', id);
      if (!error) {
        dbPersisted = true;
      } else {
        console.warn('Supabase design update error:', error.message);
      }
    } catch (err: any) {
      console.warn('Supabase DB error on design update:', err?.message);
    }

    // 2. Persist to local design overrides
    updateLocalDesign(id, updates);

    // 3. Log audit event
    await recordAdminAudit(auth.user.email, 'UPDATE_DESIGN', 'design', id, updates);

    return NextResponse.json({
      success: true,
      message: dbPersisted ? 'Design updated in database' : 'Design updated in local configuration',
      design: { id, ...updates },
      db_persisted: dbPersisted,
    });
  } catch (error: any) {
    console.error('Error updating design:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Server error' }, { status: 500 });
  }
}
