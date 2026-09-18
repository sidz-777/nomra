import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { logAdminActivity } from '@/lib/admin/audit';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // 1. Strict Server-Side Authentication & Authorization Guard
  const auth = await requireAdmin(request, ['owner', 'admin', 'staff']);
  if (!auth.authorized) {
    return auth.errorResponse!;
  }

  try {
    const body = await request.json();
    const { product_id, stock_quantity, in_stock, notes = '' } = body;

    if (!product_id) {
      return NextResponse.json({ success: false, error: 'Product ID is required.' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Query current product
    const { data: currentProd, error: fetchErr } = await supabase
      .from('products')
      .select('stock_quantity, in_stock, title')
      .eq('id', product_id)
      .maybeSingle();

    if (fetchErr || !currentProd) {
      return NextResponse.json({ success: false, error: 'Product not found in database.' }, { status: 404 });
    }

    let finalQty = currentProd.stock_quantity ?? 0;
    let finalInStock = currentProd.in_stock ?? true;

    if (stock_quantity !== undefined) {
      const parsedQty = parseInt(stock_quantity, 10);
      if (isNaN(parsedQty) || parsedQty < 0) {
        return NextResponse.json({ success: false, error: 'Stock quantity must be a non-negative integer.' }, { status: 400 });
      }
      finalQty = parsedQty;
      finalInStock = finalQty > 0;
    }

    if (in_stock !== undefined) {
      finalInStock = Boolean(in_stock);
      if (!finalInStock) {
        finalQty = 0;
      } else if (finalQty === 0) {
        finalQty = 5; // Default restoration quantity
      }
    }

    const nowIso = new Date().toISOString();

    // Persist to Supabase products table
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
    const qtyDiff = finalQty - (currentProd.stock_quantity ?? 0);
    if (qtyDiff !== 0) {
      await supabase.from('inventory_movements').insert([
        {
          product_id,
          change_quantity: qtyDiff,
          movement_type: 'adjustment',
          notes: notes || `Admin stock update by ${auth.user?.email || 'admin'}`,
          created_at: nowIso,
        },
      ]);
    }

    // Persist to catalog_overrides.json for immediate local availability
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
    } catch (fsErr: any) {
      console.warn('catalog_overrides write error:', fsErr?.message);
    }

    // Activity log
    await logAdminActivity(
      'product_stock_updated',
      'products',
      product_id,
      { title: currentProd.title, old_stock: currentProd.stock_quantity, new_stock: finalQty, in_stock: finalInStock },
      auth.user?.email || 'admin'
    );

    return NextResponse.json({
      success: true,
      product_id,
      stock_quantity: finalQty,
      in_stock: finalInStock,
      message: `Stock updated to ${finalQty} units (in_stock: ${finalInStock}).`,
    });
  } catch (err: any) {
    console.error('API /api/admin/adjust-stock error:', err?.message);
    return NextResponse.json(
      { success: false, error: 'Database error persisting inventory adjustment' },
      { status: 500 }
    );
  }
}
