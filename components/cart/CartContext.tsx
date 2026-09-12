'use client';

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import {
  CartItem,
  CartGiftOptions,
  CartState,
  CartTotals,
  CartPersonalizationSnapshot,
} from '@/lib/cart/cart-types';
import {
  calculateCartTotals,
  DEFAULT_FRAME_PRICE,
  DEFAULT_DEPOSIT_PER_FRAME,
  DEFAULT_COD_PER_FRAME,
  DEFAULT_GIFT_PACKAGING_PRICE,
} from '@/lib/cart/cart-calculations';
import {
  loadCartFromStorage,
  saveCartToStorage,
  clearCartStorage,
  DEFAULT_GIFT_STATE,
} from '@/lib/cart/cart-persistence';
import { generateCartItemId } from '@/lib/cart/cart-utils';
import { PersianDesignItem, ReadyStockItem } from '@/lib/storefront-data';
import { CustomizationState, GiftPackagingState } from '@/components/customizer/state/customization-types';

interface AddPersonalizedParams {
  design: PersianDesignItem;
  customization: CustomizationState;
  gift?: GiftPackagingState;
}

interface CartContextValue {
  items: CartItem[];
  gift: CartGiftOptions;
  isOpen: boolean;
  totals: CartTotals;
  isHydrated: boolean;
  addPersonalizedItem: (params: AddPersonalizedParams) => string;
  addReadyStockItem: (product: ReadyStockItem) => string;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  setGiftOptions: (options: Partial<CartGiftOptions>) => void;
  toggleCart: (isOpen?: boolean) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [gift, setGift] = useState<CartGiftOptions>(DEFAULT_GIFT_STATE);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  // 1. Safe SSR Hydration from localStorage
  useEffect(() => {
    const saved = loadCartFromStorage();
    setItems(saved.items);
    setGift(saved.gift);
    setIsHydrated(true);
  }, []);

  // 2. Persist state changes when hydrated
  useEffect(() => {
    if (!isHydrated) return;
    saveCartToStorage({
      version: 1,
      items,
      gift,
      isOpen,
    });
  }, [items, gift, isHydrated]);

  // 3. Derived Pure Totals
  const totals = useMemo(() => {
    return calculateCartTotals(items, gift);
  }, [items, gift]);

  // 4. Toggle Drawer & lock body scroll
  const toggleCart = useCallback((open?: boolean) => {
    setIsOpen((prev) => {
      const next = typeof open === 'boolean' ? open : !prev;
      if (typeof document !== 'undefined') {
        if (next) {
          document.body.classList.add('drawer-open');
        } else {
          document.body.classList.remove('drawer-open');
        }
      }
      return next;
    });
  }, []);

  // 5. Add Personalized Item
  const addPersonalizedItem = useCallback(
    ({ design, customization, gift: customizerGift }: AddPersonalizedParams): string => {
      const newId = generateCartItemId('frame');

      const finishLabels: Record<string, string> = {
        black: 'Obsidian Black',
        gold: 'Gold Foil',
        ivory: 'Royal Ivory',
        rosegold: 'Rose Gold',
        custom: 'Custom Color',
      };
      const fontLabels: Record<string, string> = {
        classic: 'Classic Serifs',
        royal: 'Royal Imperial',
        calligraphy: 'Arabic Calligraphy',
      };
      const sizeLabels: Record<string, string> = {
        subtle: 'Subtle',
        balanced: 'Balanced',
        statement: 'Statement',
      };

      const personalizationSnapshot: CartPersonalizationSnapshot = {
        designId: design.id,
        designTitle: design.title,
        language: customization.language,
        englishName: customization.englishName.trim(),
        arabicName: customization.arabicName.trim() || customization.englishName.trim(),
        arabicNameSource: customization.arabicNameSource,
        finish: customization.ink,
        finishLabel: finishLabels[customization.ink] || 'Obsidian Black',
        finishColor: customization.customInkColor || '#1A1A1A',
        font: customization.font,
        fontLabel: fontLabels[customization.font] || 'Classic',
        textSize: customization.textSize,
        textSizeLabel: sizeLabels[customization.textSize] || 'Balanced',
        size: 'A4',
        overlayPosition: {
          posX: design.overlay.posX,
          posY: design.overlay.posY,
          maxWidth: design.overlay.maxWidth,
        },
      };

      const newItem: CartItem = {
        id: newId,
        productId: design.id,
        productType: 'personalized',
        title: design.title,
        subtitle: `${personalizationSnapshot.englishName} · ${personalizationSnapshot.finishLabel}`,
        image: design.assetPath,
        unitPrice: DEFAULT_FRAME_PRICE,
        depositPrice: DEFAULT_DEPOSIT_PER_FRAME,
        codPrice: DEFAULT_COD_PER_FRAME,
        quantity: 1,
        customization: personalizationSnapshot,
        createdAt: Date.now(),
      };

      // If gift packaging was enabled in the customizer, update cart gift options
      if (customizerGift?.isGift) {
        setGift({
          enabled: true,
          to: customizerGift.to || '',
          from: customizerGift.from || '',
          greetingNote: customizerGift.message || '',
          price: DEFAULT_GIFT_PACKAGING_PRICE,
        });
      }

      setItems((prev) => [...prev, newItem]);
      toggleCart(true);
      return newId;
    },
    [toggleCart]
  );

  // 6. Add Ready Stock Item
  const addReadyStockItem = useCallback(
    (product: ReadyStockItem): string => {
      let resultId = '';
      setItems((prev) => {
        const existingIdx = prev.findIndex(
          (item) => item.productType === 'ready_stock' && item.productId === product.id
        );

        if (existingIdx >= 0) {
          // Increment existing item quantity
          const updated = [...prev];
          const existing = updated[existingIdx];
          resultId = existing.id;
          updated[existingIdx] = {
            ...existing,
            quantity: existing.quantity + 1,
          };
          return updated;
        } else {
          // Create new line item
          const newId = generateCartItemId('ready');
          resultId = newId;
          const newItem: CartItem = {
            id: newId,
            productId: product.id,
            productType: 'ready_stock',
            title: product.title,
            subtitle: product.subtitle,
            image: product.assetPath,
            categoryLabel: product.categoryLabel,
            unitPrice: product.price,
            depositPrice: product.depositPrice,
            codPrice: product.codPrice,
            quantity: 1,
            createdAt: Date.now(),
          };
          return [...prev, newItem];
        }
      });

      toggleCart(true);
      return resultId;
    },
    [toggleCart]
  );

  // 7. Remove Item
  const removeItem = useCallback((itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  }, []);

  // 8. Update Quantity
  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((item) => item.id !== itemId));
      return;
    }

    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, quantity } : item))
    );
  }, []);

  // 9. Update Gift Options
  const setGiftOptions = useCallback((options: Partial<CartGiftOptions>) => {
    setGift((prev) => ({
      ...prev,
      ...options,
    }));
  }, []);

  // 10. Clear Cart
  const clearCart = useCallback(() => {
    setItems([]);
    setGift(DEFAULT_GIFT_STATE);
    clearCartStorage();
  }, []);

  const value: CartContextValue = {
    items,
    gift,
    isOpen,
    totals,
    isHydrated,
    addPersonalizedItem,
    addReadyStockItem,
    removeItem,
    updateQuantity,
    setGiftOptions,
    toggleCart,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
