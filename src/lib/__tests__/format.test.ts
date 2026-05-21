import { describe, expect, it } from "vitest";
import { formatPrice, parseCurrencyToCents, slugify } from "../format";

describe("format helpers", () => {
  it("formats cents as BRL", () => {
    expect(formatPrice(18990)).toBe("R$ 189,90");
  });

  it("slugifies Portuguese product names", () => {
    expect(slugify("Cama Ortopédica Luxo!")).toBe("cama-ortopedica-luxo");
  });

  it("parses Brazilian currency input to cents", () => {
    expect(parseCurrencyToCents("1.249,90")).toBe(124990);
  });
});
