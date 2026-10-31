import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { expectAccessibleScreen } from "./expect-accessible-screen.ts";

// The switch offers only the languages that Portolab has, so the test changes the value of one of its buttons in the page, as a forged form would. The script is a string because the browser runs it, and the tests are type checked without the types of the browser.
async function sendUnknownLanguage(
  page: Page,
  currentValue: string,
  buttonName: string,
): Promise<void> {
  await page.evaluate(
    `document.querySelector('button[name="locale"][value="${currentValue}"]').value = "fr"`,
  );
  await page.getByRole("button", { name: buttonName }).click();
}

test("rejects an unknown language on a page in Bahasa Indonesia", async ({
  page,
}) => {
  await page.goto("/");
  await sendUnknownLanguage(page, "en", "English");
  await expect(page.locator("html")).toHaveAttribute("lang", "id");
  await expect(page).toHaveTitle("Bahasa tidak dapat diganti | Portolab");
  await expect(
    page.getByText(
      'Formulir mengirim "fr" di kolom locale, tetapi Portolab hanya tersedia dalam Bahasa Indonesia dan English. Pilih salah satunya di pengalih bahasa.',
    ),
  ).toBeVisible();
  await expectAccessibleScreen(page);
  await page.getByRole("button", { name: "English" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test("rejects an unknown language on a page in English", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "English" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await sendUnknownLanguage(page, "id", "Bahasa Indonesia");
  await expect(page).toHaveTitle(
    "The language could not be changed | Portolab",
  );
  await expect(
    page.getByText(
      'The form sent "fr" in the field locale, but Portolab is only available in Bahasa Indonesia and English. Choose one of them in the language switch.',
    ),
  ).toBeVisible();
});

test("shows the language switch on a plain visit of the language address", async ({
  page,
}) => {
  await page.goto("/language");
  await expect(page).toHaveTitle("Bahasa | Portolab");
  await expect(
    page.getByRole("heading", { level: 1, name: "Bahasa" }),
  ).toBeVisible();
  await expectAccessibleScreen(page);
  await page.getByRole("button", { name: "English" }).click();
  await expect(page).toHaveTitle("Language | Portolab");
});
