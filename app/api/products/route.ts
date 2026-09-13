import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { READY_STOCK_PRODUCTS, PERSIAN_DESIGNS } from '@/lib/storefront-data';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. First attempt to proxy from authoritative backend server (port 3300)
    try {
      const backendRes = await fetch('http://localhost:3300/api/products', {
        cache: 'no-store',
      });
      if (backendRes.ok) {
        const data = await backendRes.json();
        if (data && data.success && Array.isArray(data.products) && data.products.length > 0) {
          return NextResponse.json(data);
        }
      }
    } catch {
      // Backend proxy fallback
    }

    // 2. Direct fallback reading catalog_overrides.json from disk
    const overridesPath = path.join(process.cwd(), 'catalog_overrides.json');
    let priceOverrides: Record<string, any> = {};
    if (fs.existsSync(overridesPath)) {
      try {
        priceOverrides = JSON.parse(fs.readFileSync(overridesPath, 'utf8'));
      } catch {
        priceOverrides = {};
      }
    }

    // Construct full product list from ready stock + persian designs
    const readyProducts = READY_STOCK_PRODUCTS.map((p) => {
      const override = priceOverrides[p.id];
      const price = override?.price !== undefined ? Number(override.price) : p.price;
      const depositPrice = override?.deposit_price !== undefined ? Number(override.deposit_price) : p.depositPrice;
      const codPrice = override?.cod_price !== undefined ? Number(override.codPrice) : price - depositPrice;

      return {
        id: p.id,
        type: 'ready_stock',
        title: p.title,
        subtitle: p.subtitle,
        category: p.category,
        category_label: p.categoryLabel,
        image_url: p.image,
        tag: p.tag,
        price,
        deposit_price: depositPrice,
        cod_price: codPrice,
        in_stock: true,
      };
    });

    const persianProducts = PERSIAN_DESIGNS.map((p) => {
      const override = priceOverrides[p.id];
      const price = override?.price !== undefined ? Number(override.price) : 499;
      const depositPrice = override?.deposit_price !== undefined ? Number(override.deposit_price) : 49;
      const codPrice = override?.cod_price !== undefined ? Number(override.cod_price) : price - depositPrice;

      return {
        id: p.id,
        type: 'personalized',
        title: p.title,
        category: p.category,
        category_label: p.categoryLabel,
        image_url: p.image,
        price,
        deposit_price: depositPrice,
        cod_price: codPrice,
        in_stock: true,
      };
    });

    const allProducts = [...readyProducts, ...persianProducts];

    return NextResponse.json({
      success: true,
      products: allProducts,
      total: allProducts.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch catalog' },
      { status: 500 }
    );
  }
}
