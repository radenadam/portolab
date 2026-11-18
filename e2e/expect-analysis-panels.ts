import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import type { Locale } from "../app/paraglide/runtime.js";

const titles: Record<
  Locale,
  { panels: readonly string[]; risks: readonly string[] }
> = {
  id: {
    panels: ["Alokasi", "Korelasi antarsaham"],
    risks: ["Sumber risiko portofolio"],
  },
  en: {
    panels: ["Allocation", "Correlations between stocks"],
    risks: ["Source of portfolio risk", "Sources of portfolio risk"],
  },
};

export async function expectAnalysisPanels(
  page: Page,
  locale: Locale,
): Promise<void> {
  for (const title of titles[locale].panels)
    await expect(
      page.getByRole("region", { name: title, exact: true }),
    ).toBeVisible();
  const risk = page.locator(
    'section[aria-labelledby="analysis-risk-sources-title"]',
  );
  await expect(risk).toBeVisible();
  expect(titles[locale].risks).toContain(
    await risk.locator("#analysis-risk-sources-title").textContent(),
  );
}
