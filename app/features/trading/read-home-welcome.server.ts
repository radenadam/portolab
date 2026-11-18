import { readPriceGuide } from "~/features/learning/read-price-guide.server";
import type { Database } from "~/database/database.server";
import { listIndexHistory } from "~/features/market-data/history-store.server";
import {
  priceChartMonths,
  priceChartStart,
} from "~/features/market-data/price-chart-range";
import { marketIndex } from "~/features/market-data/tracked-instruments";
import { measureStoredMarket } from "~/features/measures/measure-stored.server";
import { measureFailureText } from "~/features/measures/measure-failure-text";
import type { Rupiah } from "~/units/rupiah";
import { wibDateOf } from "~/wib";
import { fail, succeed } from "~/result";
import type { Portfolio } from "./portfolio-store.server";
import { onboardingHistoryRange } from "./onboarding";

/** Deleted trade records can leave a changed cash balance, which the regular summary must keep visible. */
export function readHomeWelcome(
  database: Database,
  {
    portfolio,
    startingCash,
    now,
  }: { portfolio: Portfolio; startingCash: Rupiah; now: Date },
) {
  if (
    portfolio.holdings.length > 0 ||
    portfolio.orders.length > 0 ||
    portfolio.cash !== startingCash
  )
    return undefined;
  const date = wibDateOf(now);
  const from = priceChartStart(date, onboardingHistoryRange);
  const closes = listIndexHistory(database, marketIndex.code).closes.filter(
    (close) => close.date >= from && close.date <= date,
  );
  const market = measureStoredMarket(database);
  const guide = readPriceGuide();
  return {
    startingCash,
    guide: { title: guide.title, summary: guide.sections["key-idea"] },
    indexHistory: {
      values: closes.map((close) => close.close),
      end: closes.at(-1)?.date,
      months: priceChartMonths[onboardingHistoryRange],
    },
    riskFree: market.ok
      ? succeed(market.value.riskFreeRate)
      : fail(measureFailureText(market.failure, { kind: "market" })),
  };
}

export type HomeWelcomeData = NonNullable<ReturnType<typeof readHomeWelcome>>;
