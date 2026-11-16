import type { RouterContextProvider } from "react-router";
import { readPrices } from "~/features/market-data/read-prices.server";
import { m } from "~/paraglide/messages.js";
import { parseActivityFilter, parseActivityView } from "./activity-selection";
import type { ActivityView } from "./activity-selection";
import { tradeJournal } from "./trade-journal";
import type { Portfolio } from "./portfolio-store.server";

export function readActivity(
  context: Readonly<RouterContextProvider>,
  {
    url,
    portfolio,
    now,
    initialView,
  }: {
    url: URL;
    portfolio: Portfolio;
    now: Date;
    initialView: ActivityView;
  },
) {
  const filter = parseActivityFilter(
    url.searchParams.get("status"),
    m.trading_activity_status_label(),
  );
  const view = parseActivityView(
    url.searchParams.get("view") ?? initialView,
    m.trading_activity_view_label(),
  );
  const prices = readPrices(context, now);
  return {
    fields:
      filter.ok && view.ok
        ? undefined
        : {
            status: url.searchParams.get("status") ?? "all",
            view: url.searchParams.get("view") ?? initialView,
            statusFailure: filter.ok ? undefined : filter.failure,
            viewFailure: view.ok ? undefined : view.failure,
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
    view: view.ok ? view.value : ("orders" as const),
    status: filter.ok && view.ok ? 200 : 400,
  };
}
