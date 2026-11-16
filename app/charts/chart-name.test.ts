import { expect, test } from "vitest";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { chartName } from "./chart-name";

for (const locale of locales) {
  test(`keeps ordinary chart names and shortens oversized names in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    expect(chartName("Portofolio Anda")).toBe("Portofolio Anda");
    expect(chartName("Raka")).toBe("Raka");
    expect(chartName("IHSG")).toBe("IHSG");
    expect(chartName("W".repeat(100))).toBe("WWWWWWWWWW…");
    expect(chartName("8".repeat(100))).toBe("888888888888888…");
  });
  test(`keeps complete graphemes when shortening a chart name in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    expect(chartName("e\u0301".repeat(100))).toBe("éééé…");
  });
}
