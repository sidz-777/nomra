import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { createAdminClient } from '@/lib/supabase/admin';
import { READY_STOCK_PRODUCTS, PERSIAN_DESIGNS } from '@/lib/storefront-data';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const typeFilter = url.searchParams.get('type');
    const categoryFilter = url.searchParams.get('category');
    const showAll = url.searchParams.get('all') === 'true';

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
      let query = supabase.from('products').select('*');

      if (!showAll) {
        // Query active products; handle both null and true
        query = query.or('is_active.is.null,is_active.eq.true');
      }

      query = query.order('id', { ascending: true });

      const { data, error } = await query;

      if (!error && data && Array.isArray(data) && data.length > 0) {
        rawProducts = data;
      } else if (error) {
        // If is_active column doesn't exist yet, query without filter
        const fallbackRes = await supabase.from('products').select('*').order('id', { ascending: true });
        if (!fallbackRes.error && fallbackRes.data && Array.isArray(fallbackRes.data) && fallbackRes.data.length > 0) {
          rawProducts = fallbackRes.data;
        } else {
          console.error('Products route Supabase query error:', error.message);
        }
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
        is_active: true,
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
        is_active: true,
      }));

      rawProducts = [...readyProducts, ...persianProducts];
    }

    // 4. Apply authoritative disk overrides (prices, deposit, cod, stock, is_active)
    let mergedProducts = rawProducts.map((p) => {
      const override = priceOverrides[p.id];
      if (override) {
        const price = override.price !== undefined ? Number(override.price) : p.price;
        const depositPrice = override.deposit_price !== undefined ? Number(override.deposit_price) : p.deposit_price;
        const codPrice = override.cod_price !== undefined ? Number(override.cod_price) : price - depositPrice;
        const stockQuantity = override.stock_quantity !== undefined ? Number(override.stock_quantity) : p.stock_quantity;
        const inStock = override.in_stock !== undefined ? Boolean(override.in_stock) : p.in_stock;
        const isActive = override.is_active !== undefined ? Boolean(override.is_active) : (p.is_active !== false);

        return {
          ...p,
          price,
          deposit_price: depositPrice,
          cod_price: codPrice,
          stock_quantity: stockQuantity,
          in_stock: inStock,
          is_active: isActive,
        };
      }
      return {
        ...p,
        is_active: p.is_active !== false,
      };
    });

    // 4b. Merge any custom/new products in priceOverrides that aren't in rawProducts
    const rawIds = new Set(rawProducts.map((p) => p.id));
    Object.keys(priceOverrides).forEach((id) => {
      const item = priceOverrides[id];
      if (!rawIds.has(id) && item && item.title) {
        mergedProducts.push({
          id,
          ...item,
          is_active: item.is_active !== false,
        });
      }
    });

    // 5. Apply filters
    if (!showAll) {
      mergedProducts = mergedProducts.filter((p) => p.is_active !== false);
    }
    if (typeFilter) {
      mergedProducts = mergedProducts.filter((p) => p.type === typeFilter);
    }
    if (categoryFilter && categoryFilter !== 'all') {
      mergedProducts = mergedProducts.filter((p) => p.category === categoryFilter);
    }

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
