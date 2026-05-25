export type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  image_url?: string | null;
  banner_url?: string | null;
  source_platform?: string | null;
  source_id?: string | null;
  source_url?: string | null;
  last_imported_at?: string | null;
  sort_order: number;
};

export type ProductImage = {
  id: string;
  product_id: string;
  url: string;
  alt?: string | null;
  storage_path?: string | null;
  source_url?: string | null;
  content_hash?: string | null;
  last_imported_at?: string | null;
  order_index: number;
};

export type ProductVariant = {
  id: string;
  product_id: string;
  size: string;
  color: string;
  stock: number;
  price_cents?: number | null;
  active: boolean;
  source_id?: string | null;
  source_code?: string | null;
  metadata?: Record<string, unknown> | null;
};

export type Product = {
  id: string;
  category_id?: string | null;
  category?: Category | null;
  name: string;
  slug: string;
  short_description?: string | null;
  description: string;
  price_cents: number;
  whatsapp_message?: string | null;
  badge?: string | null;
  status: "draft" | "published";
  featured: boolean;
  source_platform?: string | null;
  source_id?: string | null;
  source_url?: string | null;
  last_imported_at?: string | null;
  metadata?: Record<string, unknown> | null;
  images: ProductImage[];
  variants: ProductVariant[];
  created_at?: string;
  updated_at?: string;
};

export type HomeSlot = {
  id: string;
  position: "hero" | "destaques" | "novidades" | "colecao";
  product_id: string;
  sort_order: number;
  product?: Product | null;
};

export type SiteSettings = {
  whatsapp_number: string;
  whatsapp_default_message: string;
  whatsapp_button_label: string;
};

export type InstagramTile = {
  id: string;
  image_url: string;
  storage_path?: string | null;
  alt_text?: string | null;
  link_url?: string | null;
  sort_order: number;
  active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type ProductInput = {
  id?: string;
  category_id?: string | null;
  name: string;
  slug: string;
  short_description?: string | null;
  description: string;
  price_cents: number;
  whatsapp_message?: string | null;
  badge?: string | null;
  status: "draft" | "published";
  featured: boolean;
  variants: Array<Pick<ProductVariant, "size" | "color" | "stock" | "price_cents" | "active">>;
};

export type ImportRun = {
  id: string;
  source_platform: string;
  source_url: string;
  status: "running" | "completed" | "failed";
  products_seen: number;
  products_imported: number;
  categories_imported: number;
  images_seen: number;
  images_uploaded: number;
  errors: Array<{ message: string; context?: string }>;
  started_at: string;
  finished_at?: string | null;
};

export type WhatsAppContactEvent = {
  id: string;
  product_id?: string | null;
  variant_id?: string | null;
  placement: string;
  source_path?: string | null;
  session_id?: string | null;
  created_at: string;
  product?: Pick<Product, "id" | "name" | "slug"> | null;
  variant?: Pick<ProductVariant, "id" | "size" | "color"> | null;
};
