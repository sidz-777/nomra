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

/**
 * Update local disk catalog_overrides.json
 */
function updateDiskOverride(productId: string, data: Record<string, any>) {
  try {
    const overridesPath = path.join(process.cwd(), 'catalog_overrides.json');
    let overrides: Record<string, any> = {};
    if (fs.existsSync(overridesPath)) {
      overrides = JSON.parse(fs.readFileSync(overridesPath, 'utf8'));
    }
    overrides[productId] = {
      ...(overrides[productId] || {}),
      ...data,
      updated_at: new Date().toISOString(),
    };
    fs.writeFileSync(overridesPath, JSON.stringify(overrides, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to update disk catalog override:', err);
  }
}

/**
 * POST /api/admin/products — Create new product
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
      subtitle = '',
      description = '',
      type = 'ready_stock',
      category = 'cars',
      category_label,
      image_url,
      gallery_images = [],
      video_url = '',
      tag = '',
      tag_class = 'badge-popular',
      price,
      compare_at_price = null,
      deposit_price = 49,
      in_stock = true,
      stock_quantity = 5,
      is_featured = false,
      is_active = true,
      collection_id = null,
      sku,
    } = body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'Product title is required' }, { status: 400 });
    }

    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      return NextResponse.json({ success: false, error: 'Valid price greater than 0 is required' }, { status: 400 });
    }

    const numericDeposit = parseFloat(deposit_price) || 49;
    const numericCod = Math.max(0, numericPrice - numericDeposit);
    const resolvedCategoryLabel = category_label || category.charAt(0).toUpperCase() + category.slice(1);
    const resolvedId = customId && customId.trim() ? customId.trim() : `${slugify(category)}-${slugify(title)}-${Date.now().toString().slice(-4)}`;
    const resolvedSlug = slugify(title);
    const resolvedSku = sku || `NAM-${resolvedId.toUpperCase().slice(0, 8)}`;

    const newProductRecord = {
      id: resolvedId,
      slug: resolvedSlug,
      sku: resolvedSku,
      title: title.trim(),
      subtitle: subtitle.trim(),
      description: description.trim(),
      type,
      category,
      category_label: resolvedCategoryLabel,
      image_url: image_url || '/assets/products/car-1.jpg',
      gallery_images,
      video_url,
      tag,
      tag_class,
      price: numericPrice,
      compare_at_price: compare_at_price ? parseFloat(compare_at_price) : null,
      deposit_price: numericDeposit,
      cod_price: numericCod,
      in_stock: Boolean(in_stock),
      stock_quantity: parseInt(stock_quantity, 10) || (in_stock ? 5 : 0),
      is_featured: Boolean(is_featured),
      is_active: Boolean(is_active),
      collection_id,
      sort_order: 0,
    };

    // 1. Try Supabase Insert
    let dbPersisted = false;
    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from('products')
        .insert([newProductRecord])
        .select();

      if (!error) {
        dbPersisted = true;
      } else {
        console.warn('Supabase product insert warning:', error.message);
        // If some extension columns don't exist yet, retry with base columns
        const baseRecord = {
          id: newProductRecord.id,
          title: newProductRecord.title,
          subtitle: newProductRecord.subtitle,
          type: newProductRecord.type,
          category: newProductRecord.category,
          category_label: newProductRecord.category_label,
          image_url: newProductRecord.image_url,
          tag: newProductRecord.tag,
          tag_class: newProductRecord.tag_class,
          price: newProductRecord.price,
          deposit_price: newProductRecord.deposit_price,
          cod_price: newProductRecord.cod_price,
          in_stock: newProductRecord.in_stock,
          sort_order: newProductRecord.sort_order,
        };
        const retryRes = await supabase.from('products').insert([baseRecord]).select();
        if (!retryRes.error) {
          dbPersisted = true;
        }
      }
    } catch (dbErr: any) {
      console.warn('Supabase DB error on product insert:', dbErr?.message);
    }

    // 2. Persist to local disk override for 100% resilience
    updateDiskOverride(resolvedId, newProductRecord);

    // 3. Log audit event
    await recordAdminAudit(auth.user.email, 'CREATE_PRODUCT', 'product', resolvedId, {
      title,
      price: numericPrice,
      db_persisted: dbPersisted,
    });

    return NextResponse.json({
      success: true,
      message: dbPersisted ? 'Product created and saved to database' : 'Product created in catalog overrides',
      product: newProductRecord,
      db_persisted: dbPersisted,
    });
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Server error' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/products — Update existing product
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
      subtitle,
      description,
      type,
      category,
      category_label,
      image_url,
      gallery_images,
      video_url,
      tag,
      tag_class,
      price,
      compare_at_price,
      deposit_price,
      in_stock,
      stock_quantity,
      is_featured,
      is_active,
      collection_id,
      sku,
      slug,
    } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Product ID is required for update' }, { status: 400 });
    }

    const updates: Record<string, any> = {};
    if (title !== undefined) updates.title = title.trim();
    if (subtitle !== undefined) updates.subtitle = subtitle.trim();
    if (description !== undefined) updates.description = description.trim();
    if (type !== undefined) updates.type = type;
    if (category !== undefined) updates.category = category;
    if (category_label !== undefined) updates.category_label = category_label;
    if (image_url !== undefined) updates.image_url = image_url;
    if (gallery_images !== undefined) updates.gallery_images = gallery_images;
    if (video_url !== undefined) updates.video_url = video_url;
    if (tag !== undefined) updates.tag = tag;
    if (tag_class !== undefined) updates.tag_class = tag_class;
    if (sku !== undefined) updates.sku = sku;
    if (slug !== undefined) updates.slug = slug;
    if (collection_id !== undefined) updates.collection_id = collection_id;
    if (is_featured !== undefined) updates.is_featured = Boolean(is_featured);
    if (is_active !== undefined) updates.is_active = Boolean(is_active);

    if (price !== undefined) {
      const p = parseFloat(price);
      if (isNaN(p) || p <= 0) {
        return NextResponse.json({ success: false, error: 'Valid price greater than 0 required' }, { status: 400 });
      }
      updates.price = p;
      const dep = deposit_price !== undefined ? parseFloat(deposit_price) : 49;
      updates.deposit_price = dep;
      updates.cod_price = Math.max(0, p - dep);
    }

    if (compare_at_price !== undefined) {
      updates.compare_at_price = compare_at_price ? parseFloat(compare_at_price) : null;
    }

    if (in_stock !== undefined) {
      updates.in_stock = Boolean(in_stock);
    }

    if (stock_quantity !== undefined) {
      const qty = parseInt(stock_quantity, 10);
      updates.stock_quantity = isNaN(qty) ? 0 : qty;
      if (in_stock === undefined) {
        updates.in_stock = updates.stock_quantity > 0;
      }
    }

    // 1. Try Supabase Update
    let dbPersisted = false;
    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select();

      if (!error) {
        dbPersisted = true;
      } else {
        console.warn('Supabase product update error:', error.message);
        // Filter to standard columns if extension columns fail
        const standardUpdates: Record<string, any> = {};
        ['title', 'subtitle', 'category', 'category_label', 'image_url', 'tag', 'tag_class', 'price', 'deposit_price', 'cod_price', 'in_stock'].forEach((k) => {
          if (updates[k] !== undefined) standardUpdates[k] = updates[k];
        });
        const retry = await supabase.from('products').update(standardUpdates).eq('id', id).select();
        if (!retry.error) {
          dbPersisted = true;
        }
      }
    } catch (dbErr: any) {
      console.warn('Supabase DB error on product update:', dbErr?.message);
    }

    // 2. Persist to disk overrides
    updateDiskOverride(id, updates);

    // 3. Log audit event
    await recordAdminAudit(auth.user.email, 'UPDATE_PRODUCT', 'product', id, updates);

    return NextResponse.json({
      success: true,
      message: dbPersisted ? 'Product updated in database' : 'Product updated in local catalog overrides',
      product: { id, ...updates },
      db_persisted: dbPersisted,
    });
  } catch (error: any) {
    console.error('Error updating product:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Server error' }, { status: 500 });
  }
}
