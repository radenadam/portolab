import { expect, test } from "vitest";
import { fixturePriceSource } from "~/features/market-data/fixture-price-source.server";
import {
  indexHistoryForTest,
  stockHistoryForTest,
} from "~/features/market-data/history-for-test";
import type {
  DailyHistory,
  StockQuote,
} from "~/features/market-data/price-source.server";
import type { OrderRequest } from "~/features/trading/order";
import {
  acceptedForTest,
  limitForTest,
  orderLotsForTest,
  purchaseForTest,
  saleForTest,
} from "~/features/trading/orders-for-test";
import { costRatesForTest } from "~/features/trading/rules-for-test";
import type { PortfolioValuation } from "~/features/trading/value-portfolio";
import type { Result } from "~/result";
import { successValueForTest } from "~/success-value-for-test";
import { shares } from "~/units/shares";
import { closeToForTest } from "./close-to-for-test";
import { defaultEstimationSettings } from "./estimation-settings";
import type { MeasureFailure } from "./measure";
import { measureTrade } from "./measure-trade";
import type { HeldStock, TradeImpact } from "./measure-trade";
import type { ValuedPortfolioMeasures } from "./measure-valued-portfolio";
import {
  aadiValuationForTest,
  ammnValuationForTest,
  valuationForTest,
} from "./measures-for-test.server";
import { monthEndClosesForTest } from "./month-end-closes-for-test";

// The expected values were computed with the decimal module of Python at 50 significant digits, from the month-end closes in month-end-closes-for-test.ts, a BI-Rate of 5.75%, the quotes of 30 October 2026 that the fixture source records, and the broker fee of 0.15% and the final tax on sales of 0.1% of trading-costs.ts, each rounded to the nearest whole rupiah. Python weighed every share at its quote and checked that the shares of the variance of each portfolio add up to 1. The window ends on 30 September 2026.

type RecordedCode = Parameters<typeof monthEndClosesForTest>[0];

const ihsg = monthEndClosesForTest("IHSG");

/**
 * Places an order of a test at 10:00 WIB on Monday 2 November 2026 against a valuation, as the order ticket does before it shows what the order changes, and measures the portfolio before and after the order.
 * The stocks of the portfolio are the stocks of the codes, which are those of the valuation and the stock of the order, with their recorded month-end closes and their quotes of 30 October 2026.
 */
async function impactOf(
  valuation: PortfolioValuation,
  codes: readonly RecordedCode[],
  request: OrderRequest,
): Promise<Result<TradeImpact, MeasureFailure>> {
  const fetched = successValueForTest(
    await fixturePriceSource.fetchQuotes(
      codes.map((code) => ({ kind: "stock", code })),
      new AbortController().signal,
    ),
    "The fixture source records a quote of every stock of the test",
  );
  const quoteOf = (code: string): StockQuote => {
    const quote = fetched.quotes.find((candidate) => candidate.code === code);
    if (quote?.kind !== "stock") {
      throw new Error(`The fixture source records no quote of ${code}.`);
    }
    return quote;
  };
  const histories = new Map<string, DailyHistory>(
    codes.map((code) => [code, monthEndClosesForTest(code)]),
  );
  const historyOf = (code: string): DailyHistory => {
    const history = histories.get(code);
    if (history === undefined) {
      throw new Error(`The codes of the test lack ${code}.`);
    }
    return history;
  };
  const stocks: HeldStock[] = codes.map((code) => ({
    ...historyOf(code),
    shares:
      valuation.holdings.find((holding) => holding.code === code)?.shares ??
      shares(0),
    price: quoteOf(code).price,
  }));
  const order = acceptedForTest(
    request,
    { cash: valuation.cash, holdings: valuation.holdings, orders: [] },
    {
      quote: quoteOf(request.code),
      delayMinutes: fixturePriceSource.delayMinutes,
      closes: stockHistoryForTest(historyOf(request.code)),
      marketCloses: indexHistoryForTest(ihsg),
    },
  );
  return measureTrade(
    { stocks, cash: valuation.cash },
    { order, rates: costRatesForTest(order.tradingDay) },
    { market: ihsg, settings: defaultEstimationSettings },
  );
}

/** The weights and the measures of a portfolio that a test compares with the values of Python. */
function summaryOf(measures: ValuedPortfolioMeasures): {
  months: number;
  weights: number[];
  cashWeight: number;
  expectedReturn: number;
  standardDeviation: number;
  beta: number;
  alpha: number;
  sharpeRatio: number | undefined;
  treynorRatio: number | undefined;
  risks: { varianceShare: number; correlationWithPortfolio: number }[];
} {
  return {
    months: measures.market.returns.length,
    weights: measures.holdings.map((holding) => holding.weight),
    cashWeight: measures.cashWeight,
    expectedReturn: measures.expectedReturn.value,
    standardDeviation: measures.standardDeviation.value,
    beta: measures.beta.value,
    alpha: measures.securityMarketLine.value,
    sharpeRatio: measures.sharpeRatio.ok
      ? measures.sharpeRatio.value.value
      : undefined,
    treynorRatio: measures.treynorRatio.ok
      ? measures.treynorRatio.value.value
      : undefined,
    risks: measures.holdingRisks.ok
      ? measures.holdingRisks.value.map((risk) => ({
          varianceShare: risk.varianceShare.value,
          correlationWithPortfolio: risk.correlationWithPortfolio.value,
        }))
      : [],
  };
}

test("measures a purchase of a stock that the portfolio does not hold, with the new shares at their quote and the cash less the limit price and the broker fee", async () => {
  const impact = successValueForTest(
    await impactOf(
      valuationForTest(["BBCA", "TLKM"]),
      ["BBCA", "TLKM", "ASII"],
      purchaseForTest({
        code: "ASII",
        lots: orderLotsForTest(10),
        price: limitForTest(4_750),
      }),
    ),
    "The closes give measures",
  );
  expect(impact.trade).toEqual({ value: 4_750_000, fee: 7_125, tax: 0 });
  expect(impact.cashAfter).toBe(6_198_875);
  // Before the trade, ASII has no weight, so the portfolio has the measures of its 60 months without ASII, and ASII shows how its returns move with those of the portfolio.
  expect(summaryOf(impact.before)).toEqual({
    months: 60,
    weights: [0.5, 0.3, 0],
    cashWeight: 0.2,
    expectedReturn: closeToForTest(-0.0021586726703076266, 16),
    standardDeviation: closeToForTest(0.04065715082669377, 15),
    beta: closeToForTest(0.6206929278148289, 14),
    alpha: closeToForTest(-0.004259743653981885, 16),
    sharpeRatio: closeToForTest(-0.17094998531994998, 14),
    treynorRatio: closeToForTest(-0.01119770989085248, 16),
    risks: [
      {
        varianceShare: closeToForTest(0.5775867707178435, 15),
        correlationWithPortfolio: closeToForTest(0.8984914660690569, 14),
      },
      {
        varianceShare: closeToForTest(0.4224132292821566, 15),
        correlationWithPortfolio: closeToForTest(0.8315116919090838, 14),
      },
      {
        varianceShare: 0,
        correlationWithPortfolio: closeToForTest(0.5067045384473973, 14),
      },
    ],
  });
  expect(summaryOf(impact.after)).toEqual({
    months: 60,
    weights: [
      closeToForTest(0.49960896797185483, 15),
      closeToForTest(0.2997653807831129, 15),
      closeToForTest(0.0875546931823623, 15),
    ],
    cashWeight: closeToForTest(0.11307095806267001, 15),
    expectedReturn: closeToForTest(-0.0021943968032382636, 16),
    standardDeviation: closeToForTest(0.04415328190119854, 15),
    beta: closeToForTest(0.7115109577491355, 14),
    alpha: closeToForTest(-0.0039017874526780403, 16),
    sharpeRatio: closeToForTest(-0.1582229716363461, 14),
    treynorRatio: closeToForTest(-0.0098186308922147, 16),
    risks: [
      {
        varianceShare: closeToForTest(0.5251795566008451, 15),
        correlationWithPortfolio: closeToForTest(0.8879128873993275, 14),
      },
      {
        varianceShare: closeToForTest(0.38792942748854214, 15),
        correlationWithPortfolio: closeToForTest(0.8299451718881306, 14),
      },
      {
        varianceShare: closeToForTest(0.08689101591061275, 15),
        correlationWithPortfolio: closeToForTest(0.6089158325203622, 14),
      },
    ],
  });
});

test("measures the portfolio before and after a purchase of a stock with fewer monthly returns over the fewer months that they share", async () => {
  // AMMN listed in July 2023, so it shares 38 monthly returns with the portfolio, whose own measures use 60.
  const impact = successValueForTest(
    await impactOf(
      valuationForTest(["BBCA", "TLKM"]),
      ["BBCA", "TLKM", "AMMN"],
      purchaseForTest({
        code: "AMMN",
        lots: orderLotsForTest(10),
        price: limitForTest(3_650),
      }),
    ),
    "The closes give measures",
  );
  expect(impact.trade).toEqual({ value: 3_650_000, fee: 5_475, tax: 0 });
  expect(impact.cashAfter).toBe(7_300_525);
  expect(summaryOf(impact.before)).toMatchObject({
    months: 38,
    weights: [0.5, 0.3, 0],
    expectedReturn: closeToForTest(-0.007466708996015474, 16),
    standardDeviation: closeToForTest(0.04428583970394191, 15),
    beta: closeToForTest(0.5826521577404052, 14),
    sharpeRatio: closeToForTest(-0.27680124718491034, 14),
    treynorRatio: closeToForTest(-0.02103892605533564, 16),
  });
  expect(summaryOf(impact.after)).toMatchObject({
    months: 38,
    weights: [
      closeToForTest(0.5000499776127679, 15),
      closeToForTest(0.3000299865676608, 15),
      closeToForTest(0.06663681702397237, 15),
    ],
    cashWeight: closeToForTest(0.13328321879559887, 15),
    expectedReturn: closeToForTest(-0.005586931976558735, 16),
    standardDeviation: closeToForTest(0.048100893880116374, 15),
    beta: closeToForTest(0.6567210015850717, 14),
    alpha: closeToForTest(-0.005910304559521093, 16),
    sharpeRatio: closeToForTest(-0.21576727179108904, 14),
    treynorRatio: closeToForTest(-0.015803664902105243, 16),
  });
});

test("measures a sale of every share of a stock, which keeps the stock without weight and adds its value less the broker fee and the final tax to the cash", async () => {
  const impact = successValueForTest(
    await impactOf(
      valuationForTest(["BBCA", "TLKM"]),
      ["BBCA", "TLKM"],
      saleForTest({
        code: "TLKM",
        lots: orderLotsForTest(83),
        price: limitForTest(1_980),
      }),
    ),
    "The closes give measures",
  );
  expect(impact.trade).toEqual({ value: 16_434_000, fee: 24_651, tax: 16_434 });
  expect(impact.cashAfter).toBe(27_348_915);
  // BBCA is the only stock with weight, so it adds all the variance and moves with the portfolio exactly, and TLKM correlates with the portfolio as it does with BBCA.
  expect(summaryOf(impact.after)).toEqual({
    months: 60,
    weights: [closeToForTest(0.5003752814610958, 15), 0],
    cashWeight: closeToForTest(0.49962471853890417, 15),
    expectedReturn: closeToForTest(-0.0005117080731547506, 16),
    standardDeviation: closeToForTest(0.026155682979221145, 15),
    beta: closeToForTest(0.3449444061048115, 14),
    alpha: closeToForTest(-0.003808100847777222, 16),
    sharpeRatio: closeToForTest(-0.20276185271226055, 14),
    treynorRatio: closeToForTest(-0.015374578181186638, 16),
    risks: [
      {
        varianceShare: closeToForTest(1, 14),
        correlationWithPortfolio: closeToForTest(1, 14),
      },
      {
        varianceShare: 0,
        correlationWithPortfolio: closeToForTest(0.5032434833954371, 14),
      },
    ],
  });
});

test("measures a sale of the only stock of a portfolio, which leaves cash alone without a Sharpe ratio, a Treynor ratio, or a share of its variance", async () => {
  const impact = successValueForTest(
    await impactOf(
      ammnValuationForTest(),
      ["AMMN"],
      saleForTest({
        code: "AMMN",
        lots: orderLotsForTest(10),
        price: limitForTest(3_650),
      }),
    ),
    "The closes give measures",
  );
  expect(impact.cashAfter).toBe(13_640_875);
  expect(summaryOf(impact.before)).toMatchObject({
    months: 38,
    sharpeRatio: closeToForTest(0.05589330859307045, 14),
    treynorRatio: closeToForTest(0.009274664715333844, 16),
  });
  expect(impact.after.cashWeight).toBe(1);
  expect(impact.after.sharpeRatio).toEqual({
    ok: false,
    failure: { kind: "noPortfolioVariation" },
  });
  expect(impact.after.treynorRatio).toEqual({
    ok: false,
    failure: { kind: "betaNotPositive", beta: 0 },
  });
  expect(impact.after.holdingRisks).toEqual({
    ok: false,
    failure: { kind: "noPortfolioVariation" },
  });
});

test("fails for a sale of a stock with too few monthly returns, and names it", async () => {
  // AADI listed in December 2024, so it has 21 monthly returns. placeOrder accepts no purchase of it, but it accepts a sale of a holding that lacks monthly returns, as decision 0015 explains.
  expect(
    await impactOf(
      aadiValuationForTest(),
      ["AADI"],
      saleForTest({
        code: "AADI",
        lots: orderLotsForTest(10),
        price: limitForTest(11_475),
      }),
    ),
  ).toEqual({
    ok: false,
    failure: { kind: "tooFewReturns", code: "AADI", count: 21, minimum: 24 },
  });
});
