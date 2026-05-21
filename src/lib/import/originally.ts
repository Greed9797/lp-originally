import { createHash } from "node:crypto";
import { slugify } from "../format";

export const ORIGINALLY_SITE_URL = "https://www.originallypet.com.br";
export const MERCOS_API_BASE_URL = "https://app.mercos.com/api_b2b/v1";
export const MERCOS_SOURCE_PLATFORM = "mercos";
export const MAX_PRODUCT_IMAGES = 12;

type UnknownRecord = Record<string, unknown>;

export type MercosCatalogSnapshot = {
  source: {
    platform: typeof MERCOS_SOURCE_PLATFORM;
    siteUrl: string;
    apiBaseUrl: string;
  };
  fetchedAt: string;
  endpoints: Record<string, { url: string; status: number }>;
  data: {
    manifest?: unknown;
    company?: unknown;
    categories?: unknown;
    products?: unknown;
    productDetails?: unknown;
    featured?: unknown;
    promotions?: unknown;
  };
};

export type NormalizedImage = {
  sourceUrl: string;
  alt: string;
  orderIndex: number;
  contentHash: string;
};

export type NormalizedVariant = {
  sourceId: string;
  sourceCode: string | null;
  size: string;
  color: string;
  stock: number;
  priceCents: number | null;
  active: boolean;
  metadata: UnknownRecord;
};

export type NormalizedCategory = {
  sourcePlatform: typeof MERCOS_SOURCE_PLATFORM;
  sourceId: string;
  sourceUrl: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  bannerUrl: string | null;
  sortOrder: number;
};

export type NormalizedProduct = {
  sourcePlatform: typeof MERCOS_SOURCE_PLATFORM;
  sourceId: string;
  sourceUrl: string;
  categorySourceId: string | null;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  priceCents: number;
  whatsappMessage: string | null;
  badge: string | null;
  status: "draft" | "published";
  featured: boolean;
  images: NormalizedImage[];
  variants: NormalizedVariant[];
  metadata: UnknownRecord;
};

export type NormalizedCatalog = {
  source: MercosCatalogSnapshot["source"];
  fetchedAt: string;
  categories: NormalizedCategory[];
  products: NormalizedProduct[];
  assets: AssetsManifest;
  stats: {
    categories: number;
    products: number;
    images: number;
    draftProducts: number;
  };
};

export type AssetsManifest = {
  generatedAt: string;
  brand: Array<{
    kind: "logo" | "banner" | "login_banner";
    sourceUrl: string;
    href: string | null;
    orderIndex: number;
  }>;
  products: Array<{
    productSlug: string;
    productSourceId: string;
    images: NormalizedImage[];
  }>;
  collections: Array<{
    categorySlug: string;
    categorySourceId: string;
    imageUrl: string | null;
    bannerUrl: string | null;
  }>;
};

export type FetchMercosCatalogOptions = {
  siteUrl?: string;
  apiBaseUrl?: string;
  token?: string;
  cookie?: string;
  fetchProductDetails?: boolean;
  fetchImpl?: typeof fetch;
};

export async function fetchMercosCatalog(options: FetchMercosCatalogOptions = {}): Promise<MercosCatalogSnapshot> {
  const siteUrl = trimTrailingSlash(options.siteUrl || ORIGINALLY_SITE_URL);
  const apiBaseUrl = trimTrailingSlash(options.apiBaseUrl || MERCOS_API_BASE_URL);
  const fetchImpl = options.fetchImpl || fetch;
  const endpoints: MercosCatalogSnapshot["endpoints"] = {};

  const headers: Record<string, string> = {
    Accept: "application/json",
    Origin: siteUrl,
    Referer: `${siteUrl}/`,
    "User-Agent": "OriginallyStoreImporter/1.0",
  };
  if (options.token) headers.Authorization = `Bearer ${options.token}`;
  if (options.cookie) headers.Cookie = options.cookie;

  async function getJson<T>(name: keyof MercosCatalogSnapshot["data"], path: string): Promise<T | undefined> {
    const url = `${apiBaseUrl}/${path.replace(/^\/+/, "")}`;
    const response = await fetchImpl(url, { headers, cache: "no-store" });
    endpoints[name] = { url, status: response.status };
    if (!response.ok) return undefined;
    return (await response.json()) as T;
  }

  const [manifest, company, categories, products, featured, promotions] = await Promise.all([
    getJson("manifest", "manifest/"),
    getJson("company", "dados_empresa"),
    getJson("categories", "categorias"),
    getJson("products", "produtos"),
    getJson("featured", "destaques"),
    getJson("promotions", "promocoes"),
  ]);
  const productDetails = options.fetchProductDetails === false ? undefined : await fetchProductDetailsById(products, apiBaseUrl, headers, endpoints, fetchImpl);

  return {
    source: { platform: MERCOS_SOURCE_PLATFORM, siteUrl, apiBaseUrl },
    fetchedAt: new Date().toISOString(),
    endpoints,
    data: { manifest, company, categories, products, productDetails, featured, promotions },
  };
}

export function normalizeMercosCatalog(snapshot: MercosCatalogSnapshot): NormalizedCatalog {
  const categories = normalizeCategories(snapshot.data.categories, snapshot.source.siteUrl);
  const categoriesById = new Map(categories.map((category) => [category.sourceId, category]));
  const featuredIds = collectFeaturedProductIds(snapshot.data.featured);
  const products = normalizeProducts(mergeProductsWithDetails(snapshot.data.products, snapshot.data.productDetails), categoriesById, featuredIds, snapshot.source.siteUrl);
  const assets = buildAssetsManifest(products, categories, snapshot.fetchedAt, collectBrandAssets(snapshot));

  return {
    source: snapshot.source,
    fetchedAt: snapshot.fetchedAt,
    categories,
    products,
    assets,
    stats: {
      categories: categories.length,
      products: products.length,
      images: products.reduce((sum, product) => sum + product.images.length, 0),
      draftProducts: products.filter((product) => product.status === "draft").length,
    },
  };
}

export function normalizeCategories(raw: unknown, siteUrl = ORIGINALLY_SITE_URL): NormalizedCategory[] {
  const sourceCategories = Array.isArray(raw) ? raw : getArray(raw, "categorias", "categories");
  const output: NormalizedCategory[] = [];

  function visit(item: unknown, order: number, parentName?: string) {
    if (!isRecord(item)) return;
    const id = getString(item, "categoria_id", "id");
    const name = getString(item, "nome", "name");
    if (!id || !name) return;

    const description = getString(item, "descricao", "description") || (parentName ? `${name} da linha ${parentName}.` : null);
    const imageUrl = getString(item, "imagem", "image", "image_url");
    const bannerUrl = getString(item, "banner", "banner_url", "imagem_desktop", "imagem_mobile");
    output.push({
      sourcePlatform: MERCOS_SOURCE_PLATFORM,
      sourceId: id,
      sourceUrl: `${siteUrl}/?categoria=${encodeURIComponent(id)}`,
      name,
      slug: uniqueSlug(name, id),
      description,
      imageUrl,
      bannerUrl,
      sortOrder: order,
    });

    getArray(item, "subcategorias", "subcategories", "categories").forEach((child, index) => visit(child, order * 100 + index + 1, name));
  }

  sourceCategories.forEach((item, index) => visit(item, index + 1));
  return dedupeBy(output, (category) => category.sourceId);
}

export function normalizeProducts(
  raw: unknown,
  categoriesById = new Map<string, NormalizedCategory>(),
  featuredIds = new Set<string>(),
  siteUrl = ORIGINALLY_SITE_URL,
): NormalizedProduct[] {
  const sourceProducts = Array.isArray(raw) ? raw : getArray(raw, "produtos", "products", "data");
  return sourceProducts
    .map((item) => normalizeProduct(item, categoriesById, featuredIds, siteUrl))
    .filter((product): product is NormalizedProduct => Boolean(product));
}

export function normalizeProduct(
  raw: unknown,
  categoriesById = new Map<string, NormalizedCategory>(),
  featuredIds = new Set<string>(),
  siteUrl = ORIGINALLY_SITE_URL,
): NormalizedProduct | null {
  if (!isRecord(raw)) return null;
  const sourceId = getString(raw, "produto_id", "id");
  const name = getString(raw, "nome", "name");
  if (!sourceId || !name) return null;

  const categorySourceId = getString(raw, "categoria_id", "categoryId", "category_id") || getFirstCategorySourceId(raw);
  const category = categorySourceId ? categoriesById.get(categorySourceId) : undefined;
  const images = collectProductImages(raw, name);
  const priceCents = parseMercosPriceToCents(raw.preco ?? raw.price ?? raw.preco_com_desconto ?? raw.preco_tabela);
  const code = getString(raw, "codigo", "code");
  const description =
    getString(raw, "descricao", "description", "informacoes_adicionais") ||
    `Produto Originally Pet importado do catalogo Mercos${code ? `, codigo ${code}` : ""}.`;
  const shortDescription = category
    ? `${category.name} Originally Pet${code ? ` - codigo ${code}` : ""}.`
    : `Produto Originally Pet${code ? ` - codigo ${code}` : ""}.`;
  const variants = normalizeVariants(getArray(raw, "grades_v3", "variacoes", "variants"), priceCents);
  const hasMinimumPublicData = images.length > 0;

  return {
    sourcePlatform: MERCOS_SOURCE_PLATFORM,
    sourceId,
    sourceUrl: `${siteUrl}/produtos/${encodeURIComponent(sourceId)}`,
    categorySourceId,
    name,
    slug: uniqueSlug(name, sourceId),
    shortDescription,
    description,
    priceCents,
    whatsappMessage: null,
    badge: featuredIds.has(sourceId) ? "Destaque" : null,
    status: hasMinimumPublicData ? "published" : "draft",
    featured: featuredIds.has(sourceId),
    images,
    variants,
    metadata: pickMetadata(raw, [
      "codigo",
      "unidade",
      "peso_bruto",
      "altura",
      "largura",
      "comprimento",
      "precos_especificos",
      "representada_id",
      "produto_sem_estoque",
      "saldo_estoque",
    ]),
  };
}

export function normalizeVariants(rawVariants: unknown[], fallbackPriceCents: number): NormalizedVariant[] {
  return rawVariants
    .filter(isRecord)
    .map((variant) => {
      const sourceId = getString(variant, "produto_id", "id");
      if (!sourceId) return null;
      const sourceCode = getString(variant, "codigo", "code");
      return {
        sourceId,
        sourceCode,
        size: inferSize(sourceCode),
        color: inferColor(sourceCode),
        stock: Math.max(0, Number(variant.saldo_estoque ?? variant.stock ?? 0) || 0),
        priceCents: parseMercosPriceToCents(variant.preco ?? variant.price) || fallbackPriceCents || null,
        active: variant.produto_sem_estoque !== true,
        metadata: pickMetadata(variant, ["codigo", "unidade", "peso_bruto", "altura", "largura", "comprimento", "representada_id"]),
      } satisfies NormalizedVariant;
    })
    .filter((variant): variant is NormalizedVariant => Boolean(variant));
}

export function parseMercosPriceToCents(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return Math.max(0, Math.round(value * 100));
  if (typeof value !== "string") return 0;
  const normalized = value.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed * 100) : 0;
}

export function buildAssetsManifest(
  products: NormalizedProduct[],
  categories: NormalizedCategory[],
  generatedAt = new Date().toISOString(),
  brand: AssetsManifest["brand"] = [],
): AssetsManifest {
  return {
    generatedAt,
    brand,
    products: products.map((product) => ({
      productSlug: product.slug,
      productSourceId: product.sourceId,
      images: product.images,
    })),
    collections: categories.map((category) => ({
      categorySlug: category.slug,
      categorySourceId: category.sourceId,
      imageUrl: category.imageUrl,
      bannerUrl: category.bannerUrl,
    })),
  };
}

export function collectProductImages(raw: UnknownRecord, alt: string): NormalizedImage[] {
  const candidates = [
    ...getArray(raw, "imagens", "images"),
    raw.imagem,
    raw.image,
    ...getArray(raw, "grades_v3", "variacoes", "variants").flatMap((variant) =>
      isRecord(variant) ? [...getArray(variant, "imagens", "images"), variant.imagem, variant.image] : [],
    ),
  ];

  return dedupeBy(
    candidates
      .filter((value): value is string => typeof value === "string" && value.startsWith("http"))
      .slice(0, MAX_PRODUCT_IMAGES)
      .map((sourceUrl, orderIndex) => ({
        sourceUrl,
        alt,
        orderIndex,
        contentHash: createHash("sha1").update(sourceUrl).digest("hex"),
      })),
    (image) => image.sourceUrl,
  ).slice(0, MAX_PRODUCT_IMAGES);
}

export function collectBrandAssets(snapshot: MercosCatalogSnapshot): AssetsManifest["brand"] {
  const output: AssetsManifest["brand"] = [];
  const manifestIcons = isRecord(snapshot.data.manifest) ? getArray(snapshot.data.manifest, "icons") : [];
  manifestIcons.forEach((icon, index) => {
    if (!isRecord(icon)) return;
    const sourceUrl = getString(icon, "src");
    if (!sourceUrl) return;
    output.push({ kind: "logo", sourceUrl, href: snapshot.source.siteUrl, orderIndex: index });
  });

  const company = isRecord(snapshot.data.company) ? snapshot.data.company : null;
  const companyLogo = company ? getString(company, "logomarca", "logo") : null;
  if (companyLogo) output.push({ kind: "logo", sourceUrl: companyLogo, href: snapshot.source.siteUrl, orderIndex: output.length });

  const personalization = company ? parsePersonalization(company.personalizacao_json) : null;
  const envs = personalization ? [personalization.producao, personalization.rascunho].filter(isRecord) : [];
  envs.forEach((env) => {
    const banner = isRecord(env.banner) ? env.banner : null;
    if (!banner) return;
    getArray(banner, "principal").forEach((item, index) => {
      if (!isRecord(item)) return;
      const href = getString(item, "url");
      for (const key of ["imagem_desktop", "imagem_mobile"]) {
        const sourceUrl = getString(item, key);
        if (sourceUrl) output.push({ kind: "banner", sourceUrl, href, orderIndex: index });
      }
    });
    const loginBanner = isRecord(banner.tela_login) ? getString(banner.tela_login, "url") : null;
    if (loginBanner) output.push({ kind: "login_banner", sourceUrl: loginBanner, href: snapshot.source.siteUrl, orderIndex: output.length });
  });

  return dedupeBy(output, (item) => item.sourceUrl);
}

function collectFeaturedProductIds(raw: unknown) {
  const ids = new Set<string>();
  const visit = (value: unknown) => {
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    if (!isRecord(value)) return;
    const productId = getString(value, "produto_id", "id");
    if (productId) ids.add(productId);
    getArray(value, "produtos", "products").forEach(visit);
  };
  visit(raw);
  return ids;
}

async function fetchProductDetailsById(
  rawProducts: unknown,
  apiBaseUrl: string,
  headers: Record<string, string>,
  endpoints: MercosCatalogSnapshot["endpoints"],
  fetchImpl: typeof fetch,
) {
  const sourceProducts = Array.isArray(rawProducts) ? rawProducts : getArray(rawProducts, "produtos", "products", "data");
  const ids = dedupeBy(
    sourceProducts
      .filter(isRecord)
      .map((product) => getString(product, "produto_id", "id"))
      .filter((id): id is string => Boolean(id)),
    (id) => id,
  );
  if (!ids.length) return undefined;

  const details: unknown[] = [];
  const concurrency = 6;
  let index = 0;

  async function worker() {
    while (index < ids.length) {
      const id = ids[index];
      index += 1;
      const path = `produtos/${encodeURIComponent(id)}`;
      const url = `${apiBaseUrl}/${path}`;
      try {
        const response = await fetchImpl(url, { headers, cache: "no-store" });
        endpoints[`product:${id}`] = { url, status: response.status };
        if (response.ok) details.push(await response.json());
      } catch {
        endpoints[`product:${id}`] = { url, status: 0 };
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, ids.length) }, () => worker()));
  return details;
}

function mergeProductsWithDetails(rawProducts: unknown, rawDetails: unknown): unknown {
  const products = Array.isArray(rawProducts) ? rawProducts : getArray(rawProducts, "produtos", "products", "data");
  const details = Array.isArray(rawDetails) ? rawDetails : getArray(rawDetails, "produtos", "products", "data");
  if (!details.length) return rawProducts;

  const detailsById = new Map<string, UnknownRecord>();
  details.filter(isRecord).forEach((detail) => {
    const id = getString(detail, "produto_id", "id");
    if (id) detailsById.set(id, detail);
  });

  const merged = products.map((product) => {
    if (!isRecord(product)) return product;
    const id = getString(product, "produto_id", "id");
    const detail = id ? detailsById.get(id) : undefined;
    if (!detail) return product;
    return {
      ...product,
      ...detail,
      categoria_id: getString(detail, "categoria_id", "categoryId", "category_id") || getString(product, "categoria_id", "categoryId", "category_id"),
    };
  });

  const knownIds = new Set(merged.filter(isRecord).map((product) => getString(product, "produto_id", "id")).filter(Boolean));
  for (const detail of details.filter(isRecord)) {
    const id = getString(detail, "produto_id", "id");
    if (id && !knownIds.has(id)) merged.push(detail);
  }

  return merged;
}

function getFirstCategorySourceId(raw: UnknownRecord) {
  const firstCategory = getArray(raw, "categorias", "categories")[0];
  return isRecord(firstCategory) ? getString(firstCategory, "categoria_id", "id", "category_id") : null;
}

function inferSize(code: string | null) {
  if (!code) return "Unico";
  const match = code.match(/(?:^|[^A-Z])(PP|P|M|G|GG|XG|XXG|B)(?:$|[^A-Z])/i) || code.match(/(PP|P|M|G|GG|XG|XXG|B)$/i);
  return match?.[1]?.toUpperCase() || code;
}

function inferColor(code: string | null) {
  if (!code) return "Original";
  if (/^C/i.test(code)) return "Caramelo";
  if (/^R/i.test(code)) return "Rosa";
  if (/^T/i.test(code)) return "Toffee";
  if (/^F/i.test(code)) return "Fendi";
  return "Original";
}

function pickMetadata(raw: UnknownRecord, keys: string[]) {
  return Object.fromEntries(keys.filter((key) => raw[key] !== undefined && raw[key] !== null).map((key) => [key, raw[key]]));
}

function parsePersonalization(value: unknown): UnknownRecord | null {
  if (isRecord(value)) return value;
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const parsed = JSON.parse(value) as unknown;
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function getString(raw: UnknownRecord, ...keys: string[]) {
  for (const key of keys) {
    const value = raw[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return null;
}

function getArray(raw: unknown, ...keys: string[]): unknown[] {
  if (!isRecord(raw)) return [];
  for (const key of keys) {
    const value = raw[key];
    if (Array.isArray(value)) return value;
  }
  return [];
}

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function uniqueSlug(name: string, sourceId: string) {
  return `${slugify(name)}-${sourceId}`.slice(0, 96).replace(/-+$/g, "");
}

function dedupeBy<T>(items: T[], keyFn: (item: T) => string) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/g, "");
}
