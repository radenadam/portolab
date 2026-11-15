import type { ReactNode } from "react";
import { data, Link } from "react-router";
import { databaseContext } from "~/database/database.server";
import { classPath } from "~/features/classes/class-path";
import type { ClassId } from "~/features/classes/classes.schema";
import type { PriceSourceDescription } from "~/features/market-data/price-source.server";
import { formatNumber } from "~/formatting";
import { PageColumns, PageHeader } from "~/frame";
import { pageTitle } from "~/page-title";
import { m } from "~/paraglide/messages.js";
import type { Route } from "./+types/orders-page";
import { ticketAction } from "./order-actions.server";
import { activityPath } from "./activity-path";
import { PlaceOrderSection } from "./place-order-section";
import { orderTicketStatus, readOrderTicket } from "./order-ticket.server";
import type { OrderTicket } from "./order-ticket.server";
import { ordersPath } from "./orders-path";
import type { OrderSide } from "./order";
import { parseOrderSide } from "./order-form-fields";
import type { Portfolio } from "./portfolio-store.server";
import { readStudentPortfolio } from "./read-student-portfolio.server";
import { CashSummary, HoldingList } from "./portfolio-summary";
import { reloadsAfterEveryForm } from "./reloads-after-every-form";
import styles from "./trading.module.css";

/** What the page of the orders of a student shows. */
interface OrdersPageData {
  classId: ClassId;
  className: string;
  portfolio: Portfolio;
  now: Date;
  source: PriceSourceDescription;
  ticket: OrderTicket;
  initialSide: OrderSide | undefined;
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
  const side = parseOrderSide(
    url.searchParams.get("side"),
    m.trading_side_label(),
  );
  const ticket = readOrderTicket(context.get(databaseContext), {
    url,
    now,
    delayMinutes: source.delayMinutes,
  });
  return data<OrdersPageData>(
    {
      classId: place.classId,
      className: place.className,
      portfolio,
      now,
      source,
      ticket,
      initialSide: side.ok ? side.value : undefined,
    },
    { status: orderTicketStatus(ticket) },
  );
}

export const shouldRevalidate = reloadsAfterEveryForm;

export const action = ticketAction;

export default function OrdersPage({
  loaderData,
  actionData,
}: Route.ComponentProps): ReactNode {
  const { classId, className, portfolio, now, source } = loaderData;
  return (
    <PageColumns
      header={
        <PageHeader
          path={[{ label: className, path: classPath(classId) }]}
          title={m.trading_orders_title()}
          pricesAt={undefined}
        />
      }
      main={
        <>
          <p className={styles["details"]}>
            {m.trading_fill_notice({
              source: source.name,
              minutes: formatNumber(source.delayMinutes),
            })}
          </p>
          <section>
            <h2>{m.trading_cash_title()}</h2>
            <CashSummary
              cash={portfolio.cash}
              orders={portfolio.orders}
              now={now}
            />
          </section>
          <section>
            <h2>{m.trading_holdings_title()}</h2>
            <HoldingList
              holdings={portfolio.holdings}
              orders={portfolio.orders}
              now={now}
            />
          </section>
          <Link to={activityPath(classId)} className={styles["link"]}>
            {m.trading_activity_title()}
          </Link>
        </>
      }
      aside={
        <PlaceOrderSection
          ticket={loaderData.ticket}
          pagePath={ordersPath(classId)}
          moment={{ now, delayMinutes: source.delayMinutes }}
          answer={actionData}
          initialSide={loaderData.initialSide}
        />
      }
      narrowPlacement="first"
    />
  );
}
