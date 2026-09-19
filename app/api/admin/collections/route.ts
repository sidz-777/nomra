import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { recordAdminAudit } from '@/lib/cms/audit';

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

const DEFAULT_COLLECTIONS = [
  {
    id: 'col_persian',
    slug: 'persian-heritage',
    title: 'Persian & Oriental Heritage',
    description: 'Master-calligraphy A4 wall frames on authentic Persian carpet backgrounds.',
    image_url: '/assets/designs/design1.jpg',
    type: 'persian',
    is_active: true,
    sort_order: 1,
  },
  {
    id: 'col_ready_stock',
    slug: 'ready-to-ship',
    title: 'Ready-to-Ship Editions',
    description: 'Curated supercar, sports, names, and pop art frames dispatched in 24 hours.',
    image_url: '/assets/products/car-1.jpg',
    type: 'ready_stock',
    is_active: true,
    sort_order: 2,
  },
];

function updateLocalCollection(id: string, data: Record<string, any>) {
  try {
    const filePath = path.join(process.cwd(), 'collection_overrides.json');
    let overrides: Record<string, any> = {};
    if (fs.existsSync(filePath)) {
      overrides = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    overrides[id] = {
      ...(overrides[id] || {}),
      ...data,
      updated_at: new Date().toISOString(),
    };
    fs.writeFileSync(filePath, JSON.stringify(overrides, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to update local collection override:', err);
  }
}

/**
 * GET /api/admin/collections
 */
export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.authorized || !auth.user) {
    return auth.errorResponse || NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    let collections: any[] = [];

    try {
      const { data, error } = await supabase
        .from('collections')
        .select('*')
        .order('sort_order', { ascending: true });

      if (!error && data && Array.isArray(data) && data.length > 0) {
        collections = data;
      }
    } catch (e: any) {
      console.warn('Supabase collections query error:', e?.message);
    }

    if (collections.length === 0) {
      collections = [...DEFAULT_COLLECTIONS];
    }

    // Merge local overrides
    const filePath = path.join(process.cwd(), 'collection_overrides.json');
    if (fs.existsSync(filePath)) {
      try {
        const overrides = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const map = new Map();
        collections.forEach((c) => map.set(c.id, c));
        Object.values(overrides).forEach((custom: any) => {
          if (custom && custom.id) {
            map.set(custom.id, { ...(map.get(custom.id) || {}), ...custom });
          }
        });
        collections = Array.from(map.values());
      } catch {}
    }

    collections.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    return NextResponse.json({ success: true, collections, total: collections.length });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Server error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/collections
 */
export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.authorized || !auth.user) {
    return auth.errorResponse || NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, slug, description = '', image_url = '', type = 'custom', is_active = true, sort_order = 10 } = body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'Collection title is required' }, { status: 400 });
    }

    const resolvedSlug = slug && slug.trim() ? slugify(slug) : slugify(title);
    const resolvedId = `col_${resolvedSlug.replace(/-/g, '_')}_${Date.now().toString().slice(-4)}`;

    const newCol = {
      id: resolvedId,
      slug: resolvedSlug,
      title: title.trim(),
      description: description.trim(),
      image_url: image_url.trim(),
      type,
      is_active: Boolean(is_active),
      sort_order: parseInt(sort_order, 10) || 10,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    let dbPersisted = false;
    try {
      const supabase = createAdminClient();
      const { error } = await supabase.from('collections').insert([newCol]);
      if (!error) dbPersisted = true;
    } catch (err: any) {
      console.warn('Supabase collection insert warning:', err?.message);
    }

    updateLocalCollection(resolvedId, newCol);

    await recordAdminAudit(auth.user.email, 'CREATE_COLLECTION', 'collection', resolvedId, {
      title,
      db_persisted: dbPersisted,
    });

    return NextResponse.json({
      success: true,
      message: 'Collection created successfully',
      collection: newCol,
      db_persisted: dbPersisted,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Server error' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/collections
 */
export async function PUT(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.authorized || !auth.user) {
    return auth.errorResponse || NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, title, slug, description, image_url, type, is_active, sort_order } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Collection id is required' }, { status: 400 });
    }

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (title !== undefined) updates.title = title.trim();
    if (slug !== undefined) updates.slug = slugify(slug);
    if (description !== undefined) updates.description = description.trim();
    if (image_url !== undefined) updates.image_url = image_url.trim();
    if (type !== undefined) updates.type = type;
    if (is_active !== undefined) updates.is_active = Boolean(is_active);
    if (sort_order !== undefined) updates.sort_order = parseInt(sort_order, 10);

    let dbPersisted = false;
    try {
      const supabase = createAdminClient();
      const { error } = await supabase.from('collections').update(updates).eq('id', id);
      if (!error) dbPersisted = true;
    } catch (err: any) {
      console.warn('Supabase collection update warning:', err?.message);
    }

    updateLocalCollection(id, updates);

    await recordAdminAudit(auth.user.email, 'UPDATE_COLLECTION', 'collection', id, updates);

    return NextResponse.json({
      success: true,
      message: 'Collection updated successfully',
      collection: { id, ...updates },
      db_persisted: dbPersisted,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Server error' }, { status: 500 });
  }
}
