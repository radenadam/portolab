import { expect } from "@playwright/test";
import type { Page } from "@playwright/test";

/** Axe does not check the content model of dt, which also applies inside its closed popovers: https://html.spec.whatwg.org/multipage/grouping-content.html#the-dt-element */
export async function expectDefinitionTerms(page: Page): Promise<void> {
  const forbidden = page
    .locator("dt")
    .locator(
      "header, footer, article, aside, nav, section, h1, h2, h3, h4, h5, h6",
    );
  expect(
    await forbidden.evaluateAll((elements) =>
      elements.map((element) => element.outerHTML),
    ),
  ).toEqual([]);
}
