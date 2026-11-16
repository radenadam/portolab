import { latestQuoteTime } from "~/features/market-data/latest-quote-time";
import type { IndexQuote } from "~/features/market-data/price-source.server";
import type { CumulativeReturn } from "~/units/cumulative-return";
import { wibDateOf } from "~/wib";
import type { Order } from "./order";
import type { HistoryEnd, PortfolioHistory } from "./portfolio-history";
import { isAtOrAfterHistoryBase } from "./portfolio-history";
import type { PortfolioValuation } from "./value-portfolio";

/** A quote snapshot is distinct from a daily close, so a stale quote never rewrites a past day's final value. */
export function currentReturnHistory(
  history: PortfolioHistory,
  {
    valuation,
    market,
    orders,
  }: {
    valuation: PortfolioValuation;
    market: { quote: IndexQuote; return: CumulativeReturn } | undefined;
    orders: readonly Order[];
  },
): PortfolioHistory {
  if (valuation.total === undefined || market === undefined) return history;
  let measuredAt = latestQuoteTime([
    market.quote,
    ...valuation.holdings.flatMap((holding) =>
      holding.kind === "priced" ? [holding.quote] : [],
    ),
  ]);
  for (const order of orders) {
    if (
      order.state.kind === "filled" &&
      (measuredAt === undefined || order.state.fill.filledAt > measuredAt)
    )
      measuredAt = order.state.fill.filledAt;
  }
  const first = history.points[0];
  if (measuredAt === undefined || first === undefined) return history;
  const date = wibDateOf(measuredAt);
  if (!isAtOrAfterHistoryBase(measuredAt, first.date)) return history;
  const earlier = history.points.filter(
    (point) => point === first || point.date < date,
  );
  return {
    ...history,
    end: snapshotEnd(history, earlier.length),
    points: [
      ...earlier,
      {
        date,
        measuredAt,
        portfolio: valuation.total.return,
        market: market.return,
      },
    ],
  };
}

function snapshotEnd(
  history: PortfolioHistory,
  earlierCount: number,
): HistoryEnd {
  if (earlierCount === history.points.length) return history.end;
  switch (history.end.kind) {
    case "missingCalendar":
      return history.end;
    case "notFinal":
    case "missingCloses":
    case "snapshot":
      return { kind: "snapshot" };
  }
}
