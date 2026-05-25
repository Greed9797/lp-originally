import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getCurrentAdmin } from "@/lib/auth";
import { hasServiceRoleEnv } from "@/lib/supabase/env";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { assertImageLimit } from "@/lib/validation";

const BUCKET = "product-images";
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasServiceRoleEnv()) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY nao configurada." }, { status: 500 });
  }
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });

  const { id } = await params;
  const formData = await request.formData();
  const files = formData.getAll("files").filter((item): item is File => item instanceof File && item.size > 0);
  if (!files.length) return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
  if (files.some((file) => !file.type.startsWith("image/"))) {
    return NextResponse.json({ error: "Envie apenas imagens." }, { status: 400 });
  }
  if (files.some((file) => file.size > MAX_FILE_SIZE)) {
    return NextResponse.json({ error: "Cada imagem deve ter no maximo 5MB." }, { status: 400 });
  }

  const supabase = createSupabaseServiceClient();
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id,slug")
    .eq("id", id)
    .maybeSingle();
  if (productError) return NextResponse.json({ error: productError.message }, { status: 500 });
  if (!product) return NextResponse.json({ error: "Produto nao encontrado." }, { status: 404 });

  const { count, error: countError } = await supabase
    .from("product_images")
    .select("id", { count: "exact", head: true })
    .eq("product_id", id);
  if (countError) return NextResponse.json({ error: countError.message }, { status: 500 });

  try {
    assertImageLimit(count || 0, files.length);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Limite de imagens excedido." }, { status: 400 });
  }

  const rows = [];
  for (const [index, file] of files.entries()) {
    const ext = sanitizeExtension(file.name.split(".").pop() || "jpg");
    const path = `${id}/${crypto.randomUUID()}-${index}.${ext}`;
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
      cacheControl: "31536000",
      upsert: false,
      contentType: file.type,
    });
    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    rows.push({
      product_id: id,
      url: data.publicUrl,
      alt: file.name,
      storage_path: path,
      order_index: (count || 0) + index,
    });
  }

  const { data: insertedImages, error } = await supabase.from("product_images").insert(rows).select("*");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidateProductPaths(id, product.slug);
  return NextResponse.json({ ok: true, images: insertedImages });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasServiceRoleEnv()) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY nao configurada." }, { status: 500 });
  }
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null) as { imageId?: string } | null;
  const imageId = String(body?.imageId || "");
  if (!imageId) return NextResponse.json({ error: "Imagem nao informada." }, { status: 400 });

  const supabase = createSupabaseServiceClient();
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id,slug")
    .eq("id", id)
    .maybeSingle();
  if (productError) return NextResponse.json({ error: productError.message }, { status: 500 });
  if (!product) return NextResponse.json({ error: "Produto nao encontrado." }, { status: 404 });

  const { data: image, error: imageError } = await supabase
    .from("product_images")
    .select("id,storage_path")
    .eq("id", imageId)
    .eq("product_id", id)
    .maybeSingle();
  if (imageError) return NextResponse.json({ error: imageError.message }, { status: 500 });
  if (!image) return NextResponse.json({ error: "Imagem nao encontrada." }, { status: 404 });

  if (image.storage_path) {
    const { error: storageError } = await supabase.storage.from(BUCKET).remove([image.storage_path]);
    if (storageError) return NextResponse.json({ error: storageError.message }, { status: 500 });
  }

  const { error: deleteError } = await supabase
    .from("product_images")
    .delete()
    .eq("id", imageId)
    .eq("product_id", id);
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

  revalidateProductPaths(id, product.slug);
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!hasServiceRoleEnv()) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY nao configurada." }, { status: 500 });
  }
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null) as { imageId?: string; direction?: "up" | "down"; intent?: "cover"; orderedIds?: string[] } | null;
  if (!body?.imageId && !body?.orderedIds?.length) {
    return NextResponse.json({ error: "Imagem ou ordem nao informada." }, { status: 400 });
  }

  const supabase = createSupabaseServiceClient();
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id,slug")
    .eq("id", id)
    .maybeSingle();
  if (productError) return NextResponse.json({ error: productError.message }, { status: 500 });
  if (!product) return NextResponse.json({ error: "Produto nao encontrado." }, { status: 404 });

  const { data: images, error: imagesError } = await supabase
    .from("product_images")
    .select("id,order_index")
    .eq("product_id", id)
    .order("order_index", { ascending: true });
  if (imagesError) return NextResponse.json({ error: imagesError.message }, { status: 500 });
  if (!images?.length) return NextResponse.json({ error: "Produto sem imagens." }, { status: 400 });

  const orderedIds = resolveImageOrder(
    images.map((image) => image.id),
    body,
  );
  if (!orderedIds.length) return NextResponse.json({ error: "Ordem invalida." }, { status: 400 });

  for (const [order_index, imageId] of orderedIds.entries()) {
    const { error } = await supabase
      .from("product_images")
      .update({ order_index })
      .eq("id", imageId)
      .eq("product_id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  revalidateProductPaths(id, product.slug);
  return NextResponse.json({ ok: true, orderedIds });
}

function sanitizeExtension(ext: string) {
  const clean = ext.toLowerCase().replace(/[^a-z0-9]/g, "");
  return clean || "jpg";
}

function revalidateProductPaths(id: string, slug?: string | null) {
  revalidatePath("/");
  revalidatePath("/admin/produtos");
  revalidatePath(`/admin/produtos/${id}`);
  if (slug) revalidatePath(`/produto/${slug}`);
}

function resolveImageOrder(currentIds: string[], body: { imageId?: string; direction?: "up" | "down"; intent?: "cover"; orderedIds?: string[] }) {
  if (body.orderedIds?.length) {
    const unique = body.orderedIds.filter((id, index, all) => currentIds.includes(id) && all.indexOf(id) === index);
    return [...unique, ...currentIds.filter((id) => !unique.includes(id))];
  }

  const imageId = body.imageId;
  if (!imageId || !currentIds.includes(imageId)) return [];
  if (body.intent === "cover") return [imageId, ...currentIds.filter((id) => id !== imageId)];

  const nextIds = [...currentIds];
  const index = nextIds.indexOf(imageId);
  const targetIndex = body.direction === "up" ? index - 1 : body.direction === "down" ? index + 1 : index;
  if (targetIndex < 0 || targetIndex >= nextIds.length || targetIndex === index) return nextIds;
  [nextIds[index], nextIds[targetIndex]] = [nextIds[targetIndex], nextIds[index]];
  return nextIds;
}
