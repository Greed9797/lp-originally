import { expect, test } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";

const localEnv = readLocalEnv();

test("admin has a Shopify-like Instagram CRUD surface", async ({ page }) => {
  const email = process.env.ADMIN_EMAIL || localEnv.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD || localEnv.ADMIN_PASSWORD;
  test.skip(!email || !password, "ADMIN_EMAIL and ADMIN_PASSWORD are required for admin Instagram tests.");

  await page.goto("/admin/login");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: /entrar/i }).click();
  await page.waitForURL("**/admin");

  await page.goto("/admin/instagram");
  await expect(page.getByRole("heading", { name: "Instagram", exact: true })).toBeVisible();
  await expect(page.locator(".admin-instagram-upload")).toBeVisible();
  await expect(page.locator(".admin-instagram-grid")).toBeVisible();
  await expect(page.getByRole("button", { name: /Salvar Instagram/i })).toBeVisible();
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
