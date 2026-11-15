import type { StockQuote } from "~/features/market-data/price-source.server";
import { priceChange } from "~/features/market-data/price-change";
import { rupiah } from "~/units/rupiah";
import type { Rupiah } from "~/units/rupiah";
import { cumulativeReturn } from "~/units/cumulative-return";
import type { CumulativeReturn } from "~/units/cumulative-return";
import { holdingAfterFill } from "./holding-after-fill";
import type { Holding } from "./holding-after-fill";
import type { Fill } from "./order";
import type { StoredOrder } from "./order-rows";

export interface JournalTrade {
  order: StoredOrder;
  fill: Fill;
  quote: StockQuote | undefined;
  change: CumulativeReturn | undefined;
  realized: Rupiah | undefined;
}

/** Replay in fill order because a resting limit can fill after a newer market order. */
export function tradeJournal(
  orders: readonly StoredOrder[],
  quotes: readonly StockQuote[],
): JournalTrade[] {
  const trades: JournalTrade[] = [];
  for (const order of orders) {
    if (order.state.kind !== "filled") continue;
    const fill = order.state.fill;
    const quote = quotes.find((candidate) => candidate.code === order.code);
    trades.push({
      order,
      fill,
      quote,
      change:
        quote === undefined || quote.quotedAt < fill.quotedAt
          ? undefined
          : cumulativeReturn(priceChange(quote.price, fill.price)),
      realized: undefined,
    });
  }
  trades.sort(
    (left, right) =>
      left.fill.filledAt.getTime() - right.fill.filledAt.getTime() ||
      left.order.id - right.order.id,
  );
  restoreCosts(trades);
  return trades.reverse();
}

function restoreCosts(trades: JournalTrade[]): void {
  const holdings = new Map<string, Holding>();
  const incomplete = new Set<string>();
  for (const trade of trades) {
    const { order, fill } = trade;
    const before = holdings.get(order.code);
    // A manual deletion can leave a sale without its purchases, so its cost cannot be recovered.
    if (incomplete.has(order.code)) continue;
    if (
      order.side === "sell" &&
      (before === undefined || before.shares < order.shares)
    ) {
      incomplete.add(order.code);
      continue;
    }
    const after = holdingAfterFill(before, order, fill);
    switch (order.side) {
      case "buy":
        break;
      case "sell":
        trade.realized = rupiah(
          fill.cashChange - ((before?.cost ?? 0) - after.cost),
        );
        break;
    }
    holdings.set(order.code, after);
  }
}
