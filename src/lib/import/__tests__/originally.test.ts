import { describe, expect, it, vi } from "vitest";
import {
  fetchMercosCatalog,
  normalizeMercosCatalog,
  normalizeProduct,
  parseMercosPriceToCents,
  type MercosCatalogSnapshot,
} from "../originally";

const snapshot: MercosCatalogSnapshot = {
  source: {
    platform: "mercos",
    siteUrl: "https://www.originallypet.com.br",
    apiBaseUrl: "https://app.mercos.com/api_b2b/v1",
  },
  fetchedAt: "2026-05-21T00:00:00.000Z",
  endpoints: {},
  data: {
    categories: [
      {
        categoria_id: 10,
        nome: "Camas",
        subcategorias: [{ categoria_id: 11, nome: "Baby Soft" }],
      },
    ],
    featured: [{ produtos: [{ produto_id: 99 }] }],
    products: [
      {
        produto_id: 99,
        nome: "Cama Oval Toffee",
        codigo: "2225",
        categoria_id: 11,
        preco: 249.9,
        imagens: [
          "https://arquivos.mercos.com/media/imagem_produto/359510/a.png",
          "https://arquivos.mercos.com/media/imagem_produto/359510/a.png",
          "https://arquivos.mercos.com/media/imagem_produto/359510/b.png",
        ],
        grades_v3: [
          { produto_id: 100, codigo: "P2225", preco: 249.9, saldo_estoque: 2 },
          { produto_id: 101, codigo: "G2225", produto_sem_estoque: true },
        ],
      },
      {
        produto_id: 102,
        nome: "Produto sem preco",
        codigo: "S1",
        categoria_id: 10,
        preco: null,
        imagens: ["https://arquivos.mercos.com/media/imagem_produto/359510/c.png"],
      },
    ],
  },
};

describe("Originally Mercos import normalizer", () => {
  it("normalizes categories, products, images and variants", () => {
    const catalog = normalizeMercosCatalog(snapshot);

    expect(catalog.categories).toHaveLength(2);
    expect(catalog.categories[1]).toMatchObject({ name: "Baby Soft", sourceId: "11" });
    expect(catalog.products[0]).toMatchObject({
      name: "Cama Oval Toffee",
      slug: "cama-oval-toffee-99",
      priceCents: 24990,
      status: "published",
      featured: true,
      badge: "Destaque",
    });
    expect(catalog.products[0].images).toHaveLength(2);
    expect(catalog.products[0].variants).toHaveLength(2);
    expect(catalog.products[1]).toMatchObject({ status: "published", priceCents: 0 });
    expect(catalog.assets.products[0].images).toHaveLength(2);
  });

  it("caps product images at 12", () => {
    const product = normalizeProduct({
      produto_id: 200,
      nome: "Produto com muitas imagens",
      preco: "199,90",
      imagens: Array.from({ length: 20 }, (_, index) => `https://example.com/${index}.jpg`),
    });

    expect(product?.images).toHaveLength(12);
  });

  it("parses Mercos prices from numbers and Brazilian strings", () => {
    expect(parseMercosPriceToCents(10.5)).toBe(1050);
    expect(parseMercosPriceToCents("1.249,90")).toBe(124990);
    expect(parseMercosPriceToCents(null)).toBe(0);
  });

  it("uses the Mercos origin headers when fetching the catalog", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify([]), { status: 200, headers: { "content-type": "application/json" } }));

    await fetchMercosCatalog({ fetchImpl });

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://app.mercos.com/api_b2b/v1/produtos",
      expect.objectContaining({
        headers: expect.objectContaining({
          Origin: "https://www.originallypet.com.br",
          Referer: "https://www.originallypet.com.br/",
        }),
      }),
    );
  });

  it("fetches product detail records so the catalog includes every product image", async () => {
    const fetchImpl = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.endsWith("/produtos")) {
        return new Response(
          JSON.stringify([
            {
              produto_id: 99,
              nome: "Cama Oval Toffee",
              categoria_id: 11,
              preco: 249.9,
              imagens: ["https://example.com/cover.jpg"],
            },
          ]),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      }
      if (url.endsWith("/produtos/99")) {
        return new Response(
          JSON.stringify({
            produto_id: 99,
            nome: "Cama Oval Toffee",
            preco: 249.9,
            imagens: [
              "https://example.com/cover.jpg",
              "https://example.com/detail-01.jpg",
              "https://example.com/detail-02.jpg",
              "https://example.com/detail-03.jpg",
              "https://example.com/detail-04.jpg",
            ],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      }
      return new Response(JSON.stringify([]), { status: 200, headers: { "content-type": "application/json" } });
    });

    const raw = await fetchMercosCatalog({ fetchImpl });
    const catalog = normalizeMercosCatalog(raw);

    expect(fetchImpl).toHaveBeenCalledWith("https://app.mercos.com/api_b2b/v1/produtos/99", expect.any(Object));
    expect(catalog.products[0].categorySourceId).toBe("11");
    expect(catalog.products[0].images).toHaveLength(5);
  });
});
