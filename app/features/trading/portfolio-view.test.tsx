import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import type {
  IndexQuote,
  PriceSourceDescription,
  StockQuote,
} from "~/features/market-data/price-source.server";
import { stockQuote } from "~/features/market-data/stock-quote";
import type { UpdateAttempt } from "~/features/market-data/update-attempts.server";
import { languageNames } from "~/language-names";
import { locales } from "~/paraglide/runtime.js";
import type { Locale } from "~/paraglide/runtime.js";
import { succeed, fail } from "~/result";
import { switchLocaleForTest } from "~/switch-locale-for-test";
import { cumulativeReturn } from "~/units/cumulative-return";
import { indexPoints } from "~/units/index-points";
import { rupiah } from "~/units/rupiah";
import { shares } from "~/units/shares";
import { returnPointsForTest } from "~/charts/return-points-for-test";
import type { ClassId } from "~/features/classes/classes.schema";
import type { Holding } from "./holding-after-fill";
import type { HistoryEnd, ReturnPoint } from "./portfolio-history";
import { PortfolioView } from "./portfolio-view";
import type { PortfolioReport } from "./read-portfolio-report.server";
import type { PortfolioReader } from "./text-for-reader";
import { valuePortfolio } from "./value-portfolio";

// The portfolio that tradedPortfolioForTest leaves on Tuesday 3 November 2026, valued at the delayed price of Rp4,840 quoted at 09:55 WIB, and its returns at the closes of 30 October, 2 November, and 3 November, which the tests of portfolio-history.ts give with the values of the decimal module of Python. Intl puts a no-break space after the currency, which the texts write as \u00a0.
const yahooFinance: PriceSourceDescription = {
  name: "Yahoo Finance",
  delayMinutes: 10,
};
const startingCash = rupiah(100_000_000);
const bbcaHolding: Holding = {
  code: "BBCA",
  shares: shares(10_000),
  cost: rupiah(49_874_700),
};
const tlkmHolding: Holding = {
  code: "TLKM",
  shares: shares(100),
  cost: rupiah(198_297),
};
const bbcaQuote = stockQuote("BBCA", [4_840, 4_980], "2026-11-03T02:55:00Z");
// The tile of the company of BBCA beside its code and the name of the company, which read the same in both languages.
const bbcaStock =
  '<div><span aria-hidden="true">BB</span><div><span>BBCA</span><span>Bank Central Asia Tbk</span></div></div>';
// The IHSG at its close of Tuesday 3 November 2026, quoted at 16:14 WIB, whose return since the close of 30 October is the one of the history at that close.
const ihsgQuote: IndexQuote = {
  kind: "index",
  code: "IHSG",
  level: indexPoints(5_000),
  previousLevel: indexPoints(5_100),
  quotedAt: new Date("2026-11-03T09:14:00Z"),
};
// 10:00 WIB on Wednesday 4 November 2026.
const wednesday = new Date("2026-11-04T03:00:00Z");

const points: ReturnPoint[] = [...returnPointsForTest];
const waitingForWednesday: HistoryEnd = {
  kind: "notFinal",
  date: "2026-11-04",
  finalAt: new Date("2026-11-04T09:26:00Z"),
};

function quotesByCode(
  quotes: readonly StockQuote[],
): ReadonlyMap<string, StockQuote> {
  return new Map(quotes.map((quote) => [quote.code, quote]));
}

/** A report of the traded portfolio with the changes of a test. */
function reportForTest(changes: Partial<PortfolioReport>): PortfolioReport {
  return {
    valuation: valuePortfolio(
      { cash: rupiah(48_529_600), holdings: [bbcaHolding] },
      startingCash,
      quotesByCode([bbcaQuote]),
    ),
    quoteAttempt: undefined,
    history: succeed({ points, end: waitingForWednesday }),
    market: {
      quote: ihsgQuote,
      return: cumulativeReturn(-0.03020733431546059),
    },
    ...changes,
  };
}

// The student who owns the portfolio reads about "your" portfolio, and the lecturer of the class reads about the portfolio of the student by name.
const readers: Record<PortfolioReader["kind"], PortfolioReader> = {
  owner: { kind: "owner", classId: 7 as ClassId },
  lecturer: { kind: "lecturer", studentName: "Siti Rahayu" },
};

// The names of the classes of CSS modules carry a hash, so the texts compare the markup without them.
function renderView(
  report: PortfolioReport,
  reader: PortfolioReader,
  now = wednesday,
): string {
  return renderToStaticMarkup(
    <PortfolioView
      report={report}
      reader={reader}
      now={now}
      source={yahooFinance}
    />,
  ).replaceAll(/ class="[^"]*"/g, "");
}

const fall = '<span aria-hidden="true">▼ </span>';
const rise = '<span aria-hidden="true">▲ </span>';

/** The terms of a list of definitions and their values, as the markup shows them. */
/** The values in the line under the headline, each with its label, as the markup shows them. */
function facts(pairs: readonly (readonly [string, string])[]): string {
  return `<dl>${pairs
    .map(([term, value]) => `<div><dt>${term}</dt><dd>${value}</dd></div>`)
    .join("")}</dl>`;
}

const labels: Record<
  Locale,
  {
    cash: string;
    startingCash: string;
    return: string;
    marketReturn: string;
    stock: string;
    shares: string;
    cost: string;
    delayedPrice: string;
    quotedAt: string;
    value: string;
    gain: string;
    gainReturn: string;
    tradingDay: string;
    returnsTable: string;
  }
> = {
  id: {
    cash: "Kas",
    startingCash: "Kas awal",
    return: "Imbal hasil sejak awal",
    marketReturn: "IHSG sejak awal",
    stock: "Saham",
    shares: "Jumlah saham",
    cost: "Biaya termasuk biaya broker",
    delayedPrice: "Harga tertunda",
    quotedAt: "Tercatat pada (WIB)",
    value: "Nilai",
    gain: "Untung atau rugi",
    gainReturn: "Imbal hasil atas biaya",
    tradingDay: "Hari bursa",
    returnsTable: "Imbal hasil pada setiap penutupan",
  },
  en: {
    cash: "Cash",
    startingCash: "Starting cash",
    return: "Return since the start",
    marketReturn: "IHSG since the start",
    stock: "Stock",
    shares: "Shares",
    cost: "Cost with broker fees",
    delayedPrice: "Delayed price",
    quotedAt: "Quoted at (WIB)",
    value: "Value",
    gain: "Gain or loss",
    gainReturn: "Return on the cost",
    tradingDay: "Trading day",
    returnsTable: "The return at each close",
  },
};

// The values that the headline, the holdings, and the table show, in the format of each language.
const values: Record<
  Locale,
  {
    cash: string;
    holdingValue: string;
    totalValue: string;
    startingCash: string;
    return: string;
    marketReturn: string;
    noReturn: string;
    shares: string;
    cost: string;
    delayedPrice: string;
    quotedAt: string;
    gain: string;
    gainReturn: string;
    holdingNotice: string;
    priceNotice: string;
    rows: readonly (readonly [string, string, string])[];
  }
> = {
  id: {
    cash: "Rp\u00a048.529.600",
    holdingValue: "Rp\u00a048.400.000",
    totalValue: "Rp\u00a096.929.600",
    startingCash: "Rp\u00a0100.000.000",
    return: `${fall}-3,07%`,
    marketReturn: `${fall}-3,02%`,
    noReturn: "0,00%",
    shares: "10.000",
    cost: "Rp\u00a049.874.700",
    delayedPrice: "Rp\u00a04.840",
    quotedAt: "3 Nov 2026, 09.55",
    gain: `${fall}-Rp\u00a01.474.700`,
    gainReturn: `${fall}-2,96%`,
    holdingNotice:
      "10.000 saham dengan biaya Rp\u00a049.874.700, termasuk biaya broker.",
    priceNotice:
      "Harga tertunda Rp\u00a04.840, tercatat pada 3 Nov 2026, 09.55 WIB.",
    rows: [
      ["30 Okt 2026", "0,00%", "0,00%"],
      ["2 Nov 2026", `${fall}-0,15%`, `${rise}+0,79%`],
      ["3 Nov 2026", `${fall}-3,07%`, `${fall}-3,02%`],
    ],
  },
  en: {
    cash: "IDR\u00a048,529,600",
    holdingValue: "IDR\u00a048,400,000",
    totalValue: "IDR\u00a096,929,600",
    startingCash: "IDR\u00a0100,000,000",
    return: `${fall}-3.07%`,
    marketReturn: `${fall}-3.02%`,
    noReturn: "0.00%",
    shares: "10,000",
    cost: "IDR\u00a049,874,700",
    delayedPrice: "IDR\u00a04,840",
    quotedAt: "Nov 3, 2026, 9:55 AM",
    gain: `${fall}-IDR\u00a01,474,700`,
    gainReturn: `${fall}-2.96%`,
    holdingNotice:
      "10,000 shares that cost IDR\u00a049,874,700, broker fees included.",
    priceNotice:
      "Delayed price IDR\u00a04,840, quoted at Nov 3, 2026, 9:55 AM WIB.",
    rows: [
      ["Oct 30, 2026", "0.00%", "0.00%"],
      ["Nov 2, 2026", `${fall}-0.15%`, `${rise}+0.79%`],
      ["Nov 3, 2026", `${fall}-3.07%`, `${fall}-3.02%`],
    ],
  },
};
const texts: Record<
  Locale,
  {
    waiting: string;
    missingStart: string;
    oneUnpriced: string;
    severalUnpriced: string;
    unpricedHolding: string;
    severalMissingCloses: string;
    quoteFailure: string;
    marketQuoteFailure: string;
  }
> = {
  id: {
    waiting:
      "Harga tanggal 4 November 2026 menjadi final pada pukul 16.26 WIB, dan Portolab menampilkan imbal hasil mulai hari itu setelah pembaruan riwayat harga menyimpan harga penutupan hari itu atau hari sesudahnya.",
    missingStart:
      "Portolab belum menyimpan harga penutupan IHSG pada 30 Oktober 2026. Portolab menampilkan imbal hasil mulai hari itu setelah pembaruan riwayat harga menyimpan harga penutupan IHSG pada hari itu atau hari sesudahnya.",
    oneUnpriced:
      "Portolab menampilkan nilai total dan imbal hasil setelah pembaruan harga berikutnya membawa harga tertunda TLKM.",
    severalUnpriced:
      "Portolab menampilkan nilai total dan imbal hasil setelah pembaruan harga berikutnya membawa harga tertunda BBCA dan TLKM.",
    unpricedHolding: "Portolab belum memiliki harga tertunda TLKM.",
    severalMissingCloses:
      "Portolab belum menyimpan harga penutupan IHSG dan BBCA pada 4 November 2026. Portolab menampilkan imbal hasil mulai hari itu setelah pembaruan riwayat harga menyimpan harga penutupan masing-masing pada hari itu atau hari sesudahnya.",
    quoteFailure:
      "Portolab tidak dapat memperbarui harga BBCA pada 3 Nov 2026, 10.30 WIB, jadi Portolab memakai harga terakhir BBCA yang tersimpan. Portolab mencoba lagi pada 3 Nov 2026, 10.31 WIB.",
    marketQuoteFailure:
      "Portolab tidak dapat memperbarui harga BBCA dan IHSG pada 3 Nov 2026, 10.30 WIB, jadi Portolab memakai harga terakhir masing-masing yang tersimpan. Portolab mencoba lagi pada 3 Nov 2026, 10.31 WIB.",
  },
  en: {
    waiting:
      "The prices of November 4, 2026 become final at 4:26 PM WIB, and Portolab shows the returns from that day on once an update of the price history stores closes of that day or of a later day.",
    missingStart:
      "Portolab has not stored the close of IHSG on October 30, 2026 yet. It shows the returns from that day on once an update of the price history stores a close of IHSG on that day or on a later day.",
    oneUnpriced:
      "Portolab shows the total value and the return once the next update of prices brings a delayed price of TLKM.",
    severalUnpriced:
      "Portolab shows the total value and the return once the next update of prices brings the delayed prices of BBCA and TLKM.",
    unpricedHolding: "Portolab has no delayed price of TLKM yet.",
    severalMissingCloses:
      "Portolab has not stored the closes of IHSG and BBCA on November 4, 2026 yet. It shows the returns from that day on once an update of the price history stores a close of each of them on that day or on a later day.",
    quoteFailure:
      "Portolab could not update the price of BBCA at Nov 3, 2026, 10:30 AM WIB, so it uses the last price of BBCA that it stored. Portolab tries again at Nov 3, 2026, 10:31 AM WIB.",
    marketQuoteFailure:
      "Portolab could not update the prices of BBCA and IHSG at Nov 3, 2026, 10:30 AM WIB, so it uses the last price of each that it stored. Portolab tries again at Nov 3, 2026, 10:31 AM WIB.",
  },
};

// The texts that differ between the readers of the portfolio.
const readerTexts: Record<
  Locale,
  Record<
    PortfolioReader["kind"],
    {
      valuationNotice: string;
      valueTitle: string;
      holdingsTitle: string;
      noHoldings: string;
      returnTitle: string;
      chartNotice: string;
      portfolioSeries: string;
      calendarMissing: string;
    }
  >
> = {
  id: {
    owner: {
      valuationNotice:
        "Portofolio Anda adalah simulasi dengan uang virtual. Portolab menilai setiap saham yang Anda pegang pada harga tertunda terakhir dari Yahoo Finance, sekitar 10 menit di belakang BEI, sehingga nilainya dapat berbeda dari nilai di bursa pada saat yang sama.",
      valueTitle: "Nilai portofolio Anda",
      holdingsTitle: "Saham yang Anda pegang",
      noHoldings: "Anda tidak memegang saham.",
      returnTitle: "Imbal hasil Anda dibandingkan IHSG",
      chartNotice:
        "Grafik dan tabel membandingkan imbal hasil portofolio Anda dengan imbal hasil IHSG sejak penutupan 30 Oktober 2026, sebelum Anda dapat bertransaksi. Setiap imbal hasilnya memakai harga penutupan final pada harinya.",
      portfolioSeries: "Portofolio Anda",
      calendarMissing:
        "Portolab belum dapat menampilkan imbal hasil hari bursa berikutnya, karena kalender perdagangan BEI untuk hari itu belum tercatat. Beri tahu dosen Anda agar kalender tersebut dapat ditambahkan.",
    },
    lecturer: {
      valuationNotice:
        "Portofolio Siti Rahayu adalah simulasi dengan uang virtual. Portolab menilai setiap saham yang dipegangnya pada harga tertunda terakhir dari Yahoo Finance, sekitar 10 menit di belakang BEI, sehingga nilainya dapat berbeda dari nilai di bursa pada saat yang sama.",
      valueTitle: "Nilai portofolio",
      holdingsTitle: "Saham yang dipegang",
      noHoldings: "Siti Rahayu belum memegang saham.",
      returnTitle: "Imbal hasil dibandingkan IHSG",
      chartNotice:
        "Grafik dan tabel di bawah membandingkan imbal hasil portofolio Siti Rahayu dengan imbal hasil IHSG sejak penutupan 30 Oktober 2026, sebelum Siti Rahayu dapat bertransaksi. Setiap imbal hasilnya memakai harga penutupan final pada harinya.",
      portfolioSeries: "Portofolio",
      calendarMissing:
        "Portolab belum dapat menampilkan imbal hasil hari bursa berikutnya, karena kalender perdagangan BEI untuk hari itu belum tercatat. Beri tahu orang yang menjalankan server Portolab ini agar kalender tersebut dapat ditambahkan.",
    },
  },
  en: {
    owner: {
      valuationNotice:
        "Your portfolio is a simulation with virtual cash. Portolab values each holding at the latest delayed price from Yahoo Finance, about 10 minutes behind IDX, so a value can differ from the value on the exchange at the same moment.",
      valueTitle: "Value of your portfolio",
      holdingsTitle: "Your holdings",
      noHoldings: "You hold no shares.",
      returnTitle: "Your return against the IHSG",
      chartNotice:
        "The chart and the table compare the return of your portfolio with the return of the IHSG since the close of October 30, 2026, before you could trade. Each of their returns uses the final closes of its day.",
      portfolioSeries: "Your portfolio",
      calendarMissing:
        "Portolab cannot show the return of the next trading day, because it has not recorded the trading calendar of IDX for that day. Tell your lecturer, so that the calendar can be added.",
    },
    lecturer: {
      valuationNotice:
        "The portfolio of Siti Rahayu is a simulation with virtual cash. Portolab values each holding at the latest delayed price from Yahoo Finance, about 10 minutes behind IDX, so a value can differ from the value on the exchange at the same moment.",
      valueTitle: "Value of the portfolio",
      holdingsTitle: "Holdings",
      noHoldings: "Siti Rahayu holds no shares yet.",
      returnTitle: "Return against the IHSG",
      chartNotice:
        "The chart and the table below compare the return of the portfolio of Siti Rahayu with the return of the IHSG since the close of October 30, 2026, before Siti Rahayu could trade. Each of their returns uses the final closes of its day.",
      portfolioSeries: "Portfolio",
      calendarMissing:
        "Portolab cannot show the return of the next trading day, because it has not recorded the trading calendar of IDX for that day. Tell the person who runs this Portolab server, so that the calendar can be added.",
    },
  },
};

for (const locale of locales) {
  for (const [readerKind, reader] of Object.entries(readers)) {
    const text = texts[locale];
    const label = labels[locale];
    const value = values[locale];
    const readerText = readerTexts[locale][reader.kind];
    const language = `${languageNames[locale]}, for the ${readerKind}`;
    const render = (report: PortfolioReport, now?: Date): string =>
      renderView(report, reader, now);

    test(`shows the value as the headline with the returns of the portfolio and the IHSG since the start, each holding at its delayed price as a table and as a row, and the returns at each close as a chart and a table, in ${language}`, () => {
      switchLocaleForTest(locale);
      const html = render(reportForTest({}));
      for (const part of [
        `<h2>${readerText.valueTitle}</h2><p>${value.totalValue}</p>${facts([
          [label.return, value.return],
          [label.marketReturn, value.marketReturn],
          [label.cash, value.cash],
          [label.startingCash, value.startingCash],
        ])}<p>${readerText.valuationNotice}</p></section>`,
        `<h2 id="holdings-heading">${readerText.holdingsTitle}</h2>`,
        `<tr><th scope="col">${label.stock}</th><th scope="col">${label.shares}</th><th scope="col">${label.cost}</th><th scope="col"><span>${label.delayedPrice}</span><span>${label.quotedAt}</span></th><th scope="col">${label.value}</th><th scope="col"><span>${label.gain}</span><span>${label.gainReturn}</span></th></tr>`,
        `<tr><th scope="row">${bbcaStock}</th><td>${value.shares}</td><td>${value.cost}</td><td><span>${value.delayedPrice}</span><span>${value.quotedAt}</span></td><td>${value.holdingValue}</td><td><span>${value.gain}</span><span>${value.gainReturn}</span></td></tr>`,
        `<li><div>${bbcaStock}<p>${value.holdingNotice}</p><p>${value.priceNotice}</p></div><div><p>${value.holdingValue}</p><p>${value.gain}</p><p>${value.gainReturn}</p></div></li>`,
        `<h2 id="return-heading">${readerText.returnTitle}</h2><p>${readerText.chartNotice}</p>`,
        `<li><span aria-hidden="true"></span>${readerText.portfolioSeries} ${value.return}</li><li><span aria-hidden="true"></span>IHSG ${value.marketReturn}</li>`,
        '<svg aria-hidden="true">',
        `<summary>${label.returnsTable}</summary>`,
        `<tr><th scope="col">${label.tradingDay}</th><th scope="col">${readerText.portfolioSeries}</th><th scope="col">IHSG</th></tr>`,
        ...value.rows.map(
          ([date, portfolio, market]) =>
            `<tr><th scope="row">${date}</th><td>${portfolio}</td><td>${market}</td></tr>`,
        ),
        text.waiting,
      ]) {
        expect(html).toContain(part);
      }
      expect(html).not.toContain(text.quoteFailure);
    });

    test(`shows a portfolio of cash alone without the IHSG while the close of the IHSG at the start is not stored, and no chart, in ${language}`, () => {
      switchLocaleForTest(locale);
      const html = render(
        reportForTest({
          valuation: valuePortfolio(
            { cash: startingCash, holdings: [] },
            startingCash,
            quotesByCode([]),
          ),
          history: succeed({
            points: [],
            end: { kind: "missingCloses", date: "2026-10-30", codes: ["IHSG"] },
          }),
          market: undefined,
        }),
      );
      expect(html).toContain(
        `<p>${value.startingCash}</p>${facts([
          [label.return, value.noReturn],
          [label.cash, value.startingCash],
          [label.startingCash, value.startingCash],
        ])}`,
      );
      expect(html).toContain(`<p>${readerText.noHoldings}</p>`);
      expect(html).not.toContain("<table");
      expect(html).toContain(text.missingStart);
      expect(html).not.toContain(readerText.chartNotice);
      expect(html).not.toContain(label.returnsTable);
      expect(html).not.toContain("<svg");
    });

    test(`shows no total while one holding or several have no delayed price, and the holding without a price in the table and in its row, in ${language}`, () => {
      switchLocaleForTest(locale);
      const withOne = render(
        reportForTest({
          valuation: valuePortfolio(
            { cash: rupiah(48_529_600), holdings: [bbcaHolding, tlkmHolding] },
            startingCash,
            quotesByCode([bbcaQuote]),
          ),
        }),
      );
      expect(withOne).toContain(
        `<h2>${readerText.valueTitle}</h2><p>${text.oneUnpriced}</p>${facts([
          [label.marketReturn, value.marketReturn],
          [label.cash, value.cash],
          [label.startingCash, value.startingCash],
        ])}`,
      );
      expect(withOne).toContain(
        `<td colSpan="3">${text.unpricedHolding}</td></tr>`,
      );
      expect(withOne).toContain(`<p>${text.unpricedHolding}</p></div></li>`);
      const withSeveral = render(
        reportForTest({
          valuation: valuePortfolio(
            { cash: rupiah(48_529_600), holdings: [bbcaHolding, tlkmHolding] },
            startingCash,
            quotesByCode([]),
          ),
        }),
      );
      expect(withSeveral).toContain(`<p>${text.severalUnpriced}</p>`);
    });

    test(`names the closes that end the chart, and a missing calendar after the chart or before it, in ${language}`, () => {
      switchLocaleForTest(locale);
      expect(
        render(
          reportForTest({
            history: succeed({
              points,
              end: {
                kind: "missingCloses",
                date: "2026-11-04",
                codes: ["IHSG", "BBCA"],
              },
            }),
          }),
        ),
      ).toContain(text.severalMissingCloses);
      const afterChart = render(
        reportForTest({
          history: succeed({ points, end: { kind: "missingCalendar" } }),
        }),
      );
      expect(afterChart).toContain(readerText.chartNotice);
      expect(afterChart).toContain(readerText.calendarMissing);
      const withoutChart = render(
        reportForTest({ history: fail({ kind: "missingCalendar" }) }),
      );
      expect(withoutChart).toContain(readerText.calendarMissing);
      expect(withoutChart).not.toContain(readerText.chartNotice);
    });

    test(`shows each end of the returns, also before the first return, without a chart, in ${language}`, () => {
      switchLocaleForTest(locale);
      const ends: [HistoryEnd, string][] = [
        [waitingForWednesday, text.waiting],
        [
          {
            kind: "missingCloses",
            date: "2026-11-04",
            codes: ["IHSG", "BBCA"],
          },
          text.severalMissingCloses,
        ],
        [{ kind: "missingCalendar" }, readerText.calendarMissing],
      ];
      for (const [end, sentence] of ends) {
        const html = render(
          reportForTest({ history: succeed({ points: [], end }) }),
        );
        expect(html).toContain(`<p>${sentence}</p>`);
        expect(html).not.toContain(readerText.chartNotice);
        expect(html).not.toContain(label.returnsTable);
      }
    });

    test(`names the price of a holding, and the level of the IHSG that the headline counts from, that the latest update of prices could not fetch, in ${language}`, () => {
      switchLocaleForTest(locale);
      // A partial update at 10:30 WIB on Tuesday 3 November 2026, seen half a minute later.
      const attempt: UpdateAttempt = {
        attemptedAt: new Date("2026-11-03T03:30:00Z"),
        succeeded: true,
        consecutiveFailures: 0,
        failedCodes: ["BBCA"],
      };
      const halfMinuteLater = new Date("2026-11-03T03:30:30Z");
      expect(
        render(reportForTest({ quoteAttempt: attempt }), halfMinuteLater),
      ).toContain(`<p>${text.quoteFailure}</p></section>`);
      expect(
        render(
          reportForTest({
            quoteAttempt: { ...attempt, failedCodes: ["IHSG", "BBCA"] },
          }),
          halfMinuteLater,
        ),
      ).toContain(`<p>${text.marketQuoteFailure}</p></section>`);
    });
  }
}
