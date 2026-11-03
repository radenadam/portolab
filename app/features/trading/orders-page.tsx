import type { ReactNode } from "react";
import { Link } from "react-router";
import type { data, ShouldRevalidateFunctionArgs } from "react-router";
import { databaseContext } from "~/database/database.server";
import { classPath } from "~/features/classes/class-path";
import type { ClassId } from "~/features/classes/classes.schema";
import { priceSourceContext } from "~/features/market-data/price-source-context.server";
import type { PriceSourceDescription } from "~/features/market-data/price-source.server";
import { trackedStockCodes } from "~/features/market-data/tracked-instruments";
import { FormFailure, FormSuccess } from "~/form";
import { formatNumber } from "~/formatting";
import { isLoadedByAnotherSite } from "~/is-loaded-by-another-site.server";
import { pageTitle } from "~/page-title";
import { m } from "~/paraglide/messages.js";
import type { Result } from "~/result";
import { parseRecordId } from "~/value-parsers";
import type { Route } from "./+types/orders-page";
import { checkPortfolioOrders } from "./check-open-orders.server";
import { findStudentPlace } from "./find-student-place.server";
import { cancelFromForm, placeFromForm } from "./order-actions.server";
import type { OrdersAnswer } from "./order-actions.server";
import { orderFailureText } from "./order-failure-text";
import { OrderForm } from "./order-form";
import type { OrderDay } from "./order-form";
import { OpenOrderList, PastOrderList } from "./order-list";
import { orderTradingDay } from "./order-trading-day";
import type { TradingDayFailure } from "./order-trading-day";
import { readPortfolio } from "./portfolio-store.server";
import type { Portfolio } from "./portfolio-store.server";
import { CashSummary, HoldingList } from "./portfolio-summary";
import styles from "./trading.module.css";
import type { OrderId } from "./trading.schema";

export function meta({ loaderData }: Route.MetaArgs): Route.MetaDescriptors {
  return [
    { title: pageTitle(m.trading_page_title({ class: loaderData.className })) },
  ];
}

export function loader({ context, request, params, url }: Route.LoaderArgs): {
  classId: ClassId;
  className: string;
  portfolio: Portfolio;
  now: Date;
  source: PriceSourceDescription;
  day: Result<OrderDay, TradingDayFailure>;
  isPlaced: boolean;
} {
  const now = new Date();
  const place = findStudentPlace(context, url, params.classId);
  const database = context.get(databaseContext);
  // A page of another site can make a browser load this address without the student opening it, so only a visit of the student checks the orders.
  if (!isLoadedByAnotherSite(request)) {
    database.transaction((transaction) => {
      checkPortfolioOrders(transaction, place.owner.membershipId, now);
    });
  }
  const portfolio = readPortfolio(database, place.owner);
  const { name, delayMinutes } = context.get(priceSourceContext);
  const day = orderTradingDay(now, delayMinutes);
  const placed = parseRecordId<OrderId>(
    url.searchParams.get("placed"),
    "placed",
  );
  return {
    classId: place.classId,
    className: place.className,
    portfolio,
    now,
    source: { name, delayMinutes },
    day: day.ok
      ? {
          ok: true,
          value: {
            date: day.value.date,
            tradesFrom: day.value.tradesFrom,
            expiresAt: day.value.expiresAt,
            lotShares: day.value.rules.lotShares,
            maximumLots: day.value.rules.maximumLots,
          },
        }
      : day,
    // The notice confirms only an order of this portfolio, so an address with another number shows the orders without it.
    isPlaced:
      placed.ok && portfolio.orders.some((order) => order.id === placed.value),
  };
}

// The orders change while the page is open, such as by a fill of the price job or a cancel on another device, and after a form that Portolab refused, React Router keeps the orders that the page loaded. So the page loads them again after every form.
export function shouldRevalidate({
  formMethod,
  defaultShouldRevalidate,
}: ShouldRevalidateFunctionArgs): boolean {
  return formMethod !== undefined || defaultShouldRevalidate;
}

export async function action({
  context,
  request,
  params,
  url,
}: Route.ActionArgs): Promise<
  Response | ReturnType<typeof data<OrdersAnswer>>
> {
  const now = new Date();
  const place = findStudentPlace(context, url, params.classId);
  const form = await request.formData();
  // Each order in the list has a form that sends only the number of the order to cancel, and the order form never sends it.
  return form.has("cancel")
    ? cancelFromForm(context, { form, place, now })
    : placeFromForm(context, { form, place, now });
}

export default function OrdersPage({
  loaderData,
  actionData,
}: Route.ComponentProps): ReactNode {
  const { portfolio, now, source, day } = loaderData;
  return (
    <>
      <h1>{m.trading_page_title({ class: loaderData.className })}</h1>
      <Link to={classPath(loaderData.classId)} className={styles["link"]}>
        {m.trading_back_link({ class: loaderData.className })}
      </Link>
      {loaderData.isPlaced && <FormSuccess text={m.trading_placed_notice()} />}
      <p>
        {m.trading_fill_notice({
          source: source.name,
          minutes: formatNumber(source.delayMinutes),
        })}
      </p>
      <Link to="/prices" className={styles["link"]}>
        {m.trading_prices_link()}
      </Link>
      <h2>{m.trading_cash_title()}</h2>
      <CashSummary cash={portfolio.cash} orders={portfolio.orders} now={now} />
      <h2>{m.trading_holdings_title()}</h2>
      <HoldingList
        holdings={portfolio.holdings}
        orders={portfolio.orders}
        now={now}
      />
      <h2>{m.trading_place_title()}</h2>
      {day.ok ? (
        <OrderForm
          codes={trackedStockCodes}
          day={day.value}
          fields={actionData?.fields}
          failure={actionData?.failure}
        />
      ) : (
        <p>{orderFailureText(day.failure)}</p>
      )}
      <h2>{m.trading_open_orders_title()}</h2>
      {actionData?.cancelFailure !== undefined && (
        <FormFailure text={actionData.cancelFailure} />
      )}
      <OpenOrderList orders={portfolio.orders} now={now} />
      <h2>{m.trading_past_orders_title()}</h2>
      <PastOrderList orders={portfolio.orders} now={now} />
    </>
  );
}
