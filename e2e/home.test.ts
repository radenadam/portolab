import { expect, test } from "@playwright/test";
import { expectAccessibleScreen } from "./expect-accessible-screen.ts";

test("opens the home page in Bahasa Indonesia", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "id");
  await expect(
    page.getByRole("heading", { level: 1, name: "Portolab" }),
  ).toBeVisible();
  await expect(page.getByText("Simulasi.")).toBeVisible();
});

test("switches the page to English and back", async ({ page }) => {
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

test("passes the accessibility checks on the home page", async ({ page }) => {
  await page.goto("/");
  await expectAccessibleScreen(page);
});

test("shows the not found page in Bahasa Indonesia for an unknown address", async ({
  page,
}) => {
  const response = await page.goto("/tidak-ada");
  expect(response?.status()).toBe(404);
  await expect(page.locator("html")).toHaveAttribute("lang", "id");
  await expect(page).toHaveTitle("Halaman tidak ditemukan | Portolab");
  await expect(
    page.getByRole("heading", { level: 1, name: "Halaman tidak ditemukan" }),
  ).toBeVisible();
});

test("shows the not found page in English to a reader who chose English", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "English" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  const response = await page.goto("/not-here");
  expect(response?.status()).toBe(404);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page).toHaveTitle("Page not found | Portolab");
  await expect(
    page.getByRole("heading", { level: 1, name: "Page not found" }),
  ).toBeVisible();
});

test("passes the accessibility checks on the not found page", async ({
  page,
}) => {
  await page.goto("/tidak-ada");
  await expectAccessibleScreen(page);
});

test("reports ok from the health check", async ({ request }) => {
  const response = await request.get("/health");
  expect(response.ok()).toBe(true);
  expect(await response.json()).toEqual({ status: "ok" });
});
