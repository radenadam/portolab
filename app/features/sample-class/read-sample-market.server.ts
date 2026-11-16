import type { Database } from "~/database/database.server";
import { companyOf } from "~/features/market-data/company-of";
import {
  listIndexHistory,
  listStockHistory,
} from "~/features/market-data/history-store.server";
import {
  isTradingDay,
  tradingDayBefore,
  lastContinuousTradingMoment,
} from "~/features/market-data/idx-calendar";
import type {
  StockHistory,
  StockQuote,
} from "~/features/market-data/price-source.server";
import {
  trackedStockCodes,
  marketIndex,
  universeOn,
} from "~/features/market-data/tracked-instruments";
import { checkBuyable } from "~/features/trading/check-buyable";
import { tickOfPrice } from "~/features/trading/accepted-prices";
import { idxRulesOn } from "~/features/trading/idx-rules-on";
import { isRupiah } from "~/units/rupiah";

export interface SampleStock {
  history: StockHistory;
  sector: ReturnType<typeof companyOf>["sector"];
  quotes: StockQuote[];
}

/** Split-adjusted fractions cannot be replayed as whole-rupiah trades, so those dates stay out of the recipes. */
function closeQuote(
  history: StockHistory,
  date: string,
): StockQuote | undefined {
  const close = history.closes.find(
    (candidate) => candidate.date === date,
  )?.close;
  const before = tradingDayBefore(date);
  if (!before.ok) return undefined;
  const previous = history.closes.find(
    (candidate) => candidate.date === before.value,
  )?.close;
  const rules = idxRulesOn(date);
  const quotedAt = lastContinuousTradingMoment(date);
  if (
    !rules.ok ||
    !quotedAt.ok ||
    close === undefined ||
    previous === undefined ||
    !isRupiah(close) ||
    !isRupiah(previous) ||
    close < rules.value.minimumPrice ||
    close % tickOfPrice(close, rules.value.tickBands) !== 0
  )
    return undefined;
  return {
    kind: "stock",
    code: history.code,
    price: close,
    previousClose: previous,
    quotedAt: quotedAt.value,
  };
}

export function readSampleMarket(
  database: Database,
  span: { from: string; until: string },
): SampleStock[] {
  const marketCloses = listIndexHistory(database, marketIndex.code);
  const stocks: SampleStock[] = [];
  for (const code of trackedStockCodes) {
    const history = listStockHistory(database, code);
    const quotes: StockQuote[] = [];
    for (const close of history.closes) {
      if (close.date < span.from || close.date > span.until) continue;
      const trading = isTradingDay(close.date);
      const universe = universeOn(close.date);
      if (
        !trading.ok ||
        !trading.value ||
        !universe.ok ||
        !universe.value.includes(code)
      )
        continue;
      const stock = {
        closes: {
          ...history,
          closes: history.closes.filter((value) => value.date <= close.date),
        },
        marketCloses: {
          ...marketCloses,
          closes: marketCloses.closes.filter(
            (value) => value.date <= close.date,
          ),
        },
      };
      if (!checkBuyable(code, close.date, stock).ok) continue;
      const quote = closeQuote(history, close.date);
      if (quote !== undefined) quotes.push(quote);
    }
    if (quotes.length > 1)
      stocks.push({ history, sector: companyOf(code).sector, quotes });
  }
  return stocks;
}
