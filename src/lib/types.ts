export type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  sort_order: number;
};

export type ProductImage = {
  id: string;
  product_id: string;
  url: string;
  alt?: string | null;
  storage_path?: string | null;
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
