"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseCurrencyToCents, slugify } from "@/lib/format";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeProductInput } from "@/lib/validation";
import type { ProductVariant } from "@/lib/types";

export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect("/admin/login?error=invalid");
  redirect("/admin");
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function saveCategoryAction(formData: FormData) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  const slug = slugify(String(formData.get("slug") || name));
  const description = String(formData.get("description") || "").trim();
  const sort_order = Number(formData.get("sort_order") || 0);
  const payload = { name, slug, description, sort_order };
  const result = id
    ? await supabase.from("categories").update(payload).eq("id", id)
    : await supabase.from("categories").insert(payload);
  if (result.error) throw new Error(result.error.message);
  revalidatePath("/");
  revalidatePath("/admin/categorias");
  redirect("/admin/categorias");
}

export async function deleteCategoryAction(formData: FormData) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const id = String(formData.get("id"));
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/admin/categorias");
}

export async function saveSettingsAction(formData: FormData) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const rows = [
    { key: "whatsapp_number", value: String(formData.get("whatsapp_number") || "") },
    { key: "whatsapp_default_message", value: String(formData.get("whatsapp_default_message") || "") },
    { key: "whatsapp_button_label", value: String(formData.get("whatsapp_button_label") || "") },
  ];
  const { error } = await supabase.from("site_settings").upsert(rows);
  if (error) {
    if (isSupabaseSchemaCacheError(error)) {
      redirect("/admin/configuracoes?status=supabase-schema");
    }
    redirect("/admin/configuracoes?status=error");
  }
  revalidatePath("/");
  revalidatePath("/admin/configuracoes");
  redirect("/admin/configuracoes?status=saved");
}

export async function saveHomeSlotsAction(formData: FormData) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const positions = ["hero", "destaques", "novidades", "colecao"];
  const rows = positions.flatMap((position) => {
    const ids = String(formData.get(position) || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    return ids.map((product_id, sort_order) => ({ position, product_id, sort_order }));
  });
  const { error: delError } = await supabase.from("home_slots").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (delError) throw new Error(delError.message);
  if (rows.length) {
    const { error } = await supabase.from("home_slots").insert(rows);
    if (error) throw new Error(error.message);
  }
  revalidatePath("/");
  revalidatePath("/admin/vitrines");
}

export async function saveProductAction(formData: FormData) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const id = String(formData.get("id") || "");
  const variants = parseVariants(String(formData.get("variants") || "[]"));
  const input = normalizeProductInput({
    id: id || undefined,
    category_id: String(formData.get("category_id") || "") || null,
    name: String(formData.get("name") || ""),
    slug: String(formData.get("slug") || ""),
    short_description: String(formData.get("short_description") || ""),
    description: String(formData.get("description") || ""),
    price_cents: parseCurrencyToCents(formData.get("price")),
    whatsapp_message: String(formData.get("whatsapp_message") || ""),
    badge: String(formData.get("badge") || ""),
    status: formData.get("status") === "published" ? "published" : "draft",
    featured: formData.get("featured") === "on",
    variants,
  });
  const productPayload = {
    category_id: input.category_id,
    name: input.name,
    slug: input.slug,
    short_description: input.short_description,
    description: input.description,
    price_cents: input.price_cents,
    whatsapp_message: input.whatsapp_message,
    badge: input.badge,
    status: input.status,
    featured: input.featured,
    updated_at: new Date().toISOString(),
  };
  const result = id
    ? await supabase.from("products").update(productPayload).eq("id", id).select("id,slug").single()
    : await supabase.from("products").insert(productPayload).select("id,slug").single();
  if (result.error || !result.data) throw new Error(result.error?.message || "Produto nao salvo.");
  const productId = result.data.id;
  await supabase.from("product_variants").delete().eq("product_id", productId);
  if (input.variants.length) {
    const { error } = await supabase.from("product_variants").insert(
      input.variants.map((variant) => ({ ...variant, product_id: productId })),
    );
    if (error) throw new Error(error.message);
  }
  revalidatePath("/");
  revalidatePath(`/produto/${result.data.slug}`);
  revalidatePath("/admin/produtos");
  redirect(`/admin/produtos/${productId}`);
}

export async function deleteProductAction(formData: FormData) {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const id = String(formData.get("id"));
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/admin/produtos");
  redirect("/admin/produtos");
}

function parseVariants(raw: string): Array<Pick<ProductVariant, "size" | "color" | "stock" | "price_cents" | "active">> {
  try {
    const parsed = JSON.parse(raw) as Array<Record<string, unknown>>;
    return parsed.map((item) => ({
      size: String(item.size || ""),
      color: String(item.color || ""),
      stock: Number(item.stock || 0),
      price_cents: item.price_cents ? Number(item.price_cents) : null,
      active: item.active !== false,
    }));
  } catch {
    return [];
  }
}

function isSupabaseSchemaCacheError(error: { code?: string; message?: string }) {
  return error.code === "PGRST205" || error.message?.includes("schema cache");
}
