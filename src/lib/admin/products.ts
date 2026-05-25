import type { Product } from "../types";

export type ProductStatusFilter = "all" | "published" | "draft";
export type ProductImageStateFilter = "all" | "with-images" | "without-images";
export type ProductPriceStateFilter = "all" | "priced" | "consultation";
export type ProductSort = "created-desc" | "name-asc" | "name-desc" | "price-desc" | "price-asc";

export type ProductFilters = {
  query?: string;
  status?: ProductStatusFilter;
  categoryId?: string;
  imageState?: ProductImageStateFilter;
  priceState?: ProductPriceStateFilter;
  sort?: ProductSort;
};

export function filterAdminProducts(products: Product[], filters: ProductFilters) {
  const query = normalize(filters.query);
  const status = filters.status || "all";
  const imageState = filters.imageState || "all";
  const priceState = filters.priceState || "all";
  const sort = filters.sort || "created-desc";

  return products
    .filter((product) => {
      const matchesQuery = !query || [product.name, product.slug, product.category?.name, product.badge]
        .filter(Boolean)
        .some((value) => normalize(value).includes(query));
      const matchesStatus = status === "all" || product.status === status;
      const matchesCategory = !filters.categoryId || product.category_id === filters.categoryId;
      const matchesImages =
        imageState === "all" ||
        (imageState === "with-images" ? product.images.length > 0 : product.images.length === 0);
      const matchesPrice =
        priceState === "all" ||
        (priceState === "priced" ? product.price_cents > 0 : product.price_cents <= 0);
      return matchesQuery && matchesStatus && matchesCategory && matchesImages && matchesPrice;
    })
    .sort((a, b) => compareProducts(a, b, sort));
}

export function summarizeProductIndex(products: Product[]) {
  return {
    total: products.length,
    published: products.filter((product) => product.status === "published").length,
    draft: products.filter((product) => product.status === "draft").length,
    withImages: products.filter((product) => product.images.length > 0).length,
    withoutImages: products.filter((product) => product.images.length === 0).length,
    withoutPrice: products.filter((product) => product.price_cents <= 0).length,
  };
}

function compareProducts(a: Product, b: Product, sort: ProductSort) {
  if (sort === "name-asc") return a.name.localeCompare(b.name, "pt-BR");
  if (sort === "name-desc") return b.name.localeCompare(a.name, "pt-BR");
  if (sort === "price-desc") return b.price_cents - a.price_cents;
  if (sort === "price-asc") return a.price_cents - b.price_cents;
  return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
}

function normalize(value: unknown) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}
