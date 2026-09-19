'use client';

import React, { useState, useEffect } from 'react';
import AdminGuard from '@/components/admin/AdminGuard';
import AdminLayoutClient from '@/components/admin/AdminLayoutClient';

interface CatalogProduct {
  id: string;
  slug?: string;
  sku?: string;
  category: string;
  categoryLabel: string;
  title: string;
  subtitle?: string;
  description?: string;
  image: string;
  gallery_images?: string[];
  video_url?: string;
  price: number;
  compare_at_price?: number | null;
  deposit_price?: number;
  cod_price?: number;
  in_stock: boolean;
  stock_quantity: number;
  is_featured?: boolean;
  is_active?: boolean;
  type?: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [priceInputs, setPriceInputs] = useState<Record<string, string>>({});

  // Modal states
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<CatalogProduct | null>(null);
  const [modalSubmitting, setModalSubmitting] = useState<boolean>(false);

  // Form state for Add/Edit
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    subtitle: '',
    description: '',
    type: 'ready_stock',
    category: 'cars',
    category_label: 'Supercars & Autos',
    image_url: '/assets/products/car-1.jpg',
    price: '499',
    compare_at_price: '',
    deposit_price: '49',
    stock_quantity: '5',
    in_stock: true,
    is_featured: false,
    is_active: true,
  });

  const loadProducts = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch('/api/products?all=true');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.products)) {
          const mapped: CatalogProduct[] = json.products.map((p: any) => ({
            id: p.id,
            slug: p.slug,
            sku: p.sku,
            type: p.type || 'ready_stock',
            category: p.category || 'ready_stock',
            categoryLabel: p.category_label || p.category || 'Ready Stock',
            title: p.title,
            subtitle: p.subtitle || '',
            description: p.description || '',
            image: p.image_url || p.image || 'design1.jpg',
            price: parseFloat(p.price) || 499,
            compare_at_price: p.compare_at_price ? parseFloat(p.compare_at_price) : null,
            deposit_price: parseFloat(p.deposit_price) || 49,
            cod_price: parseFloat(p.cod_price) || 450,
            in_stock: p.in_stock !== false,
            stock_quantity: p.stock_quantity !== undefined ? p.stock_quantity : (p.in_stock !== false ? 5 : 0),
            is_featured: Boolean(p.is_featured),
            is_active: p.is_active !== false,
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
  };

  useEffect(() => {
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
      const res = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, price: newPrice }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setProducts((prev) =>
          prev.map((item) =>
            item.id === id
              ? { ...item, price: newPrice, cod_price: Math.max(0, newPrice - (item.deposit_price || 49)) }
              : item
          )
        );
        showToast(
          data.db_persisted
            ? `✅ Price saved to database: ₹${newPrice}`
            : `⚠️ Price saved in catalog overrides: ₹${newPrice}`
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
        showToast(`✅ Stock updated: ${newQty} units (${newInStock ? 'In Stock' : 'Out of Stock'})`);
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
        showToast(`✅ Stock updated & saved: ${newQty} units`);
      } else {
        throw new Error(data?.error || 'Failed to persist stock');
      }
    } catch (err: any) {
      showToast(`⚠️ Error saving stock: ${err?.message}`);
    }
  };

  const handleDuplicate = async (id: string) => {
    setActionLoadingId(id);
    try {
      const res = await fetch('/api/admin/products/duplicate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: id }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.product) {
        showToast(`✅ Duplicated: ${data.product.title}`);
        await loadProducts();
      } else {
        throw new Error(data?.error || 'Duplicate failed');
      }
    } catch (err: any) {
      showToast(`❌ Error: ${err?.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleArchive = async (id: string, currentlyActive: boolean) => {
    setActionLoadingId(id);
    const nextActive = !currentlyActive;
    try {
      const res = await fetch('/api/admin/products/archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: id, is_active: nextActive }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, is_active: nextActive } : p))
        );
        showToast(
          nextActive
            ? '✅ Product restored & active on storefront'
            : '📦 Product archived (hidden from storefront)'
        );
      } else {
        throw new Error(data?.error || 'Archive action failed');
      }
    } catch (err: any) {
      showToast(`❌ Error: ${err?.message}`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const openAddModal = () => {
    setFormData({
      id: '',
      title: '',
      subtitle: '',
      description: '',
      type: 'ready_stock',
      category: 'cars',
      category_label: 'Supercars & Autos',
      image_url: '/assets/products/car-1.jpg',
      price: '499',
      compare_at_price: '',
      deposit_price: '49',
      stock_quantity: '5',
      in_stock: true,
      is_featured: false,
      is_active: true,
    });
    setEditingProduct(null);
    setShowAddModal(true);
  };

  const openEditModal = (p: CatalogProduct) => {
    setFormData({
      id: p.id,
      title: p.title,
      subtitle: p.subtitle || '',
      description: p.description || '',
      type: p.type || 'ready_stock',
      category: p.category,
      category_label: p.categoryLabel,
      image_url: p.image,
      price: p.price.toString(),
      compare_at_price: p.compare_at_price ? p.compare_at_price.toString() : '',
      deposit_price: (p.deposit_price || 49).toString(),
      stock_quantity: p.stock_quantity.toString(),
      in_stock: p.in_stock,
      is_featured: Boolean(p.is_featured),
      is_active: p.is_active !== false,
    });
    setEditingProduct(p);
    setShowAddModal(true);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalSubmitting(true);

    try {
      const isEditing = Boolean(editingProduct);
      const endpoint = '/api/admin/products';
      const method = isEditing ? 'PUT' : 'POST';

      const payload: Record<string, any> = {
        title: formData.title,
        subtitle: formData.subtitle,
        description: formData.description,
        type: formData.type,
        category: formData.category,
        category_label: formData.category_label,
        image_url: formData.image_url,
        price: parseFloat(formData.price),
        compare_at_price: formData.compare_at_price ? parseFloat(formData.compare_at_price) : null,
        deposit_price: parseFloat(formData.deposit_price) || 49,
        stock_quantity: parseInt(formData.stock_quantity, 10) || 0,
        in_stock: formData.in_stock,
        is_featured: formData.is_featured,
        is_active: formData.is_active,
      };

      if (isEditing) {
        payload.id = editingProduct!.id;
      } else if (formData.id.trim()) {
        payload.id = formData.id.trim();
      }

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(isEditing ? '✅ Product updated successfully' : '✅ Product created successfully');
        setShowAddModal(false);
        await loadProducts();
      } else {
        throw new Error(data?.error || 'Operation failed');
      }
    } catch (err: any) {
      showToast(`❌ Error: ${err?.message}`);
    } finally {
      setModalSubmitting(false);
    }
  };

  // Filtered list
  const filteredProducts = products.filter((p) => {
    // Category filter
    if (selectedCategory !== 'all' && p.category !== selectedCategory) {
      return false;
    }
    // Status filter
    if (statusFilter === 'active' && p.is_active === false) {
      return false;
    }
    if (statusFilter === 'archived' && p.is_active !== false) {
      return false;
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchId = p.id.toLowerCase().includes(q);
      const matchCategory = p.categoryLabel.toLowerCase().includes(q);
      return matchTitle || matchId || matchCategory;
    }
    return true;
  });

  const countAll = products.length;
  const countActive = products.filter((p) => p.is_active !== false).length;
  const countArchived = products.filter((p) => p.is_active === false).length;

  return (
    <AdminGuard>
      <AdminLayoutClient title="Product Catalog &amp; CMS">
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
              onClick={loadProducts}
              className="px-3 py-1 bg-red-900/60 hover:bg-red-800 text-red-200 text-xs rounded transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* Action Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-serif font-medium text-[#F5EFE6]">
              Products &amp; Inventory ({products.length})
            </h3>
            <p className="text-xs text-[#A39684] mt-0.5 font-mono">
              Manage live storefront editions, prices, stock levels, and archival state.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={openAddModal}
              className="px-4 py-2 bg-[#D4AF6A] text-[#141210] hover:bg-[#E0C082] rounded-lg text-xs font-mono font-semibold transition flex items-center gap-2 shadow-sm"
            >
              <span>+</span>
              <span>Add Product</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-[#141210] border border-[#2D2722] rounded-xl p-4 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition ${
                selectedCategory === 'all'
                  ? 'bg-[#D4AF6A] text-[#141210]'
                  : 'bg-[#1A1816] text-[#A39684] hover:text-[#F5EFE6]'
              }`}
            >
              All ({countAll})
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('cars')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition ${
                selectedCategory === 'cars'
                  ? 'bg-[#D4AF6A] text-[#141210]'
                  : 'bg-[#1A1816] text-[#A39684] hover:text-[#F5EFE6]'
              }`}
            >
              🏎️ Autos
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('sports')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition ${
                selectedCategory === 'sports'
                  ? 'bg-[#D4AF6A] text-[#141210]'
                  : 'bg-[#1A1816] text-[#A39684] hover:text-[#F5EFE6]'
              }`}
            >
              ⚽ Sports
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('names')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition ${
                selectedCategory === 'names'
                  ? 'bg-[#D4AF6A] text-[#141210]'
                  : 'bg-[#1A1816] text-[#A39684] hover:text-[#F5EFE6]'
              }`}
            >
              ✒️ Names
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('pop')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition ${
                selectedCategory === 'pop'
                  ? 'bg-[#D4AF6A] text-[#141210]'
                  : 'bg-[#1A1816] text-[#A39684] hover:text-[#F5EFE6]'
              }`}
            >
              🎬 Pop
            </button>
          </div>

          {/* Status filter & Search Input */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              aria-label="Filter products by status"
              className="bg-[#1A1816] border border-[#2D2722] rounded-lg px-3 py-1.5 text-xs font-mono text-[#F5EFE6] focus:border-[#D4AF6A] focus:outline-none"
            >
              <option value="all">All Status ({countAll})</option>
              <option value="active">Active Only ({countActive})</option>
              <option value="archived">Archived ({countArchived})</option>
            </select>

            <div className="relative flex-1 md:w-56">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#1A1816] border border-[#2D2722] rounded-lg pl-3 pr-8 py-1.5 text-xs font-mono text-[#F5EFE6] placeholder-[#736B5E] focus:border-[#D4AF6A] focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search query"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#736B5E] hover:text-[#F5EFE6] text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className="mb-6 p-8 text-center text-[#A39684] text-sm font-mono border border-[#2D2722] rounded-xl bg-[#1A1816]/40">
            <span className="animate-pulse">Loading authoritative product catalog...</span>
          </div>
        )}

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map((p) => {
            const isSaving = savingId === p.id;
            const isActing = actionLoadingId === p.id;
            const currentInputValue = priceInputs[p.id] ?? p.price.toString();
            const hasChanged = parseFloat(currentInputValue) !== p.price && !isNaN(parseFloat(currentInputValue));
            const isArchived = p.is_active === false;

            return (
              <div
                key={p.id}
                className={`bg-[#1A1816] border rounded-xl overflow-hidden transition-all flex flex-col justify-between ${
                  isArchived
                    ? 'border-red-950/60 opacity-75'
                    : 'border-[#2D2722] hover:border-[#D4AF6A]/30'
                }`}
              >
                <div>
                  {/* Card Header Top */}
                  <div className="p-4 flex gap-4 items-start">
                    <div className="w-20 h-28 bg-[#141210] rounded-lg overflow-hidden border border-[#2D2722] flex-shrink-0 relative">
                      <img
                        src={p.image.startsWith('http') || p.image.startsWith('/') ? p.image : `/${p.image}`}
                        alt={p.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute top-1 left-1 bg-[#141210]/90 px-1.5 py-0.5 rounded text-[9px] font-mono text-[#D4AF6A] border border-[#D4AF6A]/20">
                        A4
                      </div>
                      {isArchived && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[10px] font-mono font-bold text-red-400">
                          ARCHIVED
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#2D2722] text-[#A39684]">
                          {p.categoryLabel}
                        </span>
                        <span className="text-[10px] font-mono text-[#736B5E] truncate">
                          {p.id}
                        </span>
                      </div>

                      <h4 className="text-sm font-serif font-medium text-[#F5EFE6] truncate mb-1" title={p.title}>
                        {p.title}
                      </h4>
                      {p.subtitle && (
                        <div className="text-[11px] text-[#A39684] truncate mb-2">{p.subtitle}</div>
                      )}

                      {/* Stock status toggle & count */}
                      <div className="flex items-center gap-2 mb-2">
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

                  {/* Actions Bar */}
                  <div className="px-4 pb-3 flex items-center justify-between border-t border-[#2D2722]/60 pt-2.5">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(p)}
                        className="px-2.5 py-1 bg-[#2D2722] hover:bg-[#3D352E] text-[#F5EFE6] rounded text-[11px] font-mono transition"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDuplicate(p.id)}
                        disabled={isActing}
                        className="px-2.5 py-1 bg-[#2D2722] hover:bg-[#3D352E] text-[#A39684] hover:text-[#F5EFE6] rounded text-[11px] font-mono transition"
                      >
                        📋 Copy
                      </button>
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={() => handleToggleArchive(p.id, p.is_active !== false)}
                        disabled={isActing}
                        className={`px-2.5 py-1 rounded text-[11px] font-mono transition ${
                          isArchived
                            ? 'bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/60 border border-emerald-800'
                            : 'bg-red-950/30 text-red-300 hover:bg-red-900/40 border border-red-900/50'
                        }`}
                      >
                        {isArchived ? '↺ Restore' : '📦 Archive'}
                      </button>
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

        {/* ADD / EDIT MODAL */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-[#141210] border border-[#2D2722] rounded-xl w-full max-w-2xl my-8 overflow-hidden shadow-2xl animate-fade-in">
              {/* Modal Header */}
              <div className="p-5 border-b border-[#2D2722] flex items-center justify-between">
                <div>
                  <h3 className="text-base font-serif font-semibold text-[#F5EFE6]">
                    {editingProduct ? `Edit Product: ${editingProduct.id}` : 'Create New Product Edition'}
                  </h3>
                  <p className="text-xs text-[#A39684] font-mono mt-0.5">
                    {editingProduct
                      ? 'Update product details, pricing, and availability.'
                      : 'Add a new frame edition to the live customer catalog.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="text-[#A39684] hover:text-[#F5EFE6] text-lg font-mono p-1"
                >
                  ✕
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleModalSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-[#A39684] mb-1">
                      Product Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. Royal Emerald Calligraphy Frame"
                      className="w-full bg-[#1A1816] border border-[#2D2722] rounded-lg px-3 py-2 text-xs font-mono text-[#F5EFE6] focus:border-[#D4AF6A] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-[#A39684] mb-1">
                      Custom ID / SKU (optional)
                    </label>
                    <input
                      type="text"
                      disabled={Boolean(editingProduct)}
                      value={formData.id}
                      onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                      placeholder="Auto-generated if empty"
                      className="w-full bg-[#1A1816] border border-[#2D2722] rounded-lg px-3 py-2 text-xs font-mono text-[#F5EFE6] focus:border-[#D4AF6A] focus:outline-none disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-[#A39684] mb-1">
                      Subtitle / Tagline
                    </label>
                    <input
                      type="text"
                      value={formData.subtitle}
                      onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                      placeholder="e.g. Porsche 911 GT3 RS Special Edition"
                      className="w-full bg-[#1A1816] border border-[#2D2722] rounded-lg px-3 py-2 text-xs font-mono text-[#F5EFE6] focus:border-[#D4AF6A] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-[#A39684] mb-1">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => {
                        const cat = e.target.value;
                        const labelMap: Record<string, string> = {
                          cars: 'Supercars & Autos',
                          sports: 'Sports Champions',
                          names: 'Ready Names & Faith',
                          pop: 'Pop Culture & F1',
                          custom: 'Special Edition',
                        };
                        setFormData({
                          ...formData,
                          category: cat,
                          category_label: labelMap[cat] || cat,
                        });
                      }}
                      className="w-full bg-[#1A1816] border border-[#2D2722] rounded-lg px-3 py-2 text-xs font-mono text-[#F5EFE6] focus:border-[#D4AF6A] focus:outline-none"
                    >
                      <option value="cars">Supercars &amp; Autos</option>
                      <option value="sports">Sports Champions</option>
                      <option value="names">Ready Names &amp; Faith</option>
                      <option value="pop">Pop Culture &amp; F1</option>
                      <option value="custom">Special Edition</option>
                    </select>
                  </div>
                </div>

                {/* Price, Compare Price, Deposit */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-[#A39684] mb-1">
                      Price (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full bg-[#1A1816] border border-[#2D2722] rounded-lg px-3 py-2 text-xs font-mono text-[#F5EFE6] focus:border-[#D4AF6A] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-[#A39684] mb-1">
                      Compare-at Price (₹)
                    </label>
                    <input
                      type="number"
                      value={formData.compare_at_price}
                      onChange={(e) => setFormData({ ...formData, compare_at_price: e.target.value })}
                      placeholder="e.g. 999 (crossed out)"
                      className="w-full bg-[#1A1816] border border-[#2D2722] rounded-lg px-3 py-2 text-xs font-mono text-[#F5EFE6] focus:border-[#D4AF6A] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-[#A39684] mb-1">
                      Advance Deposit (₹)
                    </label>
                    <input
                      type="number"
                      value={formData.deposit_price}
                      onChange={(e) => setFormData({ ...formData, deposit_price: e.target.value })}
                      className="w-full bg-[#1A1816] border border-[#2D2722] rounded-lg px-3 py-2 text-xs font-mono text-[#F5EFE6] focus:border-[#D4AF6A] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Image URL & Stock */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-mono text-[#A39684] mb-1">
                      Image URL or Path *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      placeholder="/assets/products/car-1.jpg or CDN link"
                      className="w-full bg-[#1A1816] border border-[#2D2722] rounded-lg px-3 py-2 text-xs font-mono text-[#F5EFE6] focus:border-[#D4AF6A] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-[#A39684] mb-1">
                      Stock Quantity
                    </label>
                    <input
                      type="number"
                      value={formData.stock_quantity}
                      onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                      className="w-full bg-[#1A1816] border border-[#2D2722] rounded-lg px-3 py-2 text-xs font-mono text-[#F5EFE6] focus:border-[#D4AF6A] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-mono text-[#A39684] mb-1">
                    Product Description (optional)
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Crafted with museum-grade acrylic glass, luxury satin finish, and precision hanging hooks."
                    className="w-full bg-[#1A1816] border border-[#2D2722] rounded-lg px-3 py-2 text-xs font-mono text-[#F5EFE6] focus:border-[#D4AF6A] focus:outline-none"
                  />
                </div>

                {/* Checkbox Toggles */}
                <div className="flex flex-wrap items-center gap-6 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.in_stock}
                      onChange={(e) => setFormData({ ...formData, in_stock: e.target.checked })}
                      className="rounded border-[#2D2722] bg-[#1A1816] text-[#D4AF6A] focus:ring-0"
                    />
                    <span className="text-xs font-mono text-[#F5EFE6]">In Stock (Purchasable)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="rounded border-[#2D2722] bg-[#1A1816] text-[#D4AF6A] focus:ring-0"
                    />
                    <span className="text-xs font-mono text-[#F5EFE6]">Active on Storefront</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_featured}
                      onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                      className="rounded border-[#2D2722] bg-[#1A1816] text-[#D4AF6A] focus:ring-0"
                    />
                    <span className="text-xs font-mono text-[#F5EFE6]">Featured Highlight</span>
                  </label>
                </div>

                {/* Image Preview */}
                {formData.image_url && (
                  <div className="p-3 bg-[#1A1816] border border-[#2D2722] rounded-lg flex items-center gap-3">
                    <div className="w-12 h-16 bg-black rounded overflow-hidden flex-shrink-0">
                      <img
                        src={formData.image_url.startsWith('http') || formData.image_url.startsWith('/') ? formData.image_url : `/${formData.image_url}`}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-xs font-mono text-[#A39684] truncate">
                      Image Preview: {formData.image_url}
                    </div>
                  </div>
                )}

                {/* Modal Footer */}
                <div className="pt-4 border-t border-[#2D2722] flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-[#1A1816] hover:bg-[#2D2722] text-[#A39684] hover:text-[#F5EFE6] rounded-lg text-xs font-mono transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={modalSubmitting}
                    className="px-5 py-2 bg-[#D4AF6A] hover:bg-[#E0C082] text-[#141210] rounded-lg text-xs font-mono font-semibold transition disabled:opacity-50"
                  >
                    {modalSubmitting
                      ? 'Saving...'
                      : editingProduct
                      ? 'Save Changes'
                      : 'Create Product'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AdminLayoutClient>
    </AdminGuard>
  );
}
