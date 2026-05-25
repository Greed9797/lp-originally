import { describe, expect, it } from "vitest";
import { centsToVariantPriceInput, variantPriceInputToCents } from "../admin/variants";

describe("admin variant formatting", () => {
  it("formats variant optional price as Brazilian currency input", () => {
    expect(centsToVariantPriceInput(19990)).toBe("199,90");
    expect(centsToVariantPriceInput(null)).toBe("");
  });

  it("parses typed variant optional price to cents", () => {
    expect(variantPriceInputToCents("199,90")).toBe(19990);
    expect(variantPriceInputToCents("R$ 1.299,50")).toBe(129950);
    expect(variantPriceInputToCents("")).toBeNull();
  });
});
