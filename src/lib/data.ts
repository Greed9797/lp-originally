import "server-only";

import { cache } from "react";
import { notFound } from "next/navigation";
import { hasSupabaseEnv } from "./supabase/env";
import { createSupabaseServerClient } from "./supabase/server";
import { sampleCategories, sampleHomeSlots, sampleInstagramTiles, sampleProducts, sampleSettings } from "./sample-data";
import type { Category, HomeSlot, ImportRun, InstagramTile, Product, ProductImage, ProductVariant, SiteSettings, WhatsAppContactEvent } from "./types";

type ProductRow = Omit<Product, "category" | "images" | "variants"> & {
  categories?: Category | Category[] | null;
  product_images?: ProductImage[] | null;
  product_variants?: ProductVariant[] | null;
};

function normalizeProduct(row: ProductRow): Product {
  const category = Array.isArray(row.categories) ? row.categories[0] : row.categories;
  return {
    ...row,
    category: category ?? null,
    images: [...(row.product_images ?? [])].sort((a, b) => a.order_index - b.order_index),
    variants: row.product_variants ?? [],
  };
}

const productSelect = `
  id, category_id, name, slug, short_description, description, price_cents,
  whatsapp_message, badge, status, featured, source_platform, source_id, source_url,
  last_imported_at, metadata, created_at, updated_at,
  categories(id,name,slug,description,image_url,banner_url,source_platform,source_id,source_url,last_imported_at,sort_order),
  product_images(id,product_id,url,alt,storage_path,source_url,content_hash,last_imported_at,order_index),
  product_variants(id,product_id,size,color,stock,price_cents,active,source_id,source_code,metadata)
`;

export const getSettings = cache(async (): Promise<SiteSettings> => {
  if (!hasSupabaseEnv()) return sampleSettings;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("site_settings").select("key,value");
  if (error || !data?.length) return sampleSettings;

  const settings = Object.fromEntries(data.map((item) => [item.key, item.value])) as Partial<SiteSettings>;
  return { ...sampleSettings, ...settings };
});

export const getCategories = cache(async (): Promise<Category[]> => {
  if (!hasSupabaseEnv()) return sampleCategories;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("categories").select("*").order("sort_order");
  if (error || !data?.length) return sampleCategories;
  return data;
});

export const getProducts = cache(async (includeDrafts = false): Promise<Product[]> => {
  if (!hasSupabaseEnv()) return includeDrafts ? sampleProducts : sampleProducts.filter((p) => p.status === "published");
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("products").select(productSelect).order("created_at", { ascending: false });
  if (!includeDrafts) query = query.eq("status", "published");
  const { data, error } = await query;
  if (error || !data?.length) return includeDrafts ? sampleProducts : sampleProducts.filter((p) => p.status === "published");
  return (data as unknown as ProductRow[]).map(normalizeProduct);
});

export const getProductBySlug = cache(async (slug: string): Promise<Product> => {
  const fallbackProduct = sampleProducts.find((item) => item.slug === slug && item.status === "published");
  if (!hasSupabaseEnv()) {
    if (!fallbackProduct) notFound();
    return fallbackProduct;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select(productSelect)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error && fallbackProduct) return fallbackProduct;
  if (!data && fallbackProduct) return fallbackProduct;
  if (error || !data) notFound();
  return normalizeProduct(data as unknown as ProductRow);
});

export const getProductsByCategory = cache(async (slug: string): Promise<{ category: Category; products: Product[] }> => {
  const categories = await getCategories();
  const category = categories.find((item) => item.slug === slug);
  if (!category) notFound();
  const products = (await getProducts()).filter((item) => item.category_id === category.id);
  return { category, products };
});

export const getHomeSlots = cache(async (): Promise<HomeSlot[]> => {
  if (!hasSupabaseEnv()) return sampleHomeSlots;
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("home_slots")
    .select(`id,position,product_id,sort_order,products(${productSelect})`)
    .order("position")
    .order("sort_order");

  if (error || !data?.length) return sampleHomeSlots;
  return data.map((slot) => ({
    id: slot.id,
    position: slot.position,
    product_id: slot.product_id,
    sort_order: slot.sort_order,
    product: slot.products ? normalizeProduct((Array.isArray(slot.products) ? slot.products[0] : slot.products) as unknown as ProductRow) : null,
  })) as HomeSlot[];
});

export const getImportRuns = cache(async (limit = 10): Promise<ImportRun[]> => {
  if (!hasSupabaseEnv()) return [];
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("import_runs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data as ImportRun[];
});

export const getInstagramTiles = cache(async (includeInactive = false): Promise<InstagramTile[]> => {
  if (!hasSupabaseEnv()) return sampleInstagramTiles;
  const supabase = await createSupabaseServerClient();
  let query = supabase.from("instagram_tiles").select("*").order("sort_order", { ascending: true });
  if (!includeInactive) query = query.eq("active", true);
  const { data, error } = await query;
  if (error || !data) return sampleInstagramTiles;
  return data as InstagramTile[];
});

export const getWhatsAppContactEvents = cache(async (limit = 100): Promise<WhatsAppContactEvent[]> => {
  if (!hasSupabaseEnv()) return [];
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("whatsapp_contact_events")
    .select(`
      id, product_id, variant_id, placement, source_path, session_id, created_at,
      products(id,name,slug),
      product_variants(id,size,color)
    `)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data.map((event) => ({
    id: event.id,
    product_id: event.product_id,
    variant_id: event.variant_id,
    placement: event.placement,
    source_path: event.source_path,
    session_id: event.session_id,
    created_at: event.created_at,
    product: normalizeRelated(event.products),
    variant: normalizeRelated(event.product_variants),
  })) as WhatsAppContactEvent[];
});

function normalizeRelated<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}
