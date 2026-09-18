import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { createAdminClient } from '@/lib/supabase/admin';
import { READY_STOCK_PRODUCTS, PERSIAN_DESIGNS } from '@/lib/storefront-data';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Load catalog overrides from disk
    const overridesPath = path.join(process.cwd(), 'catalog_overrides.json');
    let priceOverrides: Record<string, any> = {};
    if (fs.existsSync(overridesPath)) {
      try {
        priceOverrides = JSON.parse(fs.readFileSync(overridesPath, 'utf8'));
      } catch {
        priceOverrides = {};
      }
    }

    let rawProducts: any[] = [];

    // 2. Query Supabase directly
    try {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('id', { ascending: true });

      if (!error && data && Array.isArray(data) && data.length > 0) {
        rawProducts = data;
      } else if (error) {
        console.error('Products route Supabase query error:', error.message);
      }
    } catch (e: any) {
      console.error('Products route catch error:', e?.message);
    }

    // 3. If Supabase returned empty, assemble from static definitions
    if (rawProducts.length === 0) {
      const readyProducts = READY_STOCK_PRODUCTS.map((p) => ({
        id: p.id,
        type: 'ready_stock',
        title: p.title,
        subtitle: p.subtitle,
        category: p.category,
        category_label: p.categoryLabel,
        image_url: p.image,
        tag: p.tag,
        price: p.price,
        deposit_price: p.depositPrice,
        cod_price: p.codPrice,
        stock_quantity: 5,
        in_stock: true,
      }));

      const persianProducts = PERSIAN_DESIGNS.map((p) => ({
        id: p.id,
        type: 'personalized',
        title: p.title,
        category: p.category,
        category_label: p.categoryLabel,
        image_url: p.image,
        price: 499,
        deposit_price: 49,
        cod_price: 450,
        stock_quantity: 10,
        in_stock: true,
      }));

      rawProducts = [...readyProducts, ...persianProducts];
    }

    // 4. Apply authoritative disk overrides (prices, deposit, cod, stock)
    const mergedProducts = rawProducts.map((p) => {
      const override = priceOverrides[p.id];
      if (override) {
        const price = override.price !== undefined ? Number(override.price) : p.price;
        const depositPrice = override.deposit_price !== undefined ? Number(override.deposit_price) : p.deposit_price;
        const codPrice = override.cod_price !== undefined ? Number(override.cod_price) : price - depositPrice;
        const stockQuantity = override.stock_quantity !== undefined ? Number(override.stock_quantity) : p.stock_quantity;
        const inStock = override.in_stock !== undefined ? Boolean(override.in_stock) : p.in_stock;

        return {
          ...p,
          price,
          deposit_price: depositPrice,
          cod_price: codPrice,
          stock_quantity: stockQuantity,
          in_stock: inStock,
        };
      }
      return p;
    });

    return NextResponse.json({
      success: true,
      products: mergedProducts,
      total: mergedProducts.length,
    });
  } catch (error: any) {
    console.error('API /api/products error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve products' },
      { status: 500 }
    );
  }
}
