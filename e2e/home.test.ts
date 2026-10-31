import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("home page opens in Bahasa Indonesia", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "id");
  await expect(
    page.getByRole("heading", { level: 1, name: "Portolab" }),
  ).toBeVisible();
  await expect(page.getByText("Simulasi.")).toBeVisible();
});

test("language switch changes the page to English and back", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "English" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByText("Simulation.")).toBeVisible();
  await expect(page.getByRole("button", { name: "English" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  await page.getByRole("button", { name: "Bahasa Indonesia" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "id");
});

test("home page has no accessibility violations", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test("unknown address shows the not found page in Bahasa Indonesia", async ({
  page,
}) => {
  const response = await page.goto("/tidak-ada");
  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { level: 1, name: "Halaman tidak ditemukan" }),
  ).toBeVisible();
});

test("health check reports ok", async ({ request }) => {
  const response = await request.get("/health");
  expect(response.ok()).toBe(true);
  expect(await response.json()).toEqual({ status: "ok" });
});
