import { describe, expect, it } from "vitest";
import { sampleProducts, sampleSettings } from "../sample-data";
import { buildProductMessage, buildTrackedWhatsAppUrl, buildWhatsAppUrl } from "../whatsapp";

describe("whatsapp helpers", () => {
  it("builds a product message with variation, price and link", () => {
    const product = sampleProducts[0];
    const message = buildProductMessage({
      product,
      variant: product.variants[1],
      siteUrl: "https://originally.test",
      settings: sampleSettings,
    });

    expect(message).toContain("Produto: Sueter ou Vestido Encanto");
    expect(message).toContain("Variacao: tamanho M, cor Azul");
    expect(message).toContain("R$");
    expect(message).toContain("https://originally.test/produto/sueter-vestido-encanto");
  });

  it("keeps only digits in the whatsapp URL number", () => {
    expect(buildWhatsAppUrl("+55 (11) 99999-9999", "ola")).toBe("https://wa.me/5511999999999?text=ola");
  });

  it("builds internal tracked WhatsApp URLs without exposing the final message", () => {
    const product = sampleProducts[0];
    const href = buildTrackedWhatsAppUrl({
      product,
      variant: product.variants[1],
      placement: "product",
      sourcePath: "/produto/sueter-vestido-encanto",
    });

    expect(href).toBe("/api/whatsapp/redirect?product=sueter-vestido-encanto&variant=v2&placement=product&source=%2Fproduto%2Fsueter-vestido-encanto");
    expect(href).not.toContain("Ola");
    expect(href).not.toContain("R$");
  });
});
