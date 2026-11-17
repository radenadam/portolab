import { expect, test } from "vitest";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { indexPoints } from "~/units/index-points";
import {
  marketRowForTest,
  marketViewPropsForTest,
  renderMarketForTest,
} from "./market-view-for-test";
import { quoteChange } from "./quote-change";
import { stockQuote } from "./stock-quote";
import styles from "./market-view.module.css";

// Python Decimal with ROUND_HALF_UP gives these percentages independently of Intl.
const changes: Record<Locale, { zero: string; BBCA: string; AMMN: string }> = {
  id: { zero: "0,00%", BBCA: "+0,81%", AMMN: "-2,41%" },
  en: { zero: "0.00%", BBCA: "+0.81%", AMMN: "-2.41%" },
};

for (const locale of locales) {
  for (const tick of [-25, 25]) {
    test(`aligns a rounded-zero bar and IHSG tick in both lists after a reverse split with a price tick of ${String(tick)} in ${languageNames[locale]}`, async () => {
      switchLocaleForTest(locale);
      const props = await marketViewPropsForTest();
      const row = props.rows.find((candidate) => candidate.code === "BBCA");
      if (row === undefined) throw new Error("The BBCA fixture is missing.");
      expect(row.quote?.previousClose).toBe(4940);
      // A hypothetical reverse split of 200 old shares for one makes an allowed tick small enough to round to zero.
      const quote = stockQuote(
        "BBCA",
        [988_000 + tick, 988_000],
        "2026-11-02T09:14:58Z",
      );
      const indexQuote = {
        kind: "index" as const,
        code: "IHSG" as const,
        level: indexPoints(tick > 0 ? 5057.05 : 5057.03),
        previousLevel: indexPoints(tick > 0 ? 5057.03 : 5057.05),
        quotedAt: quote.quotedAt,
      };
      expect(quoteChange(quote)).not.toBe(0);
      expect(quoteChange(indexQuote)).not.toBe(0);
      const html = renderMarketForTest(props, {
        watchedCodes: ["BBCA"],
        filters: { ...props.filters, query: "BBCA" },
        values: { ...props.values, query: "BBCA" },
        rows: props.rows.map((current) =>
          current.code === "BBCA" ? { ...current, quote } : current,
        ),
        indexQuote,
        quotes: props.quotes.map((current) =>
          current.kind === "index"
            ? indexQuote
            : current.code === "BBCA"
              ? quote
              : current,
        ),
      });
      const rendered = marketRowForTest(html, "BBCA");
      expect(rendered).toContain(changes[locale].zero);
      expect(rendered).not.toContain("▲");
      expect(rendered).not.toContain("▼");
      const origin = new RegExp(
        `class="${String(styles["flatBar"])}" style="left:([^;]+);width:0%"`,
      ).exec(rendered)?.[1];
      expect(origin).toBeDefined();
      expect(rendered).toContain(
        `class="${String(styles["referenceTick"])}" style="left:${String(origin)}"`,
      );
      const watched = marketRowForTest(html, "BBCA", "watched-stock");
      expect(watched).toContain(
        `class="${String(styles["flatBar"])}" style="left:${String(origin)};width:0%"`,
      );
      expect(watched).toContain(
        `class="${String(styles["referenceTick"])}" style="left:${String(origin)}"`,
      );
    });
  }

  for (const { code, bar } of [
    { code: "BBCA", bar: styles["gainBar"] },
    { code: "AMMN", bar: styles["lossBar"] },
  ] as const) {
    test(`keeps the visible ${code} change and its bar in ${languageNames[locale]}`, async () => {
      switchLocaleForTest(locale);
      const props = await marketViewPropsForTest();
      expect(
        props.rows.find((candidate) => candidate.code === code)?.quote,
      ).toBeDefined();
      const html = renderMarketForTest(props);
      const row = marketRowForTest(html, code);
      expect(row).toContain(changes[locale][code]);
      expect(row).toContain(`class="${String(bar)}"`);
      expect(row).not.toContain("width:0%");
    });
  }
}
