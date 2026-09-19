/**
 * NAMORA — CMS & Media Library Type Definitions
 * Typed contracts for Database-driven CMS entities.
 */

export interface CMSOverlayConfig {
  posX: number;
  posY: number;
  maxWidth: number;
  fontSizeEn: number;
  fontSizeAr: number;
  fontEn: string;
  fontAr: string;
  textColor: string;
  textShadow: string;
}

export interface CMSCollection {
  id: string;
  slug: string;
  title: string;
  description?: string;
  image_url?: string;
  type: 'persian' | 'ready_stock' | 'custom';
  is_active: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface CMSDesign {
  id: string;
  slug: string;
  title: string;
  category: 'crimson' | 'blue' | 'pastel' | 'amber' | 'vintage' | 'custom';
  category_label: string;
  image_url: string;
  preview_image_url?: string;
  description?: string;
  overlay_config: CMSOverlayConfig;
  collection_id?: string | null;
  is_active: boolean;
  is_featured: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface CMSProduct {
  id: string;
  slug?: string;
  sku?: string;
  type: 'ready_stock' | 'personalized';
  title: string;
  subtitle?: string;
  description?: string;
  category: string;
  category_label: string;
  image_url: string;
  gallery_images?: string[];
  video_url?: string;
  tag?: string;
  tag_class?: string;
  price: number;
  compare_at_price?: number | null;
  deposit_price: number;
  cod_price: number;
  in_stock: boolean;
  stock_quantity: number;
  is_featured?: boolean;
  is_active?: boolean;
  collection_id?: string | null;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface CMSMedia {
  id: string;
  filename: string;
  storage_path: string;
  public_url: string;
  file_type: string;
  file_size: number;
  folder: 'general' | 'products' | 'designs' | 'collections' | 'banners';
  alt_text?: string;
  created_at: string;
}

export interface CMSAuditLog {
  id: string;
  admin_email: string;
  action: string;
  entity_type: 'product' | 'design' | 'media' | 'collection' | 'settings';
  entity_id: string;
  details?: Record<string, any>;
  created_at: string;
}
