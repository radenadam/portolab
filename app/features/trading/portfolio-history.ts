import { replayPortfolioFills } from "./replay-portfolio-fills";
import {
  closesByDate,
  stockClosesByCode,
  valueHoldingsOnDay,
  hasLaterClose,
} from "./portfolio-close-values";
import {
  currentOrNextSessionStart,
  pricesFinalAt,
  tradingDayAfter,
  tradingDayBefore,
} from "~/features/market-data/idx-calendar";
import { priceChange } from "~/features/market-data/price-change";
import type {
  IndexCode,
  IndexHistory,
  StockHistory,
} from "~/features/market-data/price-source.server";
import { fail } from "~/result";
import type { Result } from "~/result";
import { cumulativeReturn } from "~/units/cumulative-return";
import type { CumulativeReturn } from "~/units/cumulative-return";
import type { IndexPoints } from "~/units/index-points";
import type { Rupiah } from "~/units/rupiah";
import type { Shares } from "~/units/shares";
import type { SplitAdjustedRupiah } from "~/units/split-adjusted-rupiah";
import { wibDateOf } from "~/wib";
import type { Order } from "./order";

/** The returns of a portfolio and of the IHSG at the close of one trading day, both since the close at the start of the history. */
export interface ReturnPoint {
  /** The trading day in WIB, such as 2026-10-30. */
  date: string;
  /** The value of the cash and the holdings at the closes of the day, as a return on the starting cash. */
  portfolio: CumulativeReturn;
  market: CumulativeReturn;
}

/** Why the returns end at their latest close: the prices of the next trading day are not final yet, Portolab has not stored a close that the next day needs, or no IDX calendar covers the next day. */
export type HistoryEnd =
  | { kind: "notFinal"; date: string; finalAt: Date }
  | { kind: "missingCloses"; date: string; codes: string[] }
  | MissingCalendar;

/** No IDX calendar covers a day that the history needs. */
export interface MissingCalendar {
  kind: "missingCalendar";
}

const missingCalendar: MissingCalendar = { kind: "missingCalendar" };

/** The returns of a portfolio and of the IHSG at each final close since the start, as decision 0018 explains. */
export interface PortfolioHistory {
  /** The returns at the close of the base, which is the close of the IHSG on the start or the latest one before it, and of each later trading day, oldest first. It is empty while the close of the start is not final, or while neither it nor a later close of the IHSG is stored. */
  points: ReturnPoint[];
  end: HistoryEnd;
}

/** The start of the history of a portfolio whose student joined the class at a moment: the last trading day before the first session in which the student could trade, at whose close the portfolio held only its starting cash. It fails when no IDX calendar covers a day that the search reaches. */
export function historyStartDate(
  joinedAt: Date,
): Result<string, MissingCalendar> {
  const firstSession = currentOrNextSessionStart(joinedAt);
  if (!firstSession.ok) {
    return fail(missingCalendar);
  }
  const startDate = tradingDayBefore(wibDateOf(firstSession.value));
  return startDate.ok ? startDate : fail(missingCalendar);
}

/** What the history replays: the cash with which the portfolio started, the start that historyStartDate gives, the orders of the portfolio, the closes of the IHSG and of each stock that an order filled from the start, and the moment and the delay of prices that decide which closes are final. */
export interface HistoryInput {
  startingCash: Rupiah;
  startDate: string;
  orders: readonly Order[];
  market: IndexHistory;
  stocks: readonly StockHistory[];
  now: Date;
  delayMinutes: number;
}

/** The returns of a portfolio at the close of each trading day since the start whose prices are final, from its fills and the stored closes, until a day whose closes are not final or not stored. A day on which the IHSG or a stock of the portfolio has no close but a later one has no return. */
export function portfolioHistory(input: HistoryInput): PortfolioHistory {
  const market = {
    code: input.market.code,
    closes: closesByDate(input.market.closes),
  };
  const startEnd = unfinishedEnd(input.startDate, input);
  if (startEnd !== undefined) {
    return { points: [], end: startEnd };
  }
  const base = baseClose(market.closes, input.startDate);
  if (base === undefined) {
    return {
      points: [],
      end: {
        kind: "missingCloses",
        date: input.startDate,
        codes: [market.code],
      },
    };
  }
  const stocks = stockClosesByCode(input.stocks);
  const holdingsAt = replayPortfolioFills(input.startingCash, input.orders);
  // At the close of the base the portfolio held only its starting cash.
  const points: ReturnPoint[] = [
    {
      date: base.date,
      portfolio: cumulativeReturn(0),
      market: cumulativeReturn(0),
    },
  ];
  let date = input.startDate;
  for (;;) {
    const next = tradingDayAfter(date);
    if (!next.ok) {
      return { points, end: missingCalendar };
    }
    date = next.value;
    const end = unfinishedEnd(date, input);
    if (end !== undefined) {
      return { points, end };
    }
    const day = valueOnDay(date, { ...holdingsAt(date), market, stocks });
    switch (day.kind) {
      case "missing":
        return {
          points,
          end: { kind: "missingCloses", date, codes: day.codes },
        };
      case "skipped":
        break;
      case "valued":
        points.push({
          date,
          portfolio: cumulativeReturn(
            priceChange(day.value, input.startingCash),
          ),
          market: cumulativeReturn(priceChange(day.level, base.level)),
        });
        break;
    }
  }
}

/** The return of the IHSG since the close from which portfolioHistory counts the returns of a portfolio, at a later level, such as its latest delayed level, so that it covers the same time as the return of the portfolio since its starting cash. It is undefined while portfolioHistory has no such close, because the prices of the start are not final or no close of the IHSG on the start or later is stored. */
export function marketReturnSinceStart(
  input: Pick<HistoryInput, "startDate" | "market" | "now" | "delayMinutes">,
  level: IndexPoints,
): CumulativeReturn | undefined {
  if (unfinishedEnd(input.startDate, input) !== undefined) {
    return undefined;
  }
  const base = baseClose(closesByDate(input.market.closes), input.startDate);
  return base === undefined
    ? undefined
    : cumulativeReturn(priceChange(level, base.level));
}

/** The close of the IHSG from which the returns count: its close on the start, or its latest close before the start when the source left out the close of the start, because a later close is stored. The portfolio held only its starting cash at either close. It is undefined while the close of the start is not stored, nor any later one. */
function baseClose(
  closes: ReadonlyMap<string, IndexPoints>,
  startDate: string,
): { date: string; level: IndexPoints } | undefined {
  const level = closes.get(startDate);
  if (level !== undefined) {
    return { date: startDate, level };
  }
  if (!hasLaterClose(closes, startDate)) {
    return undefined;
  }
  let latest: { date: string; level: IndexPoints } | undefined;
  for (const [date, close] of closes) {
    if (date < startDate && (latest === undefined || date > latest.date)) {
      latest = { date, level: close };
    }
  }
  return latest;
}

// A day whose prices are not final yet ends the history before it, and so does a day that no IDX calendar covers.
function unfinishedEnd(
  date: string,
  { now, delayMinutes }: Pick<HistoryInput, "now" | "delayMinutes">,
): HistoryEnd | undefined {
  const finalAt = pricesFinalAt(date, delayMinutes);
  if (!finalAt.ok) {
    return missingCalendar;
  }
  return finalAt.value > now
    ? { kind: "notFinal", date, finalAt: finalAt.value }
    : undefined;
}

type DayValue =
  | { kind: "valued"; value: number; level: IndexPoints }
  | { kind: "skipped" }
  | { kind: "missing"; codes: string[] };

// A close that is missing while a later close is stored is a day that the source left out, so that day has no return. A close that is missing without a later one is a close that the history job has not stored yet, which ends the history.
function valueOnDay(
  date: string,
  portfolio: {
    cash: Rupiah;
    sharesByCode: ReadonlyMap<string, Shares>;
    market: { code: IndexCode; closes: ReadonlyMap<string, IndexPoints> };
    stocks: ReadonlyMap<string, ReadonlyMap<string, SplitAdjustedRupiah>>;
  },
): DayValue {
  const holdingValue = valueHoldingsOnDay(date, portfolio);
  const missingCodes: string[] = [];
  let isSkipped = holdingValue.skippedCodes.length > 0;
  const level = portfolio.market.closes.get(date);
  if (level === undefined) {
    if (hasLaterClose(portfolio.market.closes, date)) {
      isSkipped = true;
    } else {
      missingCodes.push(portfolio.market.code);
    }
  }
  missingCodes.push(...holdingValue.missingCodes);
  if (missingCodes.length > 0) {
    return { kind: "missing", codes: missingCodes };
  }
  if (isSkipped || level === undefined) {
    return { kind: "skipped" };
  }
  return { kind: "valued", value: holdingValue.value, level };
}
