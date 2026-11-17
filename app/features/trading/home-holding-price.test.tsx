import { renderTextMarkupForTest } from "~/render-text-markup-for-test";
import { expect, test } from "vitest";
import { stockQuote } from "~/features/market-data/stock-quote";
import { languageNames } from "~/language-names";
import { markupTextForTest } from "~/markup-text-for-test";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { rupiah } from "~/units/rupiah";
import { shares } from "~/units/shares";
import { HomeHoldingPrice } from "./home-holding-price";
import { valuePortfolio } from "./value-portfolio";
import type { ValuedHolding } from "./value-portfolio";

const sharedTime = new Date("2026-10-30T09:14:55Z");

// A price of the shared minute shows no time, a price of another minute of the same day shows its time of day, and a price of another day shows its date too.
const quotedAt = {
  sharedMinute: "2026-10-30T09:14:58Z",
  sameDay: "2026-10-30T09:13:30Z",
  otherDay: "2026-10-29T09:14:58Z",
} as const;

const times: Record<
  Locale,
  Record<keyof typeof quotedAt, string | undefined>
> = {
  id: {
    sharedMinute: undefined,
    sameDay: "16.13 WIB",
    otherDay: "29 Okt 2026, 16.14 WIB",
  },
  en: {
    sharedMinute: undefined,
    sameDay: "4:13 PM WIB",
    otherDay: "Oct 29, 2026, 4:14 PM WIB",
  },
};

const unsharedTimes: Record<Locale, string> = {
  id: "30 Okt 2026, 16.13 WIB",
  en: "Oct 30, 2026, 4:13 PM WIB",
};

function holdingQuotedAt(moment: string): ValuedHolding {
  const [holding] = valuePortfolio(
    {
      cash: rupiah(0),
      holdings: [{ code: "BMRI", shares: shares(100), cost: rupiah(372_558) }],
    },
    rupiah(372_558),
    new Map([["BMRI", stockQuote("BMRI", [3720, 3720], moment)]]),
  ).holdings;
  if (holding === undefined) throw new Error("The holding of BMRI is missing.");
  return holding;
}

for (const locale of locales) {
  test(`shows no time for the shared minute, the time of day for another minute of its date, and the date for another day, each on one line, in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    for (const kind of ["sharedMinute", "sameDay", "otherDay"] as const) {
      const html = renderTextMarkupForTest(
        <HomeHoldingPrice
          holding={holdingQuotedAt(quotedAt[kind])}
          failed={false}
          sharedTime={sharedTime}
        />,
      );
      const time = times[locale][kind];
      if (time === undefined) expect(html).not.toContain("WIB");
      else expect(html).toContain(markupTextForTest(time));
    }
    expect(
      renderTextMarkupForTest(
        <HomeHoldingPrice
          holding={holdingQuotedAt(quotedAt.sameDay)}
          failed={false}
          sharedTime={undefined}
        />,
      ),
    ).toContain(markupTextForTest(unsharedTimes[locale]));
  });
}
