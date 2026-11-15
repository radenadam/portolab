import { ActivitySelectionForm } from "./activity-selection-form";
import type { ReactNode } from "react";
import { data, Link } from "react-router";
import { readPrices } from "~/features/market-data/read-prices.server";
import { pageTitle } from "~/page-title";
import { FormFailure } from "~/form";
import { m } from "~/paraglide/messages.js";
import type { Route } from "./+types/activity-page";
import { activityPath } from "./activity-path";
import { parseActivityFilter, parseActivityView } from "./activity-selection";
import { findStudentPlace } from "./find-student-place.server";
import { cancelFromForm } from "./order-actions.server";
import { readStudentPortfolio } from "./read-student-portfolio.server";
import { reloadsAfterEveryForm } from "./reloads-after-every-form";
import { ActivityOrders } from "./activity-orders";
import { JournalList } from "./journal-list";
import { tradeJournal } from "./trade-journal";
import styles from "./activity.module.css";

export function meta(): Route.MetaDescriptors {
  return [{ title: pageTitle(m.trading_activity_title()) }];
}

export function loader({ context, request, params, url }: Route.LoaderArgs) {
  const now = new Date();
  const { place, portfolio } = readStudentPortfolio(context, {
    request,
    url,
    classId: params.classId,
    now,
  });
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

export const shouldRevalidate = reloadsAfterEveryForm;

export async function action({
  context,
  request,
  params,
  url,
}: Route.ActionArgs) {
  const now = new Date();
  const place = findStudentPlace(context, url, params.classId);
  return cancelFromForm(
    context,
    { form: await request.formData(), place, now },
    `${activityPath(place.classId)}${url.search}`,
  );
}

export default function ActivityPage({
  loaderData,
  actionData,
}: Route.ComponentProps): ReactNode {
  const { classId, orders, now, trades, prices } = loaderData;
  const cancelFailure = actionData?.cancelFailure;
  const { filter, view } =
    cancelFailure === undefined
      ? loaderData
      : { filter: "all" as const, view: "orders" as const };
  const base = activityPath(classId);
  return (
    <div className={styles["activity"]}>
      <h1>{m.trading_activity_title()}</h1>
      {loaderData.fields !== undefined && (
        <ActivitySelectionForm fields={loaderData.fields} />
      )}
      {cancelFailure !== undefined && <FormFailure text={cancelFailure} />}
      <nav
        className={styles["toggle"]}
        aria-label={m.trading_activity_view_label()}
      >
        <Link
          to={`${base}?status=${filter}`}
          aria-current={view === "orders" ? "page" : undefined}
        >
          {m.trading_activity_orders_label()}
        </Link>
        <Link
          to={`${base}?view=journal&status=${filter}`}
          aria-current={view === "journal" ? "page" : undefined}
        >
          {m.trading_activity_journal_label()}
        </Link>
      </nav>
      <div className={styles["columns"]} data-layout="columns" data-view={view}>
        <ActivityOrders
          orders={orders}
          now={now}
          classId={classId}
          filter={filter}
        />
        <JournalList trades={trades} prices={prices} classId={classId} />
      </div>
    </div>
  );
}
