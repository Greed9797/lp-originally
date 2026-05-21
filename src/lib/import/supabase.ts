import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { NormalizedCatalog, NormalizedImage, NormalizedProduct } from "./originally";

const PRODUCT_IMAGES_BUCKET = "product-images";

type ImportError = { message: string; context?: string };

export type ImportCatalogOptions = {
  supabase: SupabaseClient;
  catalog: NormalizedCatalog;
  uploadImages?: boolean;
  fetchImpl?: typeof fetch;
};

export type ImportCatalogResult = {
  runId: string | null;
  productsSeen: number;
  productsImported: number;
  categoriesImported: number;
  imagesSeen: number;
  imagesUploaded: number;
  errors: ImportError[];
};

type ProductIdMapItem = {
  id: string;
  slug: string;
  source_id: string;
};

export async function importCatalogToSupabase({
  supabase,
  catalog,
  uploadImages = true,
  fetchImpl = fetch,
}: ImportCatalogOptions): Promise<ImportCatalogResult> {
  const errors: ImportError[] = [];
  const startedAt = new Date().toISOString();
  const runId = await createImportRun(supabase, catalog, startedAt).catch((error) => {
    errors.push(toImportError(error, "create import run"));
    return null;
  });

  try {
    await upsertCategories(supabase, catalog);
    const categoryMap = await getCategoryIdMap(supabase, catalog);
    await upsertProducts(supabase, catalog, categoryMap);
    const productMap = await getProductIdMap(supabase, catalog);

    let imagesUploaded = 0;
    for (const product of catalog.products) {
      const productRow = productMap.get(product.sourceId);
      if (!productRow) {
        errors.push({ context: product.sourceId, message: "Produto nao encontrado apos upsert." });
        continue;
      }
      await replaceVariants(supabase, productRow.id, product).catch((error) => {
        errors.push(toImportError(error, `variants:${product.sourceId}`));
      });
      if (uploadImages) {
        const count = await upsertImages(supabase, productRow, product, fetchImpl).catch((error) => {
          errors.push(toImportError(error, `images:${product.sourceId}`));
          return 0;
        });
        imagesUploaded += count;
      } else {
        const count = await upsertRemoteImageRows(supabase, productRow.id, product.images).catch((error) => {
          errors.push(toImportError(error, `image-rows:${product.sourceId}`));
          return 0;
        });
        imagesUploaded += count;
      }
    }

    const result: ImportCatalogResult = {
      runId,
      productsSeen: catalog.products.length,
      productsImported: productMap.size,
      categoriesImported: catalog.categories.length,
      imagesSeen: catalog.stats.images,
      imagesUploaded,
      errors,
    };
    await finishImportRun(supabase, runId, result, errors.length ? "failed" : "completed");
    return result;
  } catch (error) {
    errors.push(toImportError(error, "catalog import"));
    const result: ImportCatalogResult = {
      runId,
      productsSeen: catalog.products.length,
      productsImported: 0,
      categoriesImported: 0,
      imagesSeen: catalog.stats.images,
      imagesUploaded: 0,
      errors,
    };
    await finishImportRun(supabase, runId, result, "failed");
    throw error;
  }
}

async function upsertCategories(supabase: SupabaseClient, catalog: NormalizedCatalog) {
  if (!catalog.categories.length) return;
  const importedAt = new Date().toISOString();
  const { error } = await supabase.from("categories").upsert(
    catalog.categories.map((category) => ({
      name: category.name,
      slug: category.slug,
      description: category.description,
      image_url: category.imageUrl,
      banner_url: category.bannerUrl,
      sort_order: category.sortOrder,
      source_platform: category.sourcePlatform,
      source_id: category.sourceId,
      source_url: category.sourceUrl,
      last_imported_at: importedAt,
    })),
    { onConflict: "source_platform,source_id" },
  );
  if (error) throw new Error(error.message);
}

async function getCategoryIdMap(supabase: SupabaseClient, catalog: NormalizedCatalog) {
  const map = new Map<string, string>();
  if (!catalog.categories.length) return map;
  const { data, error } = await supabase
    .from("categories")
    .select("id,source_id")
    .eq("source_platform", catalog.source.platform)
    .in("source_id", catalog.categories.map((category) => category.sourceId));
  if (error) throw new Error(error.message);
  data?.forEach((row) => {
    if (row.source_id) map.set(row.source_id, row.id);
  });
  return map;
}

async function upsertProducts(supabase: SupabaseClient, catalog: NormalizedCatalog, categoryMap: Map<string, string>) {
  if (!catalog.products.length) return;
  const importedAt = new Date().toISOString();
  const { error } = await supabase.from("products").upsert(
    catalog.products.map((product) => ({
      category_id: product.categorySourceId ? categoryMap.get(product.categorySourceId) ?? null : null,
      name: product.name,
      slug: product.slug,
      short_description: product.shortDescription,
      description: product.description,
      price_cents: product.priceCents,
      whatsapp_message: product.whatsappMessage,
      badge: product.badge,
      status: product.status,
      featured: product.featured,
      source_platform: product.sourcePlatform,
      source_id: product.sourceId,
      source_url: product.sourceUrl,
      last_imported_at: importedAt,
      metadata: product.metadata,
      updated_at: importedAt,
    })),
    { onConflict: "source_platform,source_id" },
  );
  if (error) throw new Error(error.message);
}

async function getProductIdMap(supabase: SupabaseClient, catalog: NormalizedCatalog) {
  const map = new Map<string, ProductIdMapItem>();
  if (!catalog.products.length) return map;
  const { data, error } = await supabase
    .from("products")
    .select("id,slug,source_id")
    .eq("source_platform", catalog.source.platform)
    .in("source_id", catalog.products.map((product) => product.sourceId));
  if (error) throw new Error(error.message);
  data?.forEach((row) => {
    if (row.source_id) map.set(row.source_id, row as ProductIdMapItem);
  });
  return map;
}

async function replaceVariants(supabase: SupabaseClient, productId: string, product: NormalizedProduct) {
  const { error: deleteError } = await supabase.from("product_variants").delete().eq("product_id", productId);
  if (deleteError) throw new Error(deleteError.message);
  if (!product.variants.length) return;
  const { error } = await supabase.from("product_variants").insert(
    product.variants.map((variant) => ({
      product_id: productId,
      size: variant.size,
      color: variant.color,
      stock: variant.stock,
      price_cents: variant.priceCents,
      active: variant.active,
      source_id: variant.sourceId,
      source_code: variant.sourceCode,
      metadata: variant.metadata,
    })),
  );
  if (error) throw new Error(error.message);
}

async function upsertImages(
  supabase: SupabaseClient,
  productRow: ProductIdMapItem,
  product: NormalizedProduct,
  fetchImpl: typeof fetch,
) {
  if (!product.images.length) return 0;
  let uploaded = 0;
  for (const image of product.images) {
    const uploadedImage = await uploadImage(supabase, productRow, image, fetchImpl);
    const { error } = await supabase.from("product_images").upsert(
      {
        product_id: productRow.id,
        url: uploadedImage.publicUrl,
        alt: image.alt,
        storage_path: uploadedImage.path,
        source_url: image.sourceUrl,
        content_hash: uploadedImage.contentHash,
        order_index: image.orderIndex,
        last_imported_at: new Date().toISOString(),
      },
      { onConflict: "product_id,source_url" },
    );
    if (error) throw new Error(error.message);
    uploaded += 1;
  }
  return uploaded;
}

async function upsertRemoteImageRows(supabase: SupabaseClient, productId: string, images: NormalizedImage[]) {
  if (!images.length) return 0;
  const { error } = await supabase.from("product_images").upsert(
    images.map((image) => ({
      product_id: productId,
      url: image.sourceUrl,
      alt: image.alt,
      source_url: image.sourceUrl,
      content_hash: image.contentHash,
      order_index: image.orderIndex,
      last_imported_at: new Date().toISOString(),
    })),
    { onConflict: "product_id,source_url" },
  );
  if (error) throw new Error(error.message);
  return images.length;
}

async function uploadImage(
  supabase: SupabaseClient,
  productRow: ProductIdMapItem,
  image: NormalizedImage,
  fetchImpl: typeof fetch,
) {
  const response = await fetchImpl(image.sourceUrl);
  if (!response.ok) throw new Error(`Falha ao baixar imagem: HTTP ${response.status}`);
  const contentType = response.headers.get("content-type") || "image/jpeg";
  if (!contentType.startsWith("image/")) throw new Error(`Arquivo remoto nao e imagem: ${contentType}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  const contentHash = createHash("sha1").update(bytes).digest("hex");
  const ext = extensionFromContentType(contentType, image.sourceUrl);
  const path = `mercos/${productRow.slug}/${String(image.orderIndex + 1).padStart(2, "0")}-${contentHash.slice(0, 12)}.${ext}`;

  const { error } = await supabase.storage.from(PRODUCT_IMAGES_BUCKET).upload(path, bytes, {
    contentType,
    cacheControl: "31536000",
    upsert: true,
  });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(path);
  return { path, publicUrl: data.publicUrl, contentHash };
}

async function createImportRun(supabase: SupabaseClient, catalog: NormalizedCatalog, startedAt: string) {
  const { data, error } = await supabase
    .from("import_runs")
    .insert({
      source_platform: catalog.source.platform,
      source_url: catalog.source.siteUrl,
      status: "running",
      products_seen: catalog.products.length,
      images_seen: catalog.stats.images,
      started_at: startedAt,
    })
    .select("id")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data?.id ?? null;
}

async function finishImportRun(
  supabase: SupabaseClient,
  runId: string | null,
  result: ImportCatalogResult,
  status: "completed" | "failed",
) {
  if (!runId) return;
  await supabase
    .from("import_runs")
    .update({
      status,
      products_seen: result.productsSeen,
      products_imported: result.productsImported,
      categories_imported: result.categoriesImported,
      images_seen: result.imagesSeen,
      images_uploaded: result.imagesUploaded,
      errors: result.errors,
      finished_at: new Date().toISOString(),
    })
    .eq("id", runId);
}

function extensionFromContentType(contentType: string, sourceUrl: string) {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("gif")) return "gif";
  const urlExt = sourceUrl.split("?")[0]?.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "");
  return urlExt && ["jpg", "jpeg", "png", "webp", "gif"].includes(urlExt) ? urlExt : "jpg";
}

function toImportError(error: unknown, context?: string): ImportError {
  return {
    context,
    message: error instanceof Error ? error.message : "Erro inesperado no importador.",
  };
}
