import { readLessonTask } from "~/features/learning/read-lesson-task.server";
import { data } from "react-router";
import { readPrices } from "~/features/market-data/read-prices.server";
import { m } from "~/paraglide/messages.js";
import { activityPath } from "./activity-path";
import { parseActivityFilter, parseActivityView } from "./activity-selection";
import { findTradingPlace } from "./find-trading-place.server";
import type { PortfolioPageRequest } from "./find-trading-place.server";
import type { PortfolioOwner } from "./portfolio-store.server";
import { cancelFromForm } from "./order-actions.server";
import { readTradingPortfolio } from "./read-trading-portfolio.server";
import { tradeJournal } from "./trade-journal";
export function readActivityPage(
  { context, request, params, url, now }: PortfolioPageRequest,
  kind: PortfolioOwner["kind"],
) {
  const { place, portfolio } = readTradingPortfolio(
    context,
    {
      request,
      url,
      classId: params.classId,
      now,
    },
    kind,
  );
  const filter = parseActivityFilter(
    url.searchParams.get("status"),
    m.trading_activity_status_label(),
  );
  const view = parseActivityView(
    url.searchParams.get("view"),
    m.trading_activity_view_label(),
  );
  const prices = readPrices(context, now);
  return data(
    {
      fields:
        filter.ok && view.ok
          ? undefined
          : {
              status: url.searchParams.get("status") ?? "all",
              view: url.searchParams.get("view") ?? "orders",
              statusFailure: filter.ok ? undefined : filter.failure,
              viewFailure: view.ok ? undefined : view.failure,
            },
      classId: place.classId,
      path: activityPath(place.classId, kind),
      task: kind === "membership" ? readLessonTask(url) : undefined,
      demonstration: kind === "demonstration",
      portfolioKind: kind,
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
    },
    { status: filter.ok && view.ok ? 200 : 400 },
  );
}

export async function cancelActivityOrder(
  { context, request, params, url, now }: PortfolioPageRequest,
  kind: PortfolioOwner["kind"],
) {
  const place = findTradingPlace(context, url, {
    classId: params.classId,
    kind: kind,
  });
  return cancelFromForm(
    context,
    { form: await request.formData(), place, now },
    `${activityPath(place.classId, kind)}${url.search}`,
  );
}
