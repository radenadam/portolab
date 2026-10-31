import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { expectAccessibleScreen } from "./expect-accessible-screen.ts";
import { switchToEnglish } from "./switch-to-english.ts";

test("opens the home page in Bahasa Indonesia", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("lang", "id");
  await expect(
    page.getByRole("heading", { level: 1, name: "Portolab" }),
  ).toBeVisible();
  await expect(page.getByText("Simulasi.")).toBeVisible();
});

test("switches the page to English and back", async ({ page }) => {
  await switchToEnglish(page);
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
  await switchToEnglish(page);
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

// The server never fails on purpose. So the reader leaves a page through its link and goes back, and the test makes the data request of that return fail, as a server that fails would.
async function failOnReturnTo(
  page: Page,
  path: string,
  linkName: string,
): Promise<void> {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
  await page.getByRole("link", { name: linkName }).click();
  await expect(page).toHaveURL("/");
  await page.route(/\.data(\?|$)/, (route) => route.fulfill({ status: 500 }));
  await page.goBack();
}

test("shows the page for an unexpected failure in Bahasa Indonesia", async ({
  page,
}) => {
  await failOnReturnTo(page, "/tidak-ada", "Kembali ke beranda");
  await expect(
    page.getByRole("heading", { level: 1, name: "Terjadi kesalahan" }),
  ).toBeVisible();
  await expect(page).toHaveTitle("Terjadi kesalahan | Portolab");
  await expectAccessibleScreen(page);
});

test("shows the page for an unexpected failure in English", async ({
  page,
}) => {
  await switchToEnglish(page);
  await failOnReturnTo(page, "/not-here", "Back to the home page");
  await expect(
    page.getByRole("heading", { level: 1, name: "Something went wrong" }),
  ).toBeVisible();
  await expect(page).toHaveTitle("Something went wrong | Portolab");
});

test("reports ok from the health check", async ({ request }) => {
  const response = await request.get("/health");
  expect(response.ok()).toBe(true);
  expect(await response.json()).toEqual({ status: "ok" });
});
