import { expect, test } from "vitest";
import { monthEndClosesForTest } from "~/features/measures/month-end-closes-for-test";
import { locales } from "~/paraglide/runtime.js";
import { renderInRouterForTest } from "~/render-in-router-for-test";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { StockHistoryChart } from "./stock-history-chart";

for (const locale of locales) {
  test(`colors the selected stock range by its direction without a caption or single-line legend in ${locale}`, () => {
    switchLocaleForTest(locale);
    const history = monthEndClosesForTest("BBCA");
    if (history.kind !== "stock") throw new Error("BBCA has stock closes.");
    for (const [first, last, direction] of [
      ["2021-08-31", "2021-09-30", "rise"],
      ["2021-10-29", "2021-11-30", "fall"],
      ["2023-02-28", "2023-03-31", "none"],
    ] as const) {
      const closes = history.closes.filter(
        (point) => point.date >= first && point.date <= last,
      );
      expect(closes).toHaveLength(2);
      const html = renderInRouterForTest(
        <StockHistoryChart
          history={{ ...history, closes }}
          range="1m"
          path="/classes/7/stocks/BBCA"
        />,
      );
      expect(html).toContain(`data-line="${direction}"`);
      expect(html).not.toContain("<ul");
      expect(html).not.toContain("<p>");
    }
  });
}
