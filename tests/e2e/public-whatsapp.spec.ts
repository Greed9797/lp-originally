import { expect, test } from "@playwright/test";

test("public product flow opens a whatsapp link", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /ver produto/i }).first().click();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const whatsapp = page.getByRole("link", { name: /whatsapp/i }).first();
  await expect(whatsapp).toHaveAttribute("href", /https:\/\/wa.me\//);
});
