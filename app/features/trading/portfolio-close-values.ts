import type {
  DailyClose,
  StockHistory,
} from "~/features/market-data/price-source.server";
import type { SplitAdjustedRupiah } from "~/units/split-adjusted-rupiah";
import { rupiah } from "~/units/rupiah";
import type { Rupiah } from "~/units/rupiah";
import type { Shares } from "~/units/shares";
import { fail, succeed } from "~/result";
import type { Result } from "~/result";
import type { HistoryInput } from "./portfolio-history";
import { replayPortfolioFills } from "./replay-portfolio-fills";

export function closesByDate<Price>(
  closes: readonly DailyClose<Price>[],
): Map<string, Price> {
  const byDate = new Map<string, Price>();
  for (const close of closes) {
    byDate.set(close.date, close.close);
  }
  return byDate;
}

/** Only stored closes can value a past day, including stocks that have since been sold. The caller chooses a final trading day. */
export function portfolioValueAtClose(
  date: string,
  input: Pick<HistoryInput, "startingCash" | "orders" | "stocks">,
): Result<Rupiah, { codes: string[] }> {
  const valued = valueHoldingsOnDay(date, {
    ...replayPortfolioFills(input.startingCash, input.orders)(date),
    stocks: stockClosesByCode(input.stocks),
  });
  const codes = [...valued.missingCodes, ...valued.skippedCodes];
  return codes.length === 0
    ? succeed(rupiah(Math.round(valued.value)))
    : fail({ codes });
}

export function stockClosesByCode(
  stocks: readonly StockHistory[],
): Map<string, Map<string, SplitAdjustedRupiah>> {
  const closes = new Map<string, Map<string, SplitAdjustedRupiah>>();
  for (const stock of stocks)
    closes.set(stock.code, closesByDate(stock.closes));
  return closes;
}

export function valueHoldingsOnDay(
  date: string,
  portfolio: {
    cash: Rupiah;
    sharesByCode: ReadonlyMap<string, Shares>;
    stocks: ReadonlyMap<string, ReadonlyMap<string, SplitAdjustedRupiah>>;
  },
): { value: number; missingCodes: string[]; skippedCodes: string[] } {
  const missingCodes: string[] = [];
  const skippedCodes: string[] = [];
  let value: number = portfolio.cash;
  for (const [code, count] of portfolio.sharesByCode) {
    if (count === 0) {
      continue;
    }
    const closes =
      portfolio.stocks.get(code) ?? new Map<string, SplitAdjustedRupiah>();
    const close = closes.get(date);
    if (close !== undefined) {
      value += count * close;
    } else if (hasLaterClose(closes, date)) {
      skippedCodes.push(code);
    } else {
      missingCodes.push(code);
    }
  }
  return { value, missingCodes, skippedCodes };
}

export function hasLaterClose(
  closes: ReadonlyMap<string, unknown>,
  date: string,
): boolean {
  for (const closeDate of closes.keys()) {
    if (closeDate > date) {
      return true;
    }
  }
  return false;
}
