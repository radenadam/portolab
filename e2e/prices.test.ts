import { expect, test } from "@playwright/test";
import { expectAccessibleScreen } from "./expect-accessible-screen.ts";
import { switchToEnglish } from "./switch-to-english.ts";

// The server runs with the fixture price source, which returns the closing quotes of 30 October 2026.

test("shows delayed prices in Bahasa Indonesia", async ({ page }) => {
  await page.goto("/prices");
  await expect(page).toHaveTitle("Harga saham | Portolab");
  await expect(
    page.getByRole("heading", { level: 1, name: "Harga saham" }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Harga tertunda sekitar 10 menit dan berasal dari Yahoo Finance. Harga terakhir tercatat pada 30 Okt 2026, 16.14 WIB.",
    ),
  ).toBeVisible();

  const bbca = page.getByRole("row", { name: /BBCA/ });
  await expect(bbca).toContainText("4.980");
  await expect(bbca).toContainText("+0,81%");
  await expect(bbca).toContainText("16.14");

  const ihsg = page.getByRole("row", { name: /IHSG/ });
  await expect(ihsg).toContainText("5.057,05");
  await expect(ihsg).toContainText("-0,80%");

  await expect(page.getByRole("row", { name: /TLKM/ })).toContainText("0,00%");
});

test("shows delayed prices in English", async ({ page }) => {
  await switchToEnglish(page);
  await page.goto("/prices");
  await expect(page).toHaveTitle("Stock prices | Portolab");
  await expect(
    page.getByRole("heading", { level: 1, name: "Stock prices" }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Prices are delayed by about 10 minutes and come from Yahoo Finance. The latest price was recorded at Oct 30, 2026, 4:14 PM WIB.",
    ),
  ).toBeVisible();
  const bbca = page.getByRole("row", { name: /BBCA/ });
  await expect(bbca).toContainText("IDR 4,980");
  await expect(bbca).toContainText("+0.81%");
  await expect(bbca).toContainText("4:14 PM");
});

test("shows each change in price with a sign and an arrow", async ({
  page,
}) => {
  await page.goto("/prices");
  const bbca = page.getByRole("row", { name: /BBCA/ });
  await expect(bbca).toContainText("▲");
  await expect(bbca).toContainText("+");
  await expect(page.getByRole("row", { name: /IHSG/ })).toContainText("▼");
});

test("aligns every number and time of the table to the right", async ({
  page,
}) => {
  await page.goto("/prices");
  const cells = page.getByRole("row", { name: /BBCA/ }).getByRole("cell");
  await expect(cells).toHaveCount(3);
  for (const cell of await cells.all()) {
    await expect(cell).toHaveCSS("text-align", "right");
  }
});

test("passes the accessibility checks on the prices page", async ({ page }) => {
  await page.goto("/prices");
  await expect(page.getByRole("table")).toBeVisible();
  await expectAccessibleScreen(page);
});

test("links the home page to the prices", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Lihat harga saham" }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Harga saham" }),
  ).toBeVisible();
});
