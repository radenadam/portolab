import type { ReactNode } from "react";
import { data, Link } from "react-router";
import type { ShouldRevalidateFunctionArgs } from "react-router";
import { databaseContext } from "~/database/database.server";
import { classPath } from "~/features/classes/class-path";
import type { ClassId } from "~/features/classes/classes.schema";
import type { PriceSourceDescription } from "~/features/market-data/price-source.server";
import { trackedStockCodes } from "~/features/market-data/tracked-instruments";
import { measuresPath } from "~/features/measures/measures-path";
import { FormFailure, FormSuccess } from "~/form";
import { formatNumber } from "~/formatting";
import { pageTitle } from "~/page-title";
import { m } from "~/paraglide/messages.js";
import { succeed } from "~/result";
import type { Result } from "~/result";
import { parseRecordId } from "~/value-parsers";
import type { Route } from "./+types/orders-page";
import { findStudentPlace } from "./find-student-place.server";
import { cancelFromForm, placeFromForm } from "./order-actions.server";
import type { OrdersAnswer } from "./order-actions.server";
import { orderDayOf } from "./order-form";
import type { OrderDay } from "./order-form";
import { OpenOrderList, PastOrderList } from "./order-list";
import { PlaceOrderSection } from "./place-order-section";
import { portfolioPath } from "./portfolio-path";
import { orderTradingDay } from "./order-trading-day";
import type { TradingDayFailure } from "./order-trading-day";
import type { Portfolio } from "./portfolio-store.server";
import { readStockChoice } from "./read-stock-choice.server";
import type { StockChoice } from "./read-stock-choice.server";
import { readStudentPortfolio } from "./read-student-portfolio.server";
import { CashSummary, HoldingList } from "./portfolio-summary";
import styles from "./trading.module.css";
import type { OrderId } from "./trading.schema";

/** What the page of the orders of a student shows. */
interface OrdersPageData {
  classId: ClassId;
  className: string;
  portfolio: Portfolio;
  now: Date;
  source: PriceSourceDescription;
  day: Result<OrderDay, TradingDayFailure>;
  choice: StockChoice;
  isPlaced: boolean;
}

export function meta({ loaderData }: Route.MetaArgs): Route.MetaDescriptors {
  return [
    { title: pageTitle(m.trading_page_title({ class: loaderData.className })) },
  ];
}

export function loader({
  context,
  request,
  params,
  url,
}: Route.LoaderArgs): ReturnType<typeof data<OrdersPageData>> {
  const now = new Date();
  const { place, portfolio, source } = readStudentPortfolio(context, {
    request,
    url,
    classId: params.classId,
    now,
  });
  const day = orderTradingDay(now, source.delayMinutes);
  const placed = parseRecordId<OrderId>(
    url.searchParams.get("placed"),
    "placed",
  );
  // While the trading day lacks a record, the page offers no order and so chooses no stock for one.
  const choice: StockChoice = day.ok
    ? readStockChoice(
        context.get(databaseContext),
        url.searchParams.get("code"),
      )
    : { kind: "choosing", failure: undefined };
  return data<OrdersPageData>(
    {
      classId: place.classId,
      className: place.className,
      portfolio,
      now,
      source,
      day: day.ok ? succeed(orderDayOf(day.value)) : day,
      choice,
      // The notice confirms only an order of this portfolio, so an address with another number shows the orders without it.
      isPlaced:
        placed.ok &&
        portfolio.orders.some((order) => order.id === placed.value),
    },
    {
      status:
        choice.kind === "choosing" && choice.failure !== undefined ? 400 : 200,
    },
  );
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
    : placeFromForm(context, {
        form,
        place,
        now,
        chosenStock: url.searchParams.get("code"),
      });
}

export default function OrdersPage({
  loaderData,
  actionData,
}: Route.ComponentProps): ReactNode {
  const { portfolio, now, source } = loaderData;
  return (
    <>
      <h1>{m.trading_page_title({ class: loaderData.className })}</h1>
      <Link to={classPath(loaderData.classId)} className={styles["link"]}>
        {m.trading_back_link({ class: loaderData.className })}
      </Link>
      <Link to={portfolioPath(loaderData.classId)} className={styles["link"]}>
        {m.trading_portfolio_link()}
      </Link>
      <Link to={measuresPath(loaderData.classId)} className={styles["link"]}>
        {m.trading_measures_link()}
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
      <PlaceOrderSection
        day={loaderData.day}
        choice={loaderData.choice}
        codes={trackedStockCodes}
        classId={loaderData.classId}
        moment={{ now, delayMinutes: source.delayMinutes }}
        answer={actionData}
      />
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
