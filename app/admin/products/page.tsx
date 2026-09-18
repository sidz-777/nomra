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

export default function AdminProductsPage() {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [priceInputs, setPriceInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      setLoadError(null);
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
          } else {
            setLoadError('No products returned from the product catalog service.');
          }
        } else {
          setLoadError(`Catalog service error: HTTP ${res.status}`);
        }
      } catch (err: any) {
        setLoadError('Failed to communicate with catalog service. Database or network error.');
      } finally {
        setLoading(false);
      }
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

  const handleSavePrice = async (id: string) => {
    const rawVal = priceInputs[id];
    const newPrice = parseFloat(rawVal);

    if (isNaN(newPrice) || newPrice <= 0) {
      showToast('⚠️ Please enter a valid price greater than 0');
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

  const toggleStockStatus = async (id: string) => {
    const item = products.find((p) => p.id === id);
    if (!item) return;
    const newInStock = !item.in_stock;
    const newQty = newInStock ? (item.stock_quantity > 0 ? item.stock_quantity : 5) : 0;

    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, in_stock: newInStock, stock_quantity: newQty } : p))
    );

    try {
      const res = await fetch('/api/admin/adjust-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: id, in_stock: newInStock, stock_quantity: newQty }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`✅ Stock updated: ${newQty} units (in_stock: ${newInStock})`);
      } else {
        throw new Error(data?.error || 'Failed to persist stock');
      }
    } catch (err: any) {
      showToast(`⚠️ Error saving stock: ${err?.message}`);
    }
  };

  const adjustStockQuantity = async (id: string, delta: number) => {
    const item = products.find((p) => p.id === id);
    if (!item) return;
    const newQty = Math.max(0, item.stock_quantity + delta);
    const newInStock = newQty > 0;

    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, stock_quantity: newQty, in_stock: newInStock } : p))
    );

    try {
      const res = await fetch('/api/admin/adjust-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: id, stock_quantity: newQty }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`✅ Stock updated & saved in database: ${newQty} units`);
      } else {
        throw new Error(data?.error || 'Failed to persist stock');
      }
    } catch (err: any) {
      showToast(`⚠️ Error saving stock: ${err?.message}`);
    }
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

        {/* Error Banner */}
        {loadError && (
          <div className="mb-6 p-4 rounded-lg bg-red-950/40 border border-red-800 text-red-300 text-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-red-400 font-bold">⚠️ Catalog Error:</span>
              <span>{loadError}</span>
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-3 py-1 bg-red-900/60 hover:bg-red-800 text-red-200 text-xs rounded transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="mb-6 p-8 text-center text-[#A39684] text-sm font-mono border border-[#2D2722] rounded-xl bg-[#1A1816]/40">
            <span className="animate-pulse">Loading authoritative product catalog...</span>
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
            Supercars ({countCars})
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
            Sports ({countSports})
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
            Ready Names ({countNames})
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
            Pop &amp; F1 ({countPop})
          </button>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map((p) => {
            const isSaving = savingId === p.id;
            const currentInputValue = priceInputs[p.id] ?? p.price.toString();
            const hasChanged = parseFloat(currentInputValue) !== p.price && !isNaN(parseFloat(currentInputValue));

            return (
              <div
                key={p.id}
                className="bg-[#1A1816] border border-[#2D2722] rounded-xl overflow-hidden hover:border-[#D4AF6A]/30 transition-all flex flex-col justify-between"
              >
                <div className="p-4 flex gap-4 items-start">
                  <div className="w-20 h-28 bg-[#141210] rounded-lg overflow-hidden border border-[#2D2722] flex-shrink-0 relative">
                    <img
                      src={p.image.startsWith('/') ? p.image : `/${p.image}`}
                      alt={p.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute top-1 left-1 bg-[#141210]/90 px-1.5 py-0.5 rounded text-[9px] font-mono text-[#D4AF6A] border border-[#D4AF6A]/20">
                      A4
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#2D2722] text-[#A39684]">
                        {p.categoryLabel}
                      </span>
                      <span className="text-[10px] font-mono text-[#736B5E] truncate">
                        ID: {p.id}
                      </span>
                    </div>

                    <h4 className="text-sm font-serif font-medium text-[#F5EFE6] truncate mb-2" title={p.title}>
                      {p.title}
                    </h4>

                    {/* Stock status toggle & count */}
                    <div className="flex items-center gap-2 mb-3">
                      <button
                        type="button"
                        onClick={() => toggleStockStatus(p.id)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-medium border transition ${
                          p.in_stock
                            ? 'bg-emerald-950/40 border-emerald-800 text-emerald-400 hover:bg-emerald-900/60'
                            : 'bg-red-950/40 border-red-800 text-red-400 hover:bg-red-900/60'
                        }`}
                      >
                        {p.in_stock ? '● In Stock' : '○ Out of Stock'}
                      </button>

                      {/* Quantity stepper */}
                      <div className="flex items-center gap-1 bg-[#141210] border border-[#2D2722] rounded px-1.5 py-0.5">
                        <button
                          type="button"
                          onClick={() => adjustStockQuantity(p.id, -1)}
                          className="text-[#A39684] hover:text-[#F5EFE6] text-xs px-1"
                          title="Decrease stock"
                        >
                          -
                        </button>
                        <span className="text-[11px] font-mono text-[#F5EFE6] px-1 font-semibold">
                          {p.stock_quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => adjustStockQuantity(p.id, 1)}
                          className="text-[#A39684] hover:text-[#F5EFE6] text-xs px-1"
                          title="Increase stock"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Price editor footer */}
                <div className="bg-[#141210] border-t border-[#2D2722] px-4 py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-[#A39684]">Price (₹):</span>
                    <input
                      type="number"
                      value={currentInputValue}
                      onChange={(e) => handlePriceChange(p.id, e.target.value)}
                      className="w-20 bg-[#1A1816] border border-[#2D2722] rounded px-2 py-1 text-xs font-mono text-[#F5EFE6] focus:border-[#D4AF6A] focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-[10px] font-mono text-[#736B5E] text-right">
                      <div>Dep: ₹{p.deposit_price || 49}</div>
                      <div>COD: ₹{p.cod_price || (p.price - 49)}</div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSavePrice(p.id)}
                      disabled={isSaving || !hasChanged}
                      className={`px-3 py-1 rounded text-xs font-mono font-medium transition ${
                        hasChanged
                          ? 'bg-[#D4AF6A] text-[#141210] hover:bg-[#E0C082] shadow-sm'
                          : 'bg-[#2D2722] text-[#736B5E] cursor-not-allowed'
                      }`}
                    >
                      {isSaving ? 'Saving...' : 'Save'}
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
