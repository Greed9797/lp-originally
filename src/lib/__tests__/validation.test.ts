import { describe, expect, it } from "vitest";
import { assertImageLimit, normalizeProductInput } from "../validation";

describe("validation", () => {
  it("normalizes product input and generates slug", () => {
    const product = normalizeProductInput({
      name: "Macacão Soft Comfort",
      description: "Descricao suficientemente grande.",
      price_cents: 12990,
      status: "published",
      featured: true,
      variants: [{ size: "P", color: "Cocoa", stock: 2, price_cents: null, active: true }],
    });

    expect(product.slug).toBe("macacao-soft-comfort");
    expect(product.variants).toHaveLength(1);
  });

  it("enforces max 12 images per product", () => {
    expect(() => assertImageLimit(11, 2)).toThrow("12 imagens");
    expect(() => assertImageLimit(10, 2)).not.toThrow();
  });
});
