import { NextResponse } from "next/server";
import { buildProductMessage, buildWhatsAppUrl } from "@/lib/whatsapp";
import { sampleSettings } from "@/lib/sample-data";
import { hasServiceRoleEnv } from "@/lib/supabase/env";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import type { ContactPlacement } from "@/lib/contacts";
import type { Product, ProductVariant, SiteSettings } from "@/lib/types";

const placements: ContactPlacement[] = ["home", "product", "floating", "collection", "header", "footer"];
const CONTACT_SESSION_COOKIE = "originally_contact_session";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const placement = parsePlacement(url.searchParams.get("placement"));
  const sourcePath = sanitizePath(url.searchParams.get("source")) || sourcePathFromReferer(request.headers.get("referer"));
  const productSlug = url.searchParams.get("product")?.trim() || "";
  const variantId = url.searchParams.get("variant")?.trim() || "";
  const sessionId = getOrCreateSessionId(request);

  const { settings, product, variant } = await getRedirectContext(productSlug, variantId);
  await registerContactEvent({ productId: product?.id ?? null, variantId: variant?.id ?? null, placement, sourcePath, sessionId });

  const message = product
    ? buildProductMessage({ product, variant, settings, siteUrl: url.origin })
    : settings.whatsapp_default_message;
  const response = NextResponse.redirect(buildWhatsAppUrl(settings.whatsapp_number, message), 302);
  response.cookies.set(CONTACT_SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: url.protocol === "https:",
    maxAge: 60 * 60 * 24 * 180,
    path: "/",
  });
  return response;
}

async function getRedirectContext(productSlug: string, variantId: string) {
  if (!hasServiceRoleEnv()) return { settings: sampleSettings, product: null, variant: null };
  const supabase = createSupabaseServiceClient();
  const { data: settingsRows } = await supabase.from("site_settings").select("key,value");
  const settings = settingsRows?.length
    ? { ...sampleSettings, ...Object.fromEntries(settingsRows.map((row) => [row.key, row.value])) as Partial<SiteSettings> }
    : sampleSettings;

  if (!productSlug) return { settings, product: null, variant: null };

  const { data: productRow } = await supabase
    .from("products")
    .select("id,category_id,name,slug,short_description,description,price_cents,whatsapp_message,badge,status,featured,product_variants(id,product_id,size,color,stock,price_cents,active)")
    .eq("slug", productSlug)
    .eq("status", "published")
    .maybeSingle();

  if (!productRow) return { settings, product: null, variant: null };

  const variants = (productRow.product_variants ?? []) as ProductVariant[];
  const product = {
    ...productRow,
    category: null,
    images: [],
    variants,
  } as Product;
  const variant = variants.find((item) => item.id === variantId) ?? null;
  return { settings, product, variant };
}

async function registerContactEvent(input: {
  productId: string | null;
  variantId: string | null;
  placement: ContactPlacement;
  sourcePath: string | null;
  sessionId: string;
}) {
  if (!hasServiceRoleEnv()) return;
  try {
    const supabase = createSupabaseServiceClient();
    await supabase.from("whatsapp_contact_events").insert({
      product_id: input.productId,
      variant_id: input.variantId,
      placement: input.placement,
      source_path: input.sourcePath,
      session_id: input.sessionId,
    });
  } catch {
    return;
  }
}

function parsePlacement(value: string | null): ContactPlacement {
  return placements.includes(value as ContactPlacement) ? value as ContactPlacement : "floating";
}

function sanitizePath(value: string | null) {
  if (!value || !value.startsWith("/")) return null;
  return value.slice(0, 240);
}

function sourcePathFromReferer(referer: string | null) {
  if (!referer) return null;
  try {
    const url = new URL(referer);
    return `${url.pathname}${url.search}`.slice(0, 240);
  } catch {
    return null;
  }
}

function getOrCreateSessionId(request: Request) {
  const cookie = request.headers.get("cookie") || "";
  const existing = cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${CONTACT_SESSION_COOKIE}=`))
    ?.split("=")[1];
  return existing || crypto.randomUUID();
}
