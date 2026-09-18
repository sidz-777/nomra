import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAdminActivity } from '@/lib/admin/audit';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // 1. Strict Server-Side Authentication & Authorization Guard (Only owner and admin)
  const auth = await requireAdmin(request, ['owner', 'admin']);
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const body = await request.json();
    const productId = (body.product_id || body.productId || body.id || '').trim();
    const rawPrice = body.price;
    const numPrice = parseFloat(rawPrice);
    const rawDeposit = body.deposit_price !== undefined ? parseFloat(body.deposit_price) : 49.0;

    if (!productId) {
      return NextResponse.json({ success: false, error: 'Product ID is required.' }, { status: 400 });
    }

    if (isNaN(numPrice) || numPrice <= 0 || !isFinite(numPrice)) {
      return NextResponse.json(
        { success: false, error: 'Price must be a valid positive number.' },
        { status: 400 }
      );
    }

    const numDeposit = isNaN(rawDeposit) || rawDeposit < 0 || rawDeposit > numPrice ? 49.0 : rawDeposit;
    const numCod = numPrice - numDeposit;

    let dbPersisted = false;
    let dbProduct: any = null;

    const supabase = createAdminClient();

    // 1. Attempt Supabase RPC update_product_price
    try {
      const { data: rpcData, error: rpcErr } = await supabase.rpc('update_product_price', {
        p_product_id: productId,
        p_new_price: numPrice,
        p_new_deposit: numDeposit,
      });

      if (!rpcErr && rpcData?.success) {
        dbPersisted = true;
        dbProduct = rpcData;
      }
    } catch (rpcErr: any) {
      console.warn('RPC update_product_price note:', rpcErr?.message);
    }

    // 2. Direct table update fallback
    if (!dbPersisted) {
      try {
        const { data: patchData, error: patchErr } = await supabase
          .from('products')
          .update({
            price: numPrice,
            deposit_price: numDeposit,
            cod_price: numCod,
            updated_at: new Date().toISOString(),
          })
          .eq('id', productId)
          .select();

        if (!patchErr && patchData && patchData.length > 0) {
          dbPersisted = true;
          dbProduct = patchData[0];
        }
      } catch (patchErr: any) {
        console.warn('Direct products patch note:', patchErr?.message);
      }
    }

    // 3. Update catalog_overrides.json on disk
    const overridesPath = path.join(process.cwd(), 'catalog_overrides.json');
    let priceOverrides: Record<string, any> = {};
    if (fs.existsSync(overridesPath)) {
      try {
        priceOverrides = JSON.parse(fs.readFileSync(overridesPath, 'utf8'));
      } catch {
        priceOverrides = {};
      }
    }

    priceOverrides[productId] = {
      price: numPrice,
      deposit_price: numDeposit,
      cod_price: numCod,
      updated_at: new Date().toISOString(),
      dbPersisted,
    };

    try {
      fs.writeFileSync(overridesPath, JSON.stringify(priceOverrides, null, 2), 'utf8');
    } catch (fsErr: any) {
      console.warn('catalog_overrides.json write note:', fsErr?.message);
    }

    // 4. Invalidate Next.js cache so storefront updates immediately
    try {
      revalidatePath('/');
      revalidatePath('/api/products');
    } catch (cacheErr: any) {
      console.warn('Revalidation note:', cacheErr?.message);
    }

    // 5. Activity log
    await logAdminActivity(
      'product_price_updated',
      'products',
      productId,
      { price: numPrice, deposit_price: numDeposit, cod_price: numCod, db_persisted: dbPersisted },
      auth.user?.email || 'admin'
    );

    return NextResponse.json({
      success: true,
      product_id: productId,
      price: numPrice,
      new_price: numPrice,
      deposit_price: numDeposit,
      cod_price: numCod,
      db_persisted: dbPersisted,
      product: dbProduct || {
        id: productId,
        price: numPrice,
        deposit_price: numDeposit,
        cod_price: numCod,
        updated_at: priceOverrides[productId].updated_at,
      },
      message: `Product price successfully updated to ₹${numPrice}.`,
    });
  } catch (err: any) {
    console.error('API /api/admin/update-product-price error:', err?.message);
    return NextResponse.json(
      { success: false, error: 'Database error updating product price' },
      { status: 500 }
    );
  }
}
