import { describe, expect, it } from "vitest";
import { sampleProducts, sampleSettings } from "../sample-data";
import { buildProductMessage, buildWhatsAppUrl } from "../whatsapp";

describe("whatsapp helpers", () => {
  it("builds a product message with variation, price and link", () => {
    const product = sampleProducts[0];
    const message = buildProductMessage({
      product,
      variant: product.variants[1],
      siteUrl: "https://originally.test",
      settings: sampleSettings,
    });

    expect(message).toContain("Produto: Jaqueta Corta Vento Sherpa");
    expect(message).toContain("Variacao: tamanho M, cor Toffee");
    expect(message).toContain("R$");
    expect(message).toContain("https://originally.test/produto/jaqueta-corta-vento-sherpa");
  });

  it("keeps only digits in the whatsapp URL number", () => {
    expect(buildWhatsAppUrl("+55 (11) 99999-9999", "ola")).toBe("https://wa.me/5511999999999?text=ola");
  });
});
