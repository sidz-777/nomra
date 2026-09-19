import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAdminActivity } from '@/lib/admin/audit';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request, ['owner', 'admin', 'staff']);
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const supabase = createAdminClient();

    // 1. Fetch products
    const { data: productsData, error: prodErr } = await supabase
      .from('products')
      .select('*')
      .order('title', { ascending: true });

    if (prodErr) {
      throw prodErr;
    }

    const products = Array.isArray(productsData) ? productsData : [];

    // 2. Fetch recent movements
    let movements: any[] = [];
    try {
      const { data: moveData } = await supabase
        .from('inventory_movements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (Array.isArray(moveData)) {
        movements = moveData;
      }
    } catch (e: any) {
      console.warn('Inventory movements query note:', e?.message);
    }

    // 3. Compute inventory health
    let lowStockCount = 0;
    let outOfStockCount = 0;

    products.forEach((p) => {
      const stock = p.stock_quantity ?? 0;
      if (stock <= 0 || !p.in_stock) {
        outOfStockCount++;
      } else if (stock <= 5) {
        lowStockCount++;
      }
    });

    return NextResponse.json({
      success: true,
      products,
      movements,
      summary: {
        total_products: products.length,
        low_stock_count: lowStockCount,
        out_of_stock_count: outOfStockCount,
        healthy_count: Math.max(0, products.length - lowStockCount - outOfStockCount),
      },
    });
  } catch (err: any) {
    console.error('API /api/admin/inventory GET error:', err?.message);
    return NextResponse.json(
      { success: false, error: 'Database error fetching inventory data.' },
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
    const { product_id, stock_quantity, adjustment_type = 'adjustment', notes = '' } = body;

    if (!product_id) {
      return NextResponse.json({ success: false, error: 'product_id is required.' }, { status: 400 });
    }

    const parsedQty = parseInt(stock_quantity, 10);
    if (isNaN(parsedQty) || parsedQty < 0) {
      return NextResponse.json({ success: false, error: 'Stock quantity must be a non-negative integer.' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Query current product
    const { data: currentProd, error: fetchErr } = await supabase
      .from('products')
      .select('*')
      .eq('id', product_id)
      .maybeSingle();

    if (fetchErr || !currentProd) {
      return NextResponse.json({ success: false, error: 'Product not found.' }, { status: 404 });
    }

    const oldQty = currentProd.stock_quantity ?? 0;
    const finalQty = parsedQty;
    const finalInStock = finalQty > 0;
    const nowIso = new Date().toISOString();

    // Update products table
    const { error: updateErr } = await supabase
      .from('products')
      .update({
        stock_quantity: finalQty,
        in_stock: finalInStock,
        updated_at: nowIso,
      })
      .eq('id', product_id);

    if (updateErr) {
      throw updateErr;
    }

    // Record in inventory_movements table
    const qtyDiff = finalQty - oldQty;
    try {
      await supabase.from('inventory_movements').insert([
        {
          product_id,
          change_quantity: qtyDiff,
          movement_type: adjustment_type,
          notes: notes || `Admin adjustment (${qtyDiff >= 0 ? '+' : ''}${qtyDiff}) by ${auth.user?.email || 'admin'}`,
          created_at: nowIso,
        },
      ]);
    } catch (mvErr: any) {
      console.warn('inventory_movements insert note:', mvErr?.message);
    }

    // Update local overrides file
    try {
      const overridesPath = path.join(process.cwd(), 'catalog_overrides.json');
      let overrides: Record<string, any> = {};
      if (fs.existsSync(overridesPath)) {
        try {
          overrides = JSON.parse(fs.readFileSync(overridesPath, 'utf8'));
        } catch {}
      }
      overrides[product_id] = {
        ...(overrides[product_id] || {}),
        stock_quantity: finalQty,
        in_stock: finalInStock,
        updated_at: nowIso,
      };
      fs.writeFileSync(overridesPath, JSON.stringify(overrides, null, 2), 'utf8');
    } catch {}

    // Activity log
    await logAdminActivity(
      'INVENTORY_ADJUSTED',
      'inventory',
      product_id,
      {
        product_title: currentProd.title,
        old_stock: oldQty,
        new_stock: finalQty,
        change: qtyDiff,
        adjustment_type,
        notes,
      },
      auth.user?.email || 'admin'
    );

    return NextResponse.json({
      success: true,
      product: {
        ...currentProd,
        stock_quantity: finalQty,
        in_stock: finalInStock,
      },
      message: `Stock updated to ${finalQty} units.`,
    });
  } catch (err: any) {
    console.error('API /api/admin/inventory POST error:', err?.message);
    return NextResponse.json(
      { success: false, error: 'Database error persisting inventory adjustment.' },
      { status: 500 }
    );
  }
}
