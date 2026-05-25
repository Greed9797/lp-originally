import type { Product, ProductVariant, SiteSettings } from "./types";
import { formatProductPrice } from "./format";
import type { ContactPlacement } from "./contacts";

const DEFAULT_NUMBER = "5511999999999";
const DEFAULT_MESSAGE = "Ola! Tenho interesse em produtos da Originally.";

export function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function buildProductMessage(options: {
  product: Product;
  variant?: ProductVariant | null;
  siteUrl?: string;
  settings?: Partial<SiteSettings>;
}) {
  const { product, variant } = options;
  const siteUrl = options.siteUrl?.replace(/\/$/, "") || process.env.NEXT_PUBLIC_SITE_URL || "";
  const price = variant?.price_cents ?? product.price_cents;
  const custom = product.whatsapp_message?.trim();
  const parts = [
    custom || options.settings?.whatsapp_default_message || DEFAULT_MESSAGE,
    `Produto: ${product.name}`,
    variant ? `Variacao: tamanho ${variant.size}, cor ${variant.color}` : null,
    `Preco: ${formatProductPrice(price)}`,
    siteUrl ? `Link: ${siteUrl}/produto/${product.slug}` : null,
  ].filter(Boolean);

  return parts.join("\n");
}

export function buildWhatsAppUrl(number: string | undefined, message: string) {
  const digits = onlyDigits(number || DEFAULT_NUMBER) || DEFAULT_NUMBER;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function buildTrackedWhatsAppUrl(options: {
  product?: Product | null;
  variant?: ProductVariant | null;
  placement: ContactPlacement;
  sourcePath?: string;
}) {
  const params = new URLSearchParams();
  if (options.product?.slug) params.set("product", options.product.slug);
  if (options.variant?.id) params.set("variant", options.variant.id);
  params.set("placement", options.placement);
  if (options.sourcePath) params.set("source", options.sourcePath);
  return `/api/whatsapp/redirect?${params.toString()}`;
}
