import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// The server runs with the fixture price source, which returns the closing quotes of 30 October 2026.

test("prices page shows delayed prices in Bahasa Indonesia", async ({
  page,
}) => {
  await page.goto("/prices");
  await expect(
    page.getByRole("heading", { level: 1, name: "Harga saham" }),
  ).toBeVisible();
  await expect(page.getByText("Harga tertunda sekitar 10 menit")).toBeVisible();
  await expect(page.getByText("30 Okt 2026, 16.14 WIB")).toBeVisible();

  const bbca = page.getByRole("row", { name: /BBCA/ });
  await expect(bbca).toContainText("4.980");
  await expect(bbca).toContainText("+0,81%");

  const ihsg = page.getByRole("row", { name: /IHSG/ });
  await expect(ihsg).toContainText("5.057,05");
  await expect(ihsg).toContainText("-0,80%");

  await expect(page.getByRole("row", { name: /TLKM/ })).toContainText("0,00%");
});

test("prices page formats numbers in English after switching", async ({
  page,
}) => {
  await page.goto("/prices");
  await page.getByRole("button", { name: "English" }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Stock prices" }),
  ).toBeVisible();
  await expect(page.getByRole("row", { name: /BBCA/ })).toContainText(
    "IDR 4,980",
  );
  await expect(page.getByText("Oct 30, 2026, 4:14 PM WIB")).toBeVisible();
});

test("a change in price is never shown by color alone", async ({ page }) => {
  await page.goto("/prices");
  const bbca = page.getByRole("row", { name: /BBCA/ });
  await expect(bbca).toContainText("▲");
  await expect(bbca).toContainText("+");
  await expect(page.getByRole("row", { name: /IHSG/ })).toContainText("▼");
});

test("prices page has no accessibility violations", async ({ page }) => {
  await page.goto("/prices");
  await expect(page.getByRole("table")).toBeVisible();
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test("home page links to the prices", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Lihat harga saham" }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Harga saham" }),
  ).toBeVisible();
});
