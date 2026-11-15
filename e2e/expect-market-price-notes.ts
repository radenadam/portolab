import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import type { Locale } from "../app/paraglide/runtime.js";
import { expectAccessibleScreen } from "./expect-accessible-screen.ts";
import { layoutProblems } from "./expect-layout.ts";

const texts: Record<
  Locale,
  { shared: string; heading: string; reason: string }
> = {
  id: {
    shared: "Harga 30 Okt 2026, 16.14 WIB.",
    heading: "Mengapa beta dan volatilitas belum tersedia",
    reason: "0 dari 24 imbal hasil bulanan yang dibutuhkan ukuran",
  },
  en: {
    shared: "Prices Oct 30, 2026, 4:14 PM WIB.",
    heading: "Why beta and volatility are unavailable",
    reason: "0 of the 24 monthly returns that the measures need",
  },
};

export async function expectMarketPriceNotes(
  page: Page,
  locale: Locale,
  javaScriptEnabled: boolean,
): Promise<void> {
  const text = texts[locale];
  await expect(page.getByText(text.shared, { exact: true })).toHaveCount(1);
  await expect(page.getByText(text.shared, { exact: true })).toBeVisible();
  for (const code of ["BBCA", "TLKM", "GOTO", "UNVR"])
    await expect(page.locator(`#stock-${code} time`)).toHaveCount(0);
  for (const code of ["BMRI", "KLBF", "ITMG"])
    await expect(page.locator(`#stock-${code} time`)).toHaveCount(1);
  const cells = page.locator(
    "#stock-GOTO td[aria-describedby=market-measure-notes]",
  );
  await expect(cells).toHaveText(["-", "-"]);
  await expect(page.locator("#stock-GOTO")).not.toContainText(text.reason);
  const summary = page.getByText(text.heading, { exact: true });
  await summary.click();
  await expect(page.getByText(text.reason, { exact: true })).toBeVisible();
  expect(await layoutProblems(page)).toEqual([]);
  if (javaScriptEnabled) await expectAccessibleScreen(page);
  await summary.click();
  await expect(page.getByText(text.reason, { exact: true })).toBeHidden();
}
