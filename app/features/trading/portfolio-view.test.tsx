import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import type {
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
import { rupiah } from "~/units/rupiah";
import { shares } from "~/units/shares";
import type { Holding } from "./holding-after-fill";
import type { HistoryEnd, ReturnPoint } from "./portfolio-history";
import { PortfolioView } from "./portfolio-view";
import type { PortfolioReport } from "./read-portfolio-report.server";
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
// 10:00 WIB on Wednesday 4 November 2026.
const wednesday = new Date("2026-11-04T03:00:00Z");

const points: ReturnPoint[] = [
  {
    date: "2026-10-30",
    portfolio: cumulativeReturn(0),
    market: cumulativeReturn(0),
  },
  {
    date: "2026-11-02",
    portfolio: cumulativeReturn(-0.001494),
    market: cumulativeReturn(0.00786624613163801),
  },
  {
    date: "2026-11-03",
    portfolio: cumulativeReturn(-0.030704),
    market: cumulativeReturn(-0.03020733431546059),
  },
];
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
    ...changes,
  };
}

// The names of the classes of CSS modules carry a hash, so the texts compare the markup without them.
function render(report: PortfolioReport, now = wednesday): string {
  return renderToStaticMarkup(
    <PortfolioView report={report} now={now} source={yahooFinance} />,
  ).replaceAll(/ class="[^"]*"/g, "");
}

const fall = '<span aria-hidden="true">▼ </span>';
const rise = '<span aria-hidden="true">▲ </span>';

/** The terms of a list of definitions and their values, as the markup shows them. */
function definitions(pairs: readonly (readonly [string, string])[]): string {
  return pairs
    .map(([term, value]) => `<dt>${term}</dt><dd>${value}</dd>`)
    .join("");
}

const labels: Record<
  Locale,
  {
    valueTitle: string;
    cash: string;
    holdingsValue: string;
    totalValue: string;
    startingCash: string;
    return: string;
    shares: string;
    cost: string;
    delayedPrice: string;
    quotedAt: string;
    value: string;
    gain: string;
    gainReturn: string;
    portfolioSeries: string;
    tradingDay: string;
    returnsTable: string;
  }
> = {
  id: {
    valueTitle: "Nilai portofolio Anda",
    cash: "Kas",
    holdingsValue: "Nilai saham yang Anda pegang",
    totalValue: "Nilai total",
    startingCash: "Kas awal",
    return: "Imbal hasil sejak awal",
    shares: "Jumlah saham",
    cost: "Biaya termasuk biaya broker",
    delayedPrice: "Harga tertunda",
    quotedAt: "Tercatat pada (WIB)",
    value: "Nilai",
    gain: "Untung atau rugi",
    gainReturn: "Imbal hasil atas biaya",
    portfolioSeries: "Portofolio Anda",
    tradingDay: "Hari bursa",
    returnsTable: "Imbal hasil pada setiap penutupan",
  },
  en: {
    valueTitle: "Value of your portfolio",
    cash: "Cash",
    holdingsValue: "Value of your holdings",
    totalValue: "Total value",
    startingCash: "Starting cash",
    return: "Return since the start",
    shares: "Shares",
    cost: "Cost with broker fees",
    delayedPrice: "Delayed price",
    quotedAt: "Quoted at (WIB)",
    value: "Value",
    gain: "Gain or loss",
    gainReturn: "Return on the cost",
    portfolioSeries: "Your portfolio",
    tradingDay: "Trading day",
    returnsTable: "The return at each close",
  },
};

// The values that the lists and the table show, in the format of each language.
const values: Record<
  Locale,
  {
    cash: string;
    holdingsValue: string;
    totalValue: string;
    startingCash: string;
    return: string;
    noHoldingsValue: string;
    noReturn: string;
    shares: string;
    cost: string;
    delayedPrice: string;
    quotedAt: string;
    gain: string;
    gainReturn: string;
    rows: readonly (readonly [string, string, string])[];
  }
> = {
  id: {
    cash: "Rp\u00a048.529.600",
    holdingsValue: "Rp\u00a048.400.000",
    totalValue: "Rp\u00a096.929.600",
    startingCash: "Rp\u00a0100.000.000",
    return: `${fall}-3,07%`,
    noHoldingsValue: "Rp\u00a00",
    noReturn: "0,00%",
    shares: "10.000",
    cost: "Rp\u00a049.874.700",
    delayedPrice: "Rp\u00a04.840",
    quotedAt: "3 Nov 2026, 09.55",
    gain: `${fall}-Rp\u00a01.474.700`,
    gainReturn: `${fall}-2,96%`,
    rows: [
      ["30 Okt 2026", "0,00%", "0,00%"],
      ["2 Nov 2026", `${fall}-0,15%`, `${rise}+0,79%`],
      ["3 Nov 2026", `${fall}-3,07%`, `${fall}-3,02%`],
    ],
  },
  en: {
    cash: "IDR\u00a048,529,600",
    holdingsValue: "IDR\u00a048,400,000",
    totalValue: "IDR\u00a096,929,600",
    startingCash: "IDR\u00a0100,000,000",
    return: `${fall}-3.07%`,
    noHoldingsValue: "IDR\u00a00",
    noReturn: "0.00%",
    shares: "10,000",
    cost: "IDR\u00a049,874,700",
    delayedPrice: "IDR\u00a04,840",
    quotedAt: "Nov 3, 2026, 9:55 AM",
    gain: `${fall}-IDR\u00a01,474,700`,
    gainReturn: `${fall}-2.96%`,
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
    valuationNotice: string;
    returnTitle: string;
    chartNotice: string;
    waiting: string;
    credit: string;
    noHoldings: string;
    missingStart: string;
    oneUnpriced: string;
    severalUnpriced: string;
    unpricedHolding: string;
    severalMissingCloses: string;
    calendarMissing: string;
    quoteFailure: string;
  }
> = {
  id: {
    valuationNotice:
      "Portofolio Anda adalah simulasi dengan uang virtual. Portolab menilai setiap saham yang Anda pegang pada harga tertunda terakhir dari Yahoo Finance, sekitar 10 menit di belakang BEI, sehingga nilainya dapat berbeda dari nilai di bursa pada saat yang sama.",
    returnTitle: "<h2>Imbal hasil Anda dibandingkan IHSG</h2>",
    chartNotice:
      "Grafik dan tabel di bawah membandingkan imbal hasil portofolio Anda dengan imbal hasil IHSG sejak penutupan 30 Oktober 2026, sebelum Anda dapat bertransaksi. Setiap imbal hasilnya memakai harga penutupan final pada harinya.",
    waiting:
      "Harga tanggal 4 November 2026 menjadi final pada pukul 16.26 WIB, dan Portolab menampilkan imbal hasil mulai hari itu setelah pembaruan riwayat harga menyimpan harga penutupan hari itu atau hari sesudahnya.",
    credit: "Grafik: TradingView Lightweight Charts™ © 2025 TradingView, Inc.",
    noHoldings: "Anda belum memegang saham.",
    missingStart:
      "Portolab belum menyimpan harga penutupan IHSG pada 30 Oktober 2026. Portolab menampilkan imbal hasil mulai hari itu setelah pembaruan riwayat harga menyimpan harga penutupan IHSG pada hari itu atau hari sesudahnya.",
    oneUnpriced:
      "Portolab menampilkan nilai total dan imbal hasil setelah pembaruan harga berikutnya membawa harga tertunda TLKM.",
    severalUnpriced:
      "Portolab menampilkan nilai total dan imbal hasil setelah pembaruan harga berikutnya membawa harga tertunda BBCA dan TLKM.",
    unpricedHolding: "Portolab belum memiliki harga tertunda TLKM.",
    severalMissingCloses:
      "Portolab belum menyimpan harga penutupan IHSG dan BBCA pada 4 November 2026. Portolab menampilkan imbal hasil mulai hari itu setelah pembaruan riwayat harga menyimpan harga penutupan masing-masing pada hari itu atau hari sesudahnya.",
    calendarMissing:
      "Portolab belum dapat menampilkan imbal hasil hari bursa berikutnya, karena kalender perdagangan BEI untuk hari itu belum tercatat. Beri tahu dosen Anda agar kalender tersebut dapat ditambahkan.",
    quoteFailure:
      "Portolab tidak dapat memperbarui harga BBCA pada 3 Nov 2026, 10.30 WIB, jadi harganya di bawah adalah harga terakhir yang tersimpan. Portolab mencoba lagi pada 3 Nov 2026, 10.31 WIB.",
  },
  en: {
    valuationNotice:
      "Your portfolio is a simulation with virtual cash. Portolab values each holding at the latest delayed price from Yahoo Finance, about 10 minutes behind IDX, so a value can differ from the value on the exchange at the same moment.",
    returnTitle: "<h2>Your return against the IHSG</h2>",
    chartNotice:
      "The chart and the table below compare the return of your portfolio with the return of the IHSG since the close of October 30, 2026, before you could trade. Each of their returns uses the final closes of its day.",
    waiting:
      "The prices of November 4, 2026 become final at 4:26 PM WIB, and Portolab shows the returns from that day on once an update of the price history stores closes of that day or of a later day.",
    credit: "Chart: TradingView Lightweight Charts™ © 2025 TradingView, Inc.",
    noHoldings: "You hold no shares yet.",
    missingStart:
      "Portolab has not stored the close of IHSG on October 30, 2026 yet. It shows the returns from that day on once an update of the price history stores a close of IHSG on that day or on a later day.",
    oneUnpriced:
      "Portolab shows the total value and the return once the next update of prices brings a delayed price of TLKM.",
    severalUnpriced:
      "Portolab shows the total value and the return once the next update of prices brings the delayed prices of BBCA and TLKM.",
    unpricedHolding: "Portolab has no delayed price of TLKM yet.",
    severalMissingCloses:
      "Portolab has not stored the closes of IHSG and BBCA on November 4, 2026 yet. It shows the returns from that day on once an update of the price history stores a close of each of them on that day or on a later day.",
    calendarMissing:
      "Portolab cannot show the return of the next trading day, because it has not recorded the trading calendar of IDX for that day. Tell your lecturer, so that the calendar can be added.",
    quoteFailure:
      "Portolab could not update the price of BBCA at Nov 3, 2026, 10:30 AM WIB, so the BBCA price below is the last one it stored. Portolab tries again at Nov 3, 2026, 10:31 AM WIB.",
  },
};

for (const locale of locales) {
  const text = texts[locale];
  const label = labels[locale];
  const value = values[locale];
  const language = languageNames[locale];

  test(`shows the value of each holding at its delayed price, the return since the start, and the returns of the portfolio and the IHSG at each close, in ${language}`, () => {
    switchLocaleForTest(locale);
    const html = render(reportForTest({}));
    for (const part of [
      `<p>${text.valuationNotice}</p>`,
      `<h2>${label.valueTitle}</h2>`,
      definitions([
        [label.cash, value.cash],
        [label.holdingsValue, value.holdingsValue],
        [label.totalValue, value.totalValue],
        [label.startingCash, value.startingCash],
        [label.return, value.return],
      ]),
      ">BBCA</p>",
      definitions([
        [label.shares, value.shares],
        [label.cost, value.cost],
        [label.delayedPrice, value.delayedPrice],
        [label.quotedAt, value.quotedAt],
        [label.value, value.holdingsValue],
        [label.gain, value.gain],
        [label.gainReturn, value.gainReturn],
      ]),
      text.returnTitle,
      text.chartNotice,
      `<li>${label.portfolioSeries}</li><li>IHSG</li>`,
      `<summary>${label.returnsTable}</summary>`,
      `<tr><th scope="col">${label.tradingDay}</th><th scope="col">${label.portfolioSeries}</th><th scope="col">IHSG</th></tr>`,
      ...value.rows.map(
        ([date, portfolio, market]) =>
          `<tr><th scope="row">${date}</th><td>${portfolio}</td><td>${market}</td></tr>`,
      ),
      text.waiting,
      `<a href="https://www.tradingview.com/">${text.credit}</a>`,
    ]) {
      expect(html).toContain(part);
    }
    expect(html).not.toContain(text.quoteFailure);
  });

  test(`shows a portfolio of cash alone, and no chart while the close of the IHSG at the start is not stored, in ${language}`, () => {
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
      }),
    );
    expect(html).toContain(
      definitions([
        [label.cash, value.startingCash],
        [label.holdingsValue, value.noHoldingsValue],
        [label.totalValue, value.startingCash],
        [label.startingCash, value.startingCash],
        [label.return, value.noReturn],
      ]),
    );
    expect(html).toContain(`<p>${text.noHoldings}</p>`);
    expect(html).toContain(text.missingStart);
    expect(html).not.toContain(text.chartNotice);
    expect(html).not.toContain(label.returnsTable);
    expect(html).not.toContain(text.credit);
  });

  test(`shows no total while one holding or several have no delayed price, in ${language}`, () => {
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
      `<dl>${definitions([
        [label.cash, value.cash],
        [label.startingCash, value.startingCash],
      ])}</dl><p>${text.oneUnpriced}</p>`,
    );
    expect(withOne).toContain(text.unpricedHolding);
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
    expect(afterChart).toContain(text.chartNotice);
    expect(afterChart).toContain(text.calendarMissing);
    const withoutChart = render(
      reportForTest({ history: fail({ kind: "missingCalendar" }) }),
    );
    expect(withoutChart).toContain(text.calendarMissing);
    expect(withoutChart).not.toContain(text.chartNotice);
  });

  test(`shows each end of the returns, also before the first return, without a chart, in ${language}`, () => {
    switchLocaleForTest(locale);
    const ends: [HistoryEnd, string][] = [
      [waitingForWednesday, text.waiting],
      [
        { kind: "missingCloses", date: "2026-11-04", codes: ["IHSG", "BBCA"] },
        text.severalMissingCloses,
      ],
      [{ kind: "missingCalendar" }, text.calendarMissing],
    ];
    for (const [end, sentence] of ends) {
      const html = render(
        reportForTest({ history: succeed({ points: [], end }) }),
      );
      expect(html).toContain(`<p>${sentence}</p>`);
      expect(html).not.toContain(text.chartNotice);
      expect(html).not.toContain(label.returnsTable);
    }
  });

  test(`names the price of a holding that the latest update of prices could not fetch, in ${language}`, () => {
    switchLocaleForTest(locale);
    // A partial update at 10:30 WIB on Tuesday 3 November 2026, seen half a minute later.
    const attempt: UpdateAttempt = {
      attemptedAt: new Date("2026-11-03T03:30:00Z"),
      succeeded: true,
      consecutiveFailures: 0,
      failedCodes: ["BBCA"],
    };
    expect(
      render(
        reportForTest({ quoteAttempt: attempt }),
        new Date("2026-11-03T03:30:30Z"),
      ),
    ).toContain(text.quoteFailure);
  });
}
