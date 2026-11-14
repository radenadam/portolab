import { expect, test } from "vitest";
import { marketIndex } from "~/features/market-data/tracked-instruments";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { measureConcept } from "./measure-concept";

for (const locale of locales) {
  test(`names the configured market index in the concepts that explain it in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    expect(measureConcept("beta").meaning).toContain(marketIndex.code);
    expect(measureConcept("market").meaning).toContain(marketIndex.code);
  });
}
