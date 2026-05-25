import { describe, expect, it } from "vitest";
import { sampleCategories, sampleProducts } from "../sample-data";
import { filterAdminProducts, summarizeProductIndex } from "../admin/products";

describe("admin product helpers", () => {
  it("filters products by search, category, status and image state", () => {
    const results = filterAdminProducts(sampleProducts, {
      query: "cama",
      categoryId: sampleCategories[1].id,
      status: "published",
      imageState: "with-images",
      priceState: "priced",
      sort: "name-asc",
    });

    expect(results.map((product) => product.name)).toEqual(["Cama Oval NUVEM BabySoft"]);
  });

  it("summarizes product index counts for Shopify-like badges", () => {
    const summary = summarizeProductIndex(sampleProducts);

    expect(summary.total).toBe(4);
    expect(summary.published).toBe(4);
    expect(summary.withImages).toBe(4);
    expect(summary.withoutPrice).toBe(0);
  });
});
