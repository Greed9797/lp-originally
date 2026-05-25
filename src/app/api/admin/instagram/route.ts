import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getCurrentAdmin } from "@/lib/auth";
import { hasServiceRoleEnv } from "@/lib/supabase/env";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

const BUCKET = "site-assets";
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_TILES = 12;

export async function POST(request: Request) {
  if (!hasServiceRoleEnv()) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY nao configurada." }, { status: 500 });
  }
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });

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
  const { count, error: countError } = await supabase
    .from("instagram_tiles")
    .select("id", { count: "exact", head: true });
  if (countError) return NextResponse.json({ error: countError.message }, { status: 500 });
  if ((count || 0) + files.length > MAX_TILES) {
    return NextResponse.json({ error: `O Instagram da home aceita no maximo ${MAX_TILES} imagens.` }, { status: 400 });
  }

  const rows = [];
  for (const [index, file] of files.entries()) {
    const ext = sanitizeExtension(file.name.split(".").pop() || "jpg");
    const path = `instagram/${crypto.randomUUID()}-${index}.${ext}`;
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
      cacheControl: "31536000",
      upsert: false,
      contentType: file.type,
    });
    if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 });
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    rows.push({
      image_url: data.publicUrl,
      storage_path: path,
      alt_text: file.name,
      sort_order: (count || 0) + index,
      active: true,
    });
  }

  const { data: inserted, error } = await supabase.from("instagram_tiles").insert(rows).select("*");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidateInstagram();
  return NextResponse.json({ ok: true, tiles: inserted });
}

export async function DELETE(request: Request) {
  if (!hasServiceRoleEnv()) {
    return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY nao configurada." }, { status: 500 });
  }
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ error: "Nao autenticado." }, { status: 401 });

  const body = await request.json().catch(() => null) as { id?: string } | null;
  const id = String(body?.id || "");
  if (!id) return NextResponse.json({ error: "Imagem nao informada." }, { status: 400 });

  const supabase = createSupabaseServiceClient();
  const { data: tile, error: tileError } = await supabase
    .from("instagram_tiles")
    .select("id,storage_path")
    .eq("id", id)
    .maybeSingle();
  if (tileError) return NextResponse.json({ error: tileError.message }, { status: 500 });
  if (!tile) return NextResponse.json({ error: "Imagem nao encontrada." }, { status: 404 });

  if (tile.storage_path) {
    const { error: storageError } = await supabase.storage.from(BUCKET).remove([tile.storage_path]);
    if (storageError) return NextResponse.json({ error: storageError.message }, { status: 500 });
  }

  const { error } = await supabase.from("instagram_tiles").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidateInstagram();
  return NextResponse.json({ ok: true });
}

function sanitizeExtension(ext: string) {
  const clean = ext.toLowerCase().replace(/[^a-z0-9]/g, "");
  return clean || "jpg";
}

function revalidateInstagram() {
  revalidatePath("/");
  revalidatePath("/admin/instagram");
}
