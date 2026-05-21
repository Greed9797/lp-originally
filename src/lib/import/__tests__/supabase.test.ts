import { describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeMercosCatalog, type MercosCatalogSnapshot } from "../originally";
import { importCatalogToSupabase } from "../supabase";

describe("Supabase catalog importer", () => {
  it("upserts categories, products, variants and image rows without duplication keys", async () => {
    const calls: Array<{ table: string; op: string; value?: unknown; options?: unknown }> = [];
    const supabase = createFakeSupabase(calls);
    const catalog = normalizeMercosCatalog(snapshot);

    const result = await importCatalogToSupabase({ supabase, catalog, uploadImages: false });

    expect(result.productsSeen).toBe(1);
    expect(result.productsImported).toBe(1);
    expect(result.imagesUploaded).toBe(1);
    expect(calls).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ table: "categories", op: "upsert", options: { onConflict: "source_platform,source_id" } }),
        expect.objectContaining({ table: "products", op: "upsert", options: { onConflict: "source_platform,source_id" } }),
        expect.objectContaining({ table: "product_images", op: "upsert", options: { onConflict: "product_id,source_url" } }),
      ]),
    );
  });
});

const snapshot: MercosCatalogSnapshot = {
  source: {
    platform: "mercos",
    siteUrl: "https://www.originallypet.com.br",
    apiBaseUrl: "https://app.mercos.com/api_b2b/v1",
  },
  fetchedAt: "2026-05-21T00:00:00.000Z",
  endpoints: {},
  data: {
    categories: [{ categoria_id: 10, nome: "Camas" }],
    products: [
      {
        produto_id: 99,
        nome: "Cama Oval Toffee",
        categoria_id: 10,
        preco: 249.9,
        imagens: ["https://example.com/a.png"],
        grades_v3: [{ produto_id: 100, codigo: "P2225" }],
      },
    ],
  },
};

function createFakeSupabase(calls: Array<{ table: string; op: string; value?: unknown; options?: unknown }>) {
  return {
    from(table: string) {
      return {
        insert(value: unknown) {
          calls.push({ table, op: "insert", value });
          return chain(table);
        },
        upsert(value: unknown, options?: unknown) {
          calls.push({ table, op: "upsert", value, options });
          return { error: null };
        },
        update(value: unknown) {
          calls.push({ table, op: "update", value });
          return chain(table);
        },
        delete() {
          calls.push({ table, op: "delete" });
          return chain(table);
        },
        select() {
          calls.push({ table, op: "select" });
          return chain(table);
        },
      };
    },
  } as unknown as SupabaseClient;

  function chain(table: string) {
    return {
      select() {
        return this;
      },
      maybeSingle() {
        if (table === "import_runs") return { data: { id: "run-1" }, error: null };
        return { data: null, error: null };
      },
      eq() {
        return this;
      },
      in() {
        if (table === "categories") return { data: [{ id: "cat-1", source_id: "10" }], error: null };
        if (table === "products") return { data: [{ id: "prod-1", slug: "cama-oval-toffee-99", source_id: "99" }], error: null };
        return { data: [], error: null };
      },
      then(resolve: (value: { error: null }) => void) {
        resolve({ error: null });
      },
    };
  }
}
