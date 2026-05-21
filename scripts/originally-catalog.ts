#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import {
  fetchMercosCatalog,
  normalizeMercosCatalog,
  type MercosCatalogSnapshot,
  type NormalizedCatalog,
  type NormalizedImage,
} from "../src/lib/import/originally";
import { importCatalogToSupabase } from "../src/lib/import/supabase";

const IMPORT_ROOT = path.join(process.cwd(), "imports", "originally");
const RAW_DIR = path.join(IMPORT_ROOT, "raw");
const NORMALIZED_DIR = path.join(IMPORT_ROOT, "normalized");
const ASSETS_DIR = path.join(IMPORT_ROOT, "assets");

type Args = {
  command: "collect" | "normalize" | "download-assets" | "import" | "all";
  input?: string;
  fromLive: boolean;
  downloadAssets: boolean;
  uploadImages: boolean;
};

async function main() {
  loadDotenv(".env.local");
  loadDotenv(".env");

  const args = parseArgs(process.argv.slice(2));
  await mkdir(RAW_DIR, { recursive: true });
  await mkdir(NORMALIZED_DIR, { recursive: true });

  if (args.command === "collect" || args.command === "all") {
    const { rawPath, normalizedPath, catalog } = await collectAndNormalize();
    if (args.downloadAssets || args.command === "all") await downloadAssets(catalog);
    console.log(`Snapshot salvo: ${rawPath}`);
    console.log(`Catalogo normalizado: ${normalizedPath}`);
    if (args.command === "collect") return;
    if (args.command === "all" && !hasSupabaseServiceEnv()) return;
    if (args.command === "all") {
      await importToSupabase(catalog, args.uploadImages);
      return;
    }
  }

  if (args.command === "normalize") {
    const raw = await readJson<MercosCatalogSnapshot>(args.input || latestPath(RAW_DIR, "catalog-"));
    const catalog = normalizeMercosCatalog(raw);
    const normalizedPath = await writeNormalizedCatalog(catalog);
    console.log(`Catalogo normalizado: ${normalizedPath}`);
    return;
  }

  if (args.command === "download-assets") {
    const catalog = await readJson<NormalizedCatalog>(args.input || path.join(NORMALIZED_DIR, "catalog.json"));
    await downloadAssets(catalog);
    return;
  }

  if (args.command === "import") {
    const catalog = args.fromLive ? (await collectAndNormalize()).catalog : await readJson<NormalizedCatalog>(args.input || path.join(NORMALIZED_DIR, "catalog.json"));
    await importToSupabase(catalog, args.uploadImages);
  }
}

async function collectAndNormalize() {
  const raw = await fetchMercosCatalog({
    token: process.env.MERCOS_B2B_TOKEN,
    cookie: process.env.MERCOS_B2B_COOKIE,
  });
  const catalog = normalizeMercosCatalog(raw);
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rawPath = path.join(RAW_DIR, `catalog-${date}.json`);
  const normalizedPath = await writeNormalizedCatalog(catalog);
  await writeJson(rawPath, raw);
  return { rawPath, normalizedPath, catalog };
}

async function writeNormalizedCatalog(catalog: NormalizedCatalog) {
  const normalizedPath = path.join(NORMALIZED_DIR, "catalog.json");
  const assetsManifestPath = path.join(NORMALIZED_DIR, "assets-manifest.json");
  await writeJson(normalizedPath, catalog);
  await writeJson(assetsManifestPath, catalog.assets);
  return normalizedPath;
}

async function downloadAssets(catalog: NormalizedCatalog) {
  let downloaded = 0;
  let skipped = 0;
  await Promise.all([
    mkdir(path.join(ASSETS_DIR, "products"), { recursive: true }),
    mkdir(path.join(ASSETS_DIR, "collections"), { recursive: true }),
    mkdir(path.join(ASSETS_DIR, "brand"), { recursive: true }),
  ]);

  for (const product of catalog.products) {
    const productDir = path.join(ASSETS_DIR, "products", product.slug);
    await mkdir(productDir, { recursive: true });
    for (const image of product.images) {
      const filePath = path.join(productDir, `image-${String(image.orderIndex + 1).padStart(2, "0")}${extensionFromUrl(image.sourceUrl)}`);
      const ok = await downloadImage(image, filePath);
      if (ok) downloaded += 1;
      else skipped += 1;
      await sleep(120);
    }
  }

  for (const collection of catalog.assets.collections) {
    const sourceUrl = collection.bannerUrl || collection.imageUrl;
    if (!sourceUrl) continue;
    const filePath = path.join(ASSETS_DIR, "collections", `${collection.categorySlug}${extensionFromUrl(sourceUrl)}`);
    const ok = await downloadImage({ sourceUrl, alt: collection.categorySlug, orderIndex: 0, contentHash: "" }, filePath);
    if (ok) downloaded += 1;
    else skipped += 1;
    await sleep(120);
  }

  for (const [index, asset] of catalog.assets.brand.entries()) {
    const suffix = createHash("sha1").update(asset.sourceUrl).digest("hex").slice(0, 8);
    const fileName = `${asset.kind}-${String(index + 1).padStart(2, "0")}-${suffix}${extensionFromUrl(asset.sourceUrl)}`;
    const filePath = path.join(ASSETS_DIR, "brand", fileName);
    const ok = await downloadImage({ sourceUrl: asset.sourceUrl, alt: asset.kind, orderIndex: asset.orderIndex, contentHash: "" }, filePath);
    if (ok) downloaded += 1;
    else skipped += 1;
    await sleep(120);
  }

  console.log(`Assets baixados: ${downloaded}; ignorados: ${skipped}; pasta: ${ASSETS_DIR}`);
}

async function downloadImage(image: NormalizedImage, filePath: string) {
  try {
    const response = await fetch(image.sourceUrl, {
      headers: { "User-Agent": "OriginallyStoreImporter/1.0" },
    });
    if (!response.ok) return false;
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) return false;
    const bytes = Buffer.from(await response.arrayBuffer());
    const hash = createHash("sha1").update(bytes).digest("hex");
    await writeFile(filePath, bytes);
    await writeJson(`${filePath}.json`, {
      sourceUrl: image.sourceUrl,
      alt: image.alt,
      bytes: bytes.byteLength,
      contentType,
      sha1: hash,
    });
    return true;
  } catch {
    return false;
  }
}

async function importToSupabase(catalog: NormalizedCatalog, uploadImages: boolean) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY antes de importar para o Supabase.");
  }
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const result = await importCatalogToSupabase({ supabase, catalog, uploadImages });
  console.log(
    JSON.stringify(
      {
        runId: result.runId,
        productsSeen: result.productsSeen,
        productsImported: result.productsImported,
        categoriesImported: result.categoriesImported,
        imagesSeen: result.imagesSeen,
        imagesUploaded: result.imagesUploaded,
        errors: result.errors.length,
      },
      null,
      2,
    ),
  );
  if (result.errors.length) process.exitCode = 1;
}

function parseArgs(argv: string[]): Args {
  const command = (argv.find((item) => !item.startsWith("--")) || "collect") as Args["command"];
  const valueAfter = (flag: string) => {
    const index = argv.indexOf(flag);
    return index >= 0 ? argv[index + 1] : undefined;
  };
  return {
    command,
    input: valueAfter("--input"),
    fromLive: argv.includes("--from-live"),
    downloadAssets: argv.includes("--download-assets"),
    uploadImages: !argv.includes("--no-upload-images"),
  };
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await readFile(filePath, "utf8")) as T;
}

async function writeJson(filePath: string, value: unknown) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function latestPath(dir: string, prefix: string): string {
  throw new Error(`Informe --input para este comando ou gere um arquivo em ${dir} com prefixo ${prefix}.`);
}

function loadDotenv(fileName: string) {
  try {
    if (!existsSync(fileName)) return;
    const content = readFileSync(fileName, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
      const index = trimmed.indexOf("=");
      const key = trimmed.slice(0, index).trim();
      const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    return;
  }
}

function extensionFromUrl(url: string) {
  const ext = url.split("?")[0]?.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "");
  return ext && ["jpg", "jpeg", "png", "webp", "gif"].includes(ext) ? `.${ext}` : ".jpg";
}

function hasSupabaseServiceEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Falha inesperada no importador.");
  process.exitCode = 1;
});
