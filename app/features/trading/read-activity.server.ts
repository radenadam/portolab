import type { RouterContextProvider } from "react-router";
import { readPrices } from "~/features/market-data/read-prices.server";
import { m } from "~/paraglide/messages.js";
import { parseActivityFilter } from "./activity-selection";
import { tradeJournal } from "./trade-journal";
import type { Portfolio } from "./portfolio-store.server";

export function readActivity(
  context: Readonly<RouterContextProvider>,
  { url, portfolio, now }: { url: URL; portfolio: Portfolio; now: Date },
) {
  const filter = parseActivityFilter(
    url.searchParams.get("status"),
    m.trading_activity_status_label(),
  );
  const prices = readPrices(context, now);
  return {
    fields: filter.ok
      ? undefined
      : {
          status: url.searchParams.get("status") ?? "all",
          statusFailure: filter.failure,
        },
    orders: portfolio.orders,
    trades: tradeJournal(
      portfolio.orders,
      prices.quotes.filter((quote) => quote.kind === "stock"),
    ),
    prices: {
      now: prices.now,
      source: prices.source,
      latestAttempt: prices.latestAttempt,
    },
    now,
    filter: filter.ok ? filter.value : ("all" as const),
    status: filter.ok ? 200 : 400,
  };
}
