import { expect, test } from "@playwright/test";

test("single image product keeps a large Shopify-like product media area", async ({ page }) => {
  await page.setViewportSize({ width: 1220, height: 820 });
  await page.goto("/produto/cama-kit-urban-puppy-166085723");

  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const mediaBox = await page.locator(".product-gallery-main").boundingBox();

  expect(mediaBox?.width ?? 0).toBeGreaterThan(420);
  expect(mediaBox?.height ?? 0).toBeGreaterThan(420);
  await expect(page.locator(".product-gallery-count")).toContainText("1 imagem");
});
