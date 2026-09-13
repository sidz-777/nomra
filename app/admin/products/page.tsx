'use client';

import React, { useState, useEffect } from 'react';
import AdminGuard from '@/components/admin/AdminGuard';
import AdminLayoutClient from '@/components/admin/AdminLayoutClient';

interface CatalogProduct {
  id: string;
  category: string;
  categoryLabel: string;
  title: string;
  image: string;
  price: number;
  deposit_price?: number;
  cod_price?: number;
  in_stock: boolean;
  stock_quantity: number;
  is_stock_managed?: boolean;
}

const DEFAULT_CATALOG: CatalogProduct[] = [
  { id: 'car-1', category: 'cars', categoryLabel: 'Supercars', title: 'Porsche 911 GT3 RS', image: 'car1.jpg', price: 499, in_stock: true, stock_quantity: 5 },
  { id: 'car-2', category: 'cars', categoryLabel: 'Supercars', title: 'BMW M5 F90 Black Edition', image: 'car2.jpg', price: 499, in_stock: true, stock_quantity: 5 },
  { id: 'car-3', category: 'cars', categoryLabel: 'Supercars', title: 'Porsche 911 GT3 Silver', image: 'car3.jpg', price: 499, in_stock: true, stock_quantity: 5 },
  { id: 'car-4', category: 'cars', categoryLabel: 'Supercars', title: 'BMW M8 Competition Coupé', image: 'car4.jpg', price: 499, in_stock: true, stock_quantity: 5 },
  { id: 'car-5', category: 'cars', categoryLabel: 'Supercars', title: 'Porsche 911 GT3 Rear Wing', image: 'car5.jpg', price: 499, in_stock: true, stock_quantity: 5 },
  { id: 'car-6', category: 'cars', categoryLabel: 'Supercars', title: 'Porsche GT3 RS White Frame', image: 'car6.jpg', price: 499, in_stock: true, stock_quantity: 5 },
  { id: 'car-7', category: 'cars', categoryLabel: 'Supercars', title: 'Porsche 911 GT3 RS Carbon Gray', image: 'car7.jpg', price: 499, in_stock: true, stock_quantity: 5 },
  { id: 'car-8', category: 'cars', categoryLabel: 'Supercars', title: 'Porsche 911 GT3 RS 3D Diecast', image: 'car8.jpg', price: 499, in_stock: true, stock_quantity: 5 },
  { id: 'car-9', category: 'cars', categoryLabel: 'Supercars', title: 'Ford Mustang 1964 Legendary', image: 'car9.jpg', price: 499, in_stock: true, stock_quantity: 5 },
  { id: 'car-11', category: 'cars', categoryLabel: 'Supercars', title: 'Porsche 911 RSR Triptych Wall Set', image: 'car11.jpg', price: 499, in_stock: true, stock_quantity: 5 },
  { id: 'sport-14', category: 'sports', categoryLabel: 'Sports Legends', title: 'Cristiano Ronaldo — CR7 1985', image: 'sport14.jpg', price: 499, in_stock: true, stock_quantity: 5 },
  { id: 'sport-3', category: 'sports', categoryLabel: 'Sports Legends', title: 'Lionel Messi — World Cup Triumph', image: 'sport3.jpg', price: 499, in_stock: true, stock_quantity: 5 },
  { id: 'sport-4', category: 'sports', categoryLabel: 'Sports Legends', title: 'Messi #10 Argentina Jersey Frame', image: 'sport4.jpg', price: 499, in_stock: true, stock_quantity: 5 },
  { id: 'sport-5', category: 'sports', categoryLabel: 'Sports Legends', title: 'Lionel Messi #10 Accolades', image: 'sport5.jpg', price: 499, in_stock: true, stock_quantity: 5 },
  { id: 'sport-10', category: 'sports', categoryLabel: 'Sports Legends', title: 'Messi #10 3D Layered Jersey', image: 'sport10.jpg', price: 499, in_stock: true, stock_quantity: 5 },
  { id: 'sport-1', category: 'sports', categoryLabel: 'Sports Legends', title: 'FC Barcelona Vintage Crest', image: 'sport1.jpg', price: 499, in_stock: true, stock_quantity: 5 },
  { id: 'sport-2', category: 'sports', categoryLabel: 'Sports Legends', title: 'Real Madrid — Hala Madrid', image: 'sport2.jpg', price: 499, in_stock: true, stock_quantity: 5 },
  { id: 'sport-13', category: 'sports', categoryLabel: 'Sports Legends', title: 'Jude Bellingham — England & Madrid', image: 'sport13.jpg', price: 499, in_stock: true, stock_quantity: 5 },
  { id: 'sport-9', category: 'sports', categoryLabel: 'Sports Legends', title: 'Neymar Jr #10 Brazil 3D Frame', image: 'sport9.jpg', price: 499, in_stock: true, stock_quantity: 5 },
  { id: 'sport-12', category: 'sports', categoryLabel: 'Sports Legends', title: 'Neymar Jr 1992 Brazil Signature', image: 'sport12.jpg', price: 499, in_stock: true, stock_quantity: 5 },
  { id: 'sport-15', category: 'sports', categoryLabel: 'Sports Legends', title: 'Neymar Jr — Santos FC Heritage', image: 'sport15.jpg', price: 499, in_stock: true, stock_quantity: 5 },
  { id: 'sport-6', category: 'sports', categoryLabel: 'Sports Legends', title: 'FC Barcelona Leather Grain', image: 'sport6.jpg', price: 499, in_stock: true, stock_quantity: 5 },
  { id: 'sport-11', category: 'sports', categoryLabel: 'Sports Legends', title: 'Força Barça — Més Que Un Club', image: 'sport11.jpg', price: 499, in_stock: true, stock_quantity: 5 },
  { id: 'sport-8', category: 'sports', categoryLabel: 'Sports Legends', title: 'Jamal Musiala #10 Germany DFB', image: 'sport8.jpg', price: 499, in_stock: true, stock_quantity: 5 },
  { id: 'pop-1', category: 'pop', categoryLabel: 'Pop Culture', title: 'Spider-Man: Into the Spider-Verse', image: 'sport16.jpg', price: 499, in_stock: true, stock_quantity: 5 },
  { id: 'pop-2', category: 'pop', categoryLabel: 'Motorsport', title: 'Lewis Hamilton #44 Mercedes F1', image: 'sport18.jpg', price: 499, in_stock: true, stock_quantity: 5 },
  { id: 'name-4', category: 'names', categoryLabel: 'Ready Names', title: 'Fatima (فاطمة) — Carpet Mosaic', image: 'name4.jpg', price: 499, in_stock: true, stock_quantity: 5 },
  { id: 'name-7', category: 'names', categoryLabel: 'Ready Names', title: 'Fatima (فاطمة) — Heritage Rug', image: 'name7.jpg', price: 499, in_stock: true, stock_quantity: 5 },
  { id: 'name-9', category: 'names', categoryLabel: 'Ready Names', title: 'Fatima (فاطمة) — Blush Floral', image: 'name9.png', price: 499, in_stock: true, stock_quantity: 5 },
  { id: 'name-10', category: 'names', categoryLabel: 'Ready Names', title: 'Fatima (فاطمة) — Royal Purple', image: 'name10.jpg', price: 499, in_stock: true, stock_quantity: 5 },
  { id: 'name-3', category: 'names', categoryLabel: 'Ready Names', title: 'Muhammad (محمد) — Kilim Rug', image: 'name3.jpg', price: 499, in_stock: true, stock_quantity: 5 },
  { id: 'name-8', category: 'names', categoryLabel: 'Ready Names', title: 'Ahmad (أحمد) — Handheld Photo', image: 'name8.jpg', price: 499, in_stock: true, stock_quantity: 5 },
  { id: 'name-6', category: 'names', categoryLabel: 'Ready Names', title: 'Maryam (مريم) — Jasmine Flower', image: 'name6.jpg', price: 499, in_stock: true, stock_quantity: 5 },
  { id: 'name-5', category: 'names', categoryLabel: 'Ready Names', title: 'Batool (بتول) — Crimson Tapestry', image: 'name5.jpg', price: 499, in_stock: true, stock_quantity: 5 },
  { id: 'name-2', category: 'names', categoryLabel: 'Ready Names', title: 'Rimsha (رمشا) — Floral "R"', image: 'name2.jpg', price: 499, in_stock: true, stock_quantity: 5 },
  { id: 'name-1', category: 'names', categoryLabel: 'Ready Names', title: 'Tayyiba (طيبة) — Persian Blue', image: 'name1.jpg', price: 499, in_stock: true, stock_quantity: 5 },
  { id: 'name-11', category: 'names', categoryLabel: 'Ready Names', title: 'Sabr (صبر - Patience)', image: 'name11.jpg', price: 499, in_stock: true, stock_quantity: 5 }
];

export default function AdminProductsPage() {
  const [products, setProducts] = useState<CatalogProduct[]>(DEFAULT_CATALOG);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [priceInputs, setPriceInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.products) && json.products.length > 0) {
            const mapped: CatalogProduct[] = json.products.map((p: any) => ({
              id: p.id,
              category: p.category || 'ready_stock',
              categoryLabel: p.category_label || p.category || 'Ready Stock',
              title: p.title,
              image: p.image_url || 'design1.jpg',
              price: parseFloat(p.price) || 499,
              deposit_price: parseFloat(p.deposit_price) || 49,
              cod_price: parseFloat(p.cod_price) || 450,
              in_stock: p.in_stock !== false,
              stock_quantity: p.stock_quantity !== undefined ? p.stock_quantity : (p.in_stock !== false ? 5 : 0),
              is_stock_managed: p.is_stock_managed,
            }));
            setProducts(mapped);
            const initialInputs: Record<string, string> = {};
            mapped.forEach((item) => {
              initialInputs[item.id] = item.price.toString();
            });
            setPriceInputs(initialInputs);
            return;
          }
        }
      } catch (err) {
        console.warn('Could not fetch /api/products, using default catalog:', err);
      }

      const initialInputs: Record<string, string> = {};
      DEFAULT_CATALOG.forEach((item) => {
        initialInputs[item.id] = item.price.toString();
      });
      setPriceInputs(initialInputs);
    }

    loadProducts();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handlePriceChange = (id: string, val: string) => {
    setPriceInputs((prev) => ({ ...prev, [id]: val }));
  };

  const saveProductPrice = async (id: string) => {
    const rawVal = priceInputs[id] ?? '';
    const newPrice = parseFloat(rawVal.trim());

    if (isNaN(newPrice) || newPrice <= 0 || !isFinite(newPrice)) {
      alert('Please enter a valid positive price greater than 0.');
      return;
    }

    setSavingId(id);

    try {
      const res = await fetch('/api/admin/update-product-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: id, price: newPrice }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setProducts((prev) =>
          prev.map((item) =>
            item.id === id
              ? { ...item, price: newPrice, cod_price: newPrice - (item.deposit_price || 49) }
              : item
          )
        );
        showToast(
          data.db_persisted
            ? `✅ Price saved & verified in database: ₹${newPrice}`
            : `⚠️ Price saved in server catalog overrides: ₹${newPrice}`
        );
      } else {
        throw new Error(data?.error || 'Failed to update price');
      }
    } catch (err: any) {
      console.error('Error saving price:', err);
      showToast(`❌ Error saving price: ${err?.message || 'Server error'}`);
    } finally {
      setSavingId(null);
    }
  };

  const toggleStockStatus = (id: string) => {
    setProducts((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const newInStock = !item.in_stock;
        const newQty = newInStock ? (item.stock_quantity > 0 ? item.stock_quantity : 5) : 0;
        showToast(`Stock status updated for "${item.title}"`);
        return { ...item, in_stock: newInStock, stock_quantity: newQty };
      })
    );
  };

  const adjustStock = (id: string, delta: number) => {
    setProducts((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const newQty = Math.max(0, item.stock_quantity + delta);
        showToast(`Stock updated for "${item.title}": ${newQty} units`);
        return { ...item, stock_quantity: newQty, in_stock: newQty > 0 };
      })
    );
  };

  const filteredProducts =
    selectedCategory === 'all'
      ? products
      : products.filter((p) => p.category === selectedCategory);

  const countAll = products.length;
  const countCars = products.filter((p) => p.category === 'cars').length;
  const countSports = products.filter((p) => p.category === 'sports').length;
  const countNames = products.filter((p) => p.category === 'names').length;
  const countPop = products.filter((p) => p.category === 'pop').length;

  return (
    <AdminGuard>
      <AdminLayoutClient title="Frame Catalog &amp; Inventory">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#1A1816] border border-[#D4AF6A] text-[#F5EFE6] px-4 py-3 rounded-lg shadow-2xl text-xs font-mono animate-fade-in flex items-center gap-2">
            {toastMessage}
          </div>
        )}

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-medium transition-all ${
              selectedCategory === 'all'
                ? 'bg-[#D4AF6A] text-[#141210]'
                : 'bg-[#1A1816] border border-[#2D2722] text-[#A39684] hover:text-[#F5EFE6]'
            }`}
          >
            All Products ({countAll})
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('cars')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-medium transition-all ${
              selectedCategory === 'cars'
                ? 'bg-[#D4AF6A] text-[#141210]'
                : 'bg-[#1A1816] border border-[#2D2722] text-[#A39684] hover:text-[#F5EFE6]'
            }`}
          >
            🏎️ Supercars ({countCars})
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('sports')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-medium transition-all ${
              selectedCategory === 'sports'
                ? 'bg-[#D4AF6A] text-[#141210]'
                : 'bg-[#1A1816] border border-[#2D2722] text-[#A39684] hover:text-[#F5EFE6]'
            }`}
          >
            ⚽ Sports ({countSports})
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('names')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-medium transition-all ${
              selectedCategory === 'names'
                ? 'bg-[#D4AF6A] text-[#141210]'
                : 'bg-[#1A1816] border border-[#2D2722] text-[#A39684] hover:text-[#F5EFE6]'
            }`}
          >
            ✒️ Ready Names ({countNames})
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('pop')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-medium transition-all ${
              selectedCategory === 'pop'
                ? 'bg-[#D4AF6A] text-[#141210]'
                : 'bg-[#1A1816] border border-[#2D2722] text-[#A39684] hover:text-[#F5EFE6]'
            }`}
          >
            🎬 Pop Culture ({countPop})
          </button>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredProducts.map((p) => {
            const qty = p.stock_quantity !== undefined ? p.stock_quantity : (p.in_stock ? 5 : 0);
            const isSaving = savingId === p.id;
            const imgSrc = p.image.startsWith('/') || p.image.startsWith('http') ? p.image : `/${p.image}`;

            return (
              <div
                key={p.id}
                className="bg-[#1A1816] border border-[#2D2722] hover:border-[#D4AF6A]/50 rounded-xl overflow-hidden flex flex-col transition-all"
              >
                {/* Thumbnail Box */}
                <div className="w-full aspect-[4/5] bg-black relative overflow-hidden">
                  <span
                    className={`absolute top-2.5 left-2.5 z-10 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase ${
                      p.in_stock && qty > 0
                        ? 'bg-emerald-500 text-black'
                        : 'bg-red-500 text-white'
                    }`}
                  >
                    {p.in_stock && qty > 0 ? `In Stock (${qty})` : 'Out of Stock'}
                  </span>
                  <img
                    src={imgSrc}
                    alt={p.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/design1.jpg';
                    }}
                  />
                </div>

                {/* Card Body */}
                <div className="p-4 flex flex-col flex-1">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#D4AF6A] mb-1">
                    {p.categoryLabel}
                  </div>
                  <div className="font-semibold text-sm text-[#F5EFE6] line-clamp-1 mb-3">
                    {p.title}
                  </div>

                  {/* Price & Stock Row */}
                  <div className="mt-auto pt-3 border-t border-[#2D2722] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[#D4AF6A] text-sm">₹</span>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={priceInputs[p.id] ?? p.price}
                        onChange={(e) => handlePriceChange(p.id, e.target.value)}
                        className="w-16 px-1.5 py-1 bg-[#0E0D0C] border border-[#2D2722] focus:border-[#D4AF6A] rounded text-xs font-mono font-bold text-[#D4AF6A] outline-none"
                      />
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => saveProductPrice(p.id)}
                        className="px-2 py-1 bg-[#0E0D0C] hover:bg-[#D4AF6A] border border-[#D4AF6A] hover:text-[#141210] text-[#D4AF6A] text-[11px] font-mono font-semibold rounded transition-all disabled:opacity-50"
                      >
                        {isSaving ? '...' : 'Save'}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleStockStatus(p.id)}
                      className="px-2 py-1 bg-[#0E0D0C] border border-[#2D2722] hover:border-[#D4AF6A] text-[#A39684] hover:text-[#D4AF6A] text-[10px] font-mono rounded transition-all"
                    >
                      {p.in_stock && qty > 0 ? 'Mark Out' : 'Mark In'}
                    </button>
                  </div>

                  {/* Stock Quick Actions */}
                  <div className="flex gap-2 mt-3 pt-2.5 border-t border-dashed border-[#2D2722]">
                    <button
                      type="button"
                      onClick={() => adjustStock(p.id, 5)}
                      className="flex-1 py-1 text-center bg-[#0E0D0C] hover:bg-[#221F1C] border border-[#2D2722] text-[#A39684] hover:text-[#F5EFE6] text-[10px] font-mono rounded transition-all"
                    >
                      +5 Restock
                    </button>
                    <button
                      type="button"
                      disabled={qty <= 0}
                      onClick={() => adjustStock(p.id, -1)}
                      className="flex-1 py-1 text-center bg-[#0E0D0C] hover:bg-[#221F1C] border border-[#2D2722] text-[#A39684] hover:text-[#F5EFE6] text-[10px] font-mono rounded transition-all disabled:opacity-30"
                    >
                      -1 Sold
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </AdminLayoutClient>
    </AdminGuard>
  );
}
