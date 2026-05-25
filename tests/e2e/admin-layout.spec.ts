import { expect, test } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";

const localEnv = readLocalEnv();

test.describe("admin layout polish", () => {
  test.beforeEach(async ({ page }) => {
    const email = process.env.ADMIN_EMAIL || localEnv.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD || localEnv.ADMIN_PASSWORD;
    test.skip(!email || !password, "ADMIN_EMAIL and ADMIN_PASSWORD are required for admin layout smoke tests.");

    await page.goto("/admin/login");
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="password"]').fill(password);
    await page.getByRole("button", { name: /entrar/i }).click();
    await page.waitForURL("**/admin");
  });

  test("vitrines product selector does not overflow horizontally", async ({ page }) => {
    await page.setViewportSize({ width: 1365, height: 768 });
    await page.goto("/admin/vitrines");

    const overflow = await page.locator(".admin-product-selector").first().evaluate((element) => ({
      selector: element.scrollWidth - element.clientWidth,
      card: Array.from(element.querySelectorAll(".admin-selector-card")).reduce(
        (max, card) => Math.max(max, card.scrollWidth - card.clientWidth),
        0,
      ),
    }));

    expect(overflow.selector).toBeLessThanOrEqual(1);
    expect(overflow.card).toBeLessThanOrEqual(1);
  });

  test("categorias uses a Shopify-like index table instead of legacy edit rows", async ({ page }) => {
    await page.goto("/admin/categorias");

    await expect(page.locator(".admin-edit-list")).toHaveCount(0);
    await expect(page.locator(".admin-category-table table")).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Categoria" })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Slug" })).toBeVisible();
  });
});

function readLocalEnv() {
  if (!existsSync(".env.local")) return {} as Record<string, string>;
  return Object.fromEntries(
    readFileSync(".env.local", "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1).replace(/^['"]|['"]$/g, "")];
      }),
  );
}
