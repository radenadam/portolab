import { measureAgainstMarket } from "~/features/measures/capm";
import {
  measureFailureText,
  shortMeasureFailureText,
} from "~/features/measures/measure-failure-text";
import { fail, succeed } from "~/result";
import { measureStoredMarket } from "~/features/measures/measure-stored.server";
import { monthSpanOf } from "~/features/measures/month-span";
import type { RouterContextProvider } from "react-router";
import { databaseContext } from "~/database/database.server";
import { readStockRows } from "~/features/measures/read-measures.server";
import { wibDateOf } from "~/wib";
import { listIndexHistory, listStockHistory } from "./history-store.server";
import { priceChartStart } from "./price-chart-range";
import type { MarketRange } from "./market-filters";
import type { MarketRow } from "./filter-market-rows";
import { readPrices } from "./read-prices.server";
import { marketIndex, universeOn } from "./tracked-instruments";

/** An outage must never make a stock disappear, so the universe defines the rows independently of quotes and measures. */
export function readMarket(
  context: Readonly<RouterContextProvider>,
  now: Date,
  range: MarketRange,
) {
  const database = context.get(databaseContext);
  const prices = readPrices(context, now);
  const date = wibDateOf(now);
  const universe = universeOn(date);
  const codes = universe.ok ? universe.value : [];
  const rows: MarketRow[] = readStockRows(database)
    .filter((stock) => codes.includes(stock.code))
    .map(({ code, measures }) => {
      return {
        code,
        quote: prices.quotes
          .filter((quote) => quote.kind === "stock")
          .find((quote) => quote.code === code),
        closes: listStockHistory(database, code, priceChartStart(date, "1m"))
          .closes.filter((close) => close.date <= date)
          .map((close) => close.close),
        measures: measures.ok
          ? {
              beta: measures.value.beta,
              standardDeviation: measures.value.standardDeviation,
            }
          : undefined,
        measureFailure: !measures.ok
          ? shortMeasureFailureText(measures.failure)
          : undefined,
      };
    });
  const market = measureStoredMarket(database);
  const from = priceChartStart(date, range);
  return {
    ...prices,
    index: marketIndex.code,
    rows,
    marketReference: market.ok
      ? succeed({
          standardDeviation: market.value.standardDeviation.value,
          variance: market.value.variance.value,
          months: monthSpanOf(market.value.returns),
          beta: measureAgainstMarket(
            marketIndex.code,
            market.value.returns,
            market.value,
          ).beta,
        })
      : fail(measureFailureText(market.failure, { kind: "market" })),
    universeAvailable: universe.ok,
    indexQuote: prices.quotes.find((quote) => quote.kind === "index"),
    indexCloses: listIndexHistory(database, marketIndex.code).closes.filter(
      (close) => close.date >= from && close.date <= date,
    ),
  };
}
