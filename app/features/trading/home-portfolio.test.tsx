import { languageNames } from "~/language-names";
import { readPortfolioDayChange } from "./read-portfolio-day-change.server";
import { expect, test } from "vitest";
import type { ClassId } from "~/features/classes/classes.schema";
import { conceptLessonDataForTest } from "~/features/learning/concept-lesson-data-for-test";
import {
  databaseWithClosesForTest,
  valuationForTest,
  cashValuationForTest,
  aadiValuationForTest,
  ammnValuationForTest,
} from "~/features/measures/measures-for-test.server";
import { readPortfolioMeasures } from "~/features/measures/read-measures.server";
import {
  portfolioWithoutVariationForTest,
  portfolioAgainstMarketForTest,
} from "~/features/measures/portfolio-against-market-for-test";
import { markupTextForTest } from "~/markup-text-for-test";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { renderMarkupForTest } from "~/render-markup-for-test";
import { succeed, fail } from "~/result";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { cumulativeReturn } from "~/units/cumulative-return";
import { rupiah } from "~/units/rupiah";
import { shares } from "~/units/shares";
import { HomePortfolio } from "./home-portfolio";
import type { HomePortfolioData } from "./read-home-portfolio.server";
import type { PortfolioValuation } from "./value-portfolio";
import { valuePortfolio } from "./value-portfolio";
const classId = 7 as ClassId;
const texts: Record<
  Locale,
  {
    cash: string;
    currency: string;
    noHoldings: string;
    oneHolding: string;
    today: string;
    datedChange: string;
    common: readonly string[];
    measured: readonly string[];
    one: string;
    several: string;
    failed: string;
  }
> = {
  id: {
    cash: "Kas",
    currency: "Rp",
    noHoldings: "Anda tidak memegang saham.",
    oneHolding: "Saham Anda · 1",
    today: "hari ini",
    datedChange: "perubahan 30 Okt 2026",
    common: [
      "Beranda",
      "Nilai portofolio",
      "Nilai portofolio menjumlahkan kas dan nilai saham pada harga tertunda masing-masing. Waktu harga tercantum pada setiap saham di bawah. Grafik memakai harga penutupan final, sehingga imbal hasil terakhirnya dapat berbeda.",
      "hari ini",
      "Perubahan harian",
      "Perubahan harian membandingkan nilai portofolio sekarang dengan nilainya pada penutupan 29 Oktober 2026. Nilai sebelumnya memakai kas, saham, dan harga penutupan hari itu, sehingga transaksi sesudahnya, termasuk biaya dan pajaknya, ikut dihitung. Waktu harga sekarang tercantum pada setiap saham di bawah.",
      "Sejak 30 Okt",
      "Dasar imbal hasil",
      "Risiko dibanding pasar",
      "Analisis",
      "Saham Anda · 2",
      "Bobot",
      "Lot",
      "Harga rata-rata",
      "Harga rata-rata termasuk biaya broker.",
      "Harga rata-rata membagi biaya saham termasuk biaya broker dengan jumlah saham, lalu membulatkannya ke rupiah utuh.",
      "Laba atau rugi",
      "Laba atau rugi mengurangi nilai saham pada harga tertunda dengan biaya saham termasuk biaya broker. Persentasenya membagi laba atau rugi dengan biaya tersebut.",
      "1 bulan",
      "30 Okt 2026, 16.14 WIB.",
      "Rp",
      "Rp 2.989.478 disisihkan oleh 2 order terbuka.",
    ],
    measured: [
      "Pasar 1,00. Portofolio Anda lebih tenang dari pasar.",
      "IHSG 4,53% per bulan.",
      "IHSG -0,10. Imbal hasil per unit risiko Anda di bawah pasar.",
      "Periode ukuran risiko",
      "Risiko per bulan",
      "Sharpe",
      "Beta",
      "Rp 54.780.000",
      "50,00%",
      "30,00%",
      "20,00%",
      "Rp 4.987",
      "55 lot · Harga rata-rata Rp 4.987.",
      "Rp 1.983",
    ],
    one: "Rp 2.989.478 disisihkan oleh 1 order terbuka.",
    several: "Tidak ada kas yang disisihkan.",
    failed: "Pembaruan terakhir tidak memperoleh harga ini.",
  },
  en: {
    cash: "Cash",
    currency: "IDR",
    noHoldings: "You hold no shares.",
    oneHolding: "Your holding · 1",
    today: "today",
    datedChange: "change on Oct 30, 2026",
    common: [
      "Home",
      "Portfolio value",
      "Portfolio value adds cash and the value of each holding at its delayed price. Each holding below shows its quote time. The chart uses final closes, so its latest return can differ.",
      "today",
      "Daily change",
      "The daily change compares the current portfolio value with its value at the close of October 29, 2026. The earlier value uses the cash, shares, and closes of that day, so trades since then, including fees and taxes, count in the change. Each holding below shows its current quote time.",
      "Since Oct 30",
      "Return basis",
      "Risk against the market",
      "Analysis",
      "Your holdings · 2",
      "Weight",
      "Lots",
      "Average price",
      "Average price includes broker fees.",
      "Average price divides the cost including broker fees by the number of shares, then rounds to whole rupiah.",
      "Profit or loss",
      "Profit or loss subtracts the cost including broker fees from the holding value at its delayed price. The percentage divides that profit or loss by the cost.",
      "1 month",
      "Oct 30, 2026, 4:14 PM WIB.",
      "IDR",
      "IDR 2,989,478 set aside by 2 open orders.",
    ],
    measured: [
      "Market 1.00. Your portfolio moves less with the market.",
      "IHSG 4.53% per month.",
      "IHSG -0.10. Your return per unit of risk is below the market.",
      "Risk measurement period",
      "Risk per month",
      "Sharpe",
      "Beta",
      "IDR 54,780,000",
      "50.00%",
      "30.00%",
      "20.00%",
      "IDR 4,987",
      "55 lots · Average price IDR 4,987.",
      "IDR 1,983",
    ],
    one: "IDR 2,989,478 set aside by 1 open order.",
    several: "No cash is set aside.",
    failed: "The latest update could not fetch this price.",
  },
};
function homeForTest(
  valuation: PortfolioValuation = valuationForTest(["BBCA", "TLKM"]),
  now = new Date("2026-10-30T10:00:00Z"),
): HomePortfolioData {
  const database = databaseWithClosesForTest();
  return {
    report: {
      valuation,
      quoteAttempt: undefined,
      history: succeed({
        points: [
          {
            date: "2026-10-30",
            portfolio: cumulativeReturn(0),
            market: cumulativeReturn(0),
          },
        ],
        end: { kind: "missingCloses", date: "2026-11-02", codes: ["IHSG"] },
      }),
    },
    measures: readPortfolioMeasures(database, valuation),
    dayChange: readPortfolioDayChange(database, {
      portfolio: {
        cash: valuation.cash,
        holdings: valuation.holdings,
        orders: [],
      },
      valuation,
      now,
      delayMinutes: 10,
    }),
    setAside: { amount: rupiah(2_989_478), orders: 2 },
    lotShares: shares(100),
    histories: [],
    now,
    delayMinutes: 10,
  };
}
function render(home: HomePortfolioData): string {
  return renderMarkupForTest(
    <HomePortfolio home={home} classId={classId} />,
    conceptLessonDataForTest(),
  );
}
for (const locale of locales) {
  const text = texts[locale];
  test(`shows the summary, risk dots, and holdings at independently computed values in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    // The fixture in measures-for-test.server.ts gives the independently computed 50%, 30%, and 20% weights. By hand, Rp27,431,085 / 5,500 rounds to Rp4,987, and Rp16,458,651 / 8,300 rounds to Rp1,983.
    const home = homeForTest();
    expect(home.report.valuation.total?.value).toBe(54_780_000);
    const html = render(home);
    for (const sentence of [...text.common, ...text.measured])
      expect(html.replaceAll(/<[^>]*>/g, "")).toContain(
        markupTextForTest(sentence),
      );
    expect(html).toContain(`aria-hidden="true">${text.currency}</span>`);
    expect(html).toContain('href="/classes/7/stocks/BBCA"');
    expect(html).toContain('href="/classes/7/measures"');
    expect(html.match(/<circle/g)).toHaveLength(5);
    for (const [orders, sentence] of [
      [1, text.one],
      [0, text.several],
    ] as const) {
      expect(
        render({
          ...home,
          setAside: { orders, amount: rupiah(orders === 0 ? 0 : 2_989_478) },
        }),
      ).toContain(markupTextForTest(sentence));
    }
  });
  test(`keeps the holdings and cash when quotes or measures are missing, and after every stock is sold in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    for (const valuation of [
      valuationForTest([]),
      valuationForTest(["BBCA"]),
      aadiValuationForTest(),
      ammnValuationForTest(),
      cashValuationForTest(),
      valuePortfolio(
        { cash: rupiah(48_529_600), holdings: [] },
        rupiah(100_000_000),
        new Map(),
      ),
    ]) {
      const home = homeForTest(valuation);
      const html = render(home);
      expect(html).toContain(markupTextForTest(text.cash));
      if (valuation.holdings.length === 0)
        expect(html).toContain(text.noHoldings);
      for (const holding of valuation.holdings)
        expect(html).toContain(holding.code);
      if (valuation.holdings.length === 1)
        expect(html).toContain(markupTextForTest(text.oneHolding));
    }
    const home = homeForTest();
    const failed = render({
      ...home,
      report: {
        ...home.report,
        quoteAttempt: {
          attemptedAt: home.now,
          succeeded: true,
          consecutiveFailures: 0,
          failedCodes: ["BBCA"],
        },
      },
    });
    expect(failed).toContain(text.failed);
    expect(
      render({
        ...home,
        report: { ...home.report, history: fail({ kind: "missingCalendar" }) },
      }),
    ).not.toContain('id="home-return-heading" class=');
  });
  test(`names the comparison day and only calls the current day today in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    expect(render(homeForTest())).toContain(text.today);
    const weekend = homeForTest(
      valuationForTest(["BBCA", "TLKM"]),
      new Date("2026-11-07T03:30:00Z"),
    );
    expect(render(weekend)).toContain(text.datedChange);
  });
  test(`draws risk scales for a negative beta and withholds the Sharpe dot when variance is zero in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    const home = homeForTest();
    for (const measures of [
      portfolioAgainstMarketForTest(),
      portfolioWithoutVariationForTest(),
    ]) {
      expect(measures.kind).toBe("measured");
      const html = render({ ...home, measures });
      expect(html).not.toContain("NaN");
      expect(html).not.toContain("Infinity");
    }
  });
}
