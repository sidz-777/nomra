import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { recordAdminAudit } from '@/lib/cms/audit';

export const dynamic = 'force-dynamic';

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

export async function POST(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.authorized || !auth.user) {
    return auth.errorResponse || NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { product_id, is_active = false } = body;

    if (!product_id) {
      return NextResponse.json({ success: false, error: 'product_id is required' }, { status: 400 });
    }

    const activeState = Boolean(is_active);

    // 1. Update in Supabase
    let dbPersisted = false;
    try {
      const supabase = createAdminClient();
      const { error } = await supabase
        .from('products')
        .update({ is_active: activeState, updated_at: new Date().toISOString() })
        .eq('id', product_id);

      if (!error) {
        dbPersisted = true;
      } else {
        console.warn('Supabase archive update warning:', error.message);
      }
    } catch (err: any) {
      console.warn('Supabase archive error:', err?.message);
    }

    // 2. Update disk override
    updateDiskOverride(product_id, { is_active: activeState });

    // 3. Log audit
    await recordAdminAudit(
      auth.user.email,
      activeState ? 'UNARCHIVE_PRODUCT' : 'ARCHIVE_PRODUCT',
      'product',
      product_id,
      { is_active: activeState, db_persisted: dbPersisted }
    );

    return NextResponse.json({
      success: true,
      message: activeState ? 'Product unarchived (active)' : 'Product archived (hidden from storefront)',
      product_id,
      is_active: activeState,
      db_persisted: dbPersisted,
    });
  } catch (error: any) {
    console.error('Error archiving product:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Server error' }, { status: 500 });
  }
}
