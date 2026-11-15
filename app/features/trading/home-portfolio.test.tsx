import { HomeRisk } from "./home-risk";
import { homePortfolioForTest } from "./home-portfolio-for-test";
import { languageNames } from "~/language-names";
import { expect, test } from "vitest";
import type { ClassId } from "~/features/classes/classes.schema";
import { conceptLessonDataForTest } from "~/features/learning/concept-lesson-data-for-test";
import {
  valuationForTest,
  cashValuationForTest,
  aadiValuationForTest,
  ammnValuationForTest,
} from "~/features/measures/measures-for-test.server";
import {
  portfolioWithoutVariationForTest,
  portfolioAgainstMarketForTest,
} from "~/features/measures/portfolio-against-market-for-test";
import { markupTextForTest } from "~/markup-text-for-test";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { renderMarkupForTest } from "~/render-markup-for-test";
import { fail } from "~/result";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { rupiah } from "~/units/rupiah";
import { HomePortfolio } from "./home-portfolio";
import type { HomePortfolioData } from "./read-home-portfolio.server";
import { valuePortfolio } from "./value-portfolio";
const missingTexts: Record<
  Locale,
  Record<"shares" | "one" | "several" | "unpriced" | "returnTitle", string>
> = {
  id: {
    shares: "Jumlah saham",
    one: "Portolab menampilkan nilai total dan imbal hasil setelah pembaruan harga berikutnya membawa harga tertunda TLKM.",
    several:
      "Portolab menampilkan nilai total dan imbal hasil setelah pembaruan harga berikutnya membawa harga tertunda BBCA dan TLKM.",
    unpriced: "Portolab belum memiliki harga tertunda TLKM.",
    returnTitle: "Imbal hasil Anda dibandingkan IHSG",
  },
  en: {
    shares: "Shares",
    one: "Portolab shows the total value and the return once the next update of prices brings a delayed price of TLKM.",
    several:
      "Portolab shows the total value and the return once the next update of prices brings the delayed prices of BBCA and TLKM.",
    unpriced: "Portolab has no delayed price of TLKM yet.",
    returnTitle: "Your return against the IHSG",
  },
};
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
      "Nilai portofolio menjumlahkan kas dan nilai saham pada harga tertunda masing-masing. Waktu harga tercantum pada tabel kepemilikan. Grafik memakai harga penutupan final, sehingga imbal hasil terakhirnya dapat berbeda.",
      "hari ini",
      "Perubahan harian",
      "Perubahan harian membandingkan nilai portofolio sekarang dengan nilainya pada penutupan 29 Oktober 2026. Nilai sebelumnya memakai kas, saham, dan harga penutupan hari itu, sehingga transaksi sesudahnya, termasuk biaya dan pajaknya, ikut dihitung. Waktu harga sekarang tercantum pada tabel kepemilikan.",
      "Sejak 30 Okt",
      "Dasar imbal hasil",
      "Risiko dibanding pasar",
      "Analisis",
      "Saham Anda · 2",
      "Bobot",
      "Lot",
      "Harga rata-rata",
      "Harga tertunda",
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
      "55 lot",
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
      "Portfolio value adds cash and the value of each holding at its delayed price. The holdings table shows the quote times. The chart uses final closes, so its latest return can differ.",
      "today",
      "Daily change",
      "The daily change compares the current portfolio value with its value at the close of October 29, 2026. The earlier value uses the cash, shares, and closes of that day, so trades since then, including fees and taxes, count in the change. The holdings table shows the current quote times.",
      "Since Oct 30",
      "Return basis",
      "Risk against the market",
      "Analysis",
      "Your holdings · 2",
      "Weight",
      "Lots",
      "Average price",
      "Delayed price",
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
      "55 lots",
      "IDR 1,983",
    ],
    one: "IDR 2,989,478 set aside by 1 open order.",
    several: "No cash is set aside.",
    failed: "The latest update could not fetch this price.",
  },
};
function render(home: HomePortfolioData): string {
  return renderMarkupForTest(
    <HomePortfolio
      home={home}
      classId={classId}
      reader={{ kind: "owner", classId }}
    />,
    conceptLessonDataForTest(),
  );
}
for (const locale of locales) {
  const text = texts[locale];
  test(`explains missing prices and shows shares when the lot rule is unavailable in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    for (const quotes of [[], ["BBCA"]] as const) {
      const home = homePortfolioForTest(valuationForTest(quotes));
      home.lotShares = undefined;
      home.report.history = fail({ kind: "missingCalendar" });
      const html = render(home);
      for (const sentence of [
        missingTexts[locale].shares,
        missingTexts[locale].unpriced,
        missingTexts[locale].returnTitle,
        quotes.length === 0
          ? missingTexts[locale].several
          : missingTexts[locale].one,
      ])
        expect(html).toContain(markupTextForTest(sentence));
    }
  });
  test(`shows the summary, risk dots, and holdings at independently computed values in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    // The fixture in measures-for-test.server.ts gives the independently computed 50%, 30%, and 20% weights. By hand, Rp27,431,085 / 5,500 rounds to Rp4,987, and Rp16,458,651 / 8,300 rounds to Rp1,983.
    const home = homePortfolioForTest();
    expect(home.report.valuation.total?.value).toBe(54_780_000);
    const html = render(home);
    for (const sentence of [...text.common, ...text.measured])
      expect(html.replaceAll(/<[^>]*>/g, "")).toContain(
        markupTextForTest(sentence),
      );
    expect(html).toContain(`aria-hidden="true">${text.currency}</span>`);
    expect(html).toContain('href="/classes/7/stocks/BBCA"');
    expect(html).toContain('href="/classes/7/analysis"');
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
      const home = homePortfolioForTest(valuation);
      const html = render(home);
      expect(html).toContain(markupTextForTest(text.cash));
      if (valuation.holdings.length === 0)
        expect(html).toContain(text.noHoldings);
      for (const holding of valuation.holdings)
        expect(html).toContain(holding.code);
      if (valuation.holdings.length === 1)
        expect(html).toContain(markupTextForTest(text.oneHolding));
    }
    const home = homePortfolioForTest();
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
    expect(render(homePortfolioForTest())).toContain(text.today);
    const weekend = homePortfolioForTest(
      valuationForTest(["BBCA", "TLKM"]),
      new Date("2026-11-07T03:30:00Z"),
    );
    expect(render(weekend)).toContain(text.datedChange);
  });
  test(`draws risk scales for a negative beta and withholds the Sharpe dot when variance is zero in ${languageNames[locale]}`, () => {
    switchLocaleForTest(locale);
    for (const measures of [
      portfolioAgainstMarketForTest(),
      portfolioWithoutVariationForTest(),
    ]) {
      expect(measures.kind).toBe("measured");
      const html = renderMarkupForTest(
        <HomeRisk
          report={measures}
          classId={classId}
          reader={{ kind: "owner", classId }}
        />,
        conceptLessonDataForTest(),
      );
      expect(html).not.toContain("NaN");
      expect(html).not.toContain("Infinity");
    }
  });
}
