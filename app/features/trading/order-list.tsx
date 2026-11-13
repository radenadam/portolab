import type { ReactNode } from "react";
import { Form } from "react-router";
import { SubmitButton } from "~/form";
import {
  formatCalendarDate,
  formatMarketClock,
  formatMarketTime,
  formatRupiah,
} from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { lotCount, shareCount } from "./count-parts";
import { hasOpenState, isOpenOrder } from "./open-orders";
import type { Fill, Order, OrderSide, OrderState } from "./order";
import { orderFailureText } from "./order-failure-text";
import styles from "./trading.module.css";
import { purchaseCost } from "./trading-costs";
import type { OrderId } from "./trading.schema";

/** An order of the list, with the number that the form that cancels it sends. */
type ListedOrder = Order & { id: OrderId };

interface TitleInputs {
  lots: string;
  code: string;
}

const marketTitles: Record<OrderSide, (inputs: TitleInputs) => string> = {
  buy: m.trading_market_purchase_title,
  sell: m.trading_market_sale_title,
};

const limitTitles: Record<
  OrderSide,
  (inputs: TitleInputs & { limit: string }) => string
> = {
  buy: m.trading_limit_purchase_title,
  sell: m.trading_limit_sale_title,
};

/** The orders that are open at a moment, newest first, each with a button that cancels it. */
export function OpenOrderList({
  orders,
  now,
}: {
  orders: readonly ListedOrder[];
  now: Date;
}): ReactNode {
  const open = orders.filter((order) => isOpenOrder(order, now)).reverse();
  if (open.length === 0) {
    return <p>{m.trading_no_open_orders_body()}</p>;
  }
  return (
    <ul className={styles["list"]}>
      {open.map((order) => (
        <li key={order.id} className={styles["item"]}>
          <OrderLines order={order} now={now} />
          <Form method="post">
            <input type="hidden" name="cancel" value={order.id} />
            <SubmitButton label={m.trading_cancel_label()} />
          </Form>
        </li>
      ))}
    </ul>
  );
}

/** The orders that ended by a moment, newest first, each with how it ended. */
export function PastOrderList({
  orders,
  now,
}: {
  orders: readonly ListedOrder[];
  now: Date;
}): ReactNode {
  const ended = orders.filter((order) => !isOpenOrder(order, now)).reverse();
  if (ended.length === 0) {
    return <p>{m.trading_no_past_orders_body()}</p>;
  }
  return (
    <ul className={styles["list"]}>
      {ended.map((order) => (
        <li key={order.id} className={styles["item"]}>
          <OrderLines order={order} now={now} />
        </li>
      ))}
    </ul>
  );
}

/** The orders of a student that have a reason, newest first, each with its price, when the student placed it, and the reason, which the lecturer of the class reads. */
export function ReasonSection({
  orders,
  studentName,
}: {
  orders: readonly ListedOrder[];
  studentName: string;
}): ReactNode {
  const reasoned: { order: ListedOrder; reason: string }[] = [];
  for (const order of orders.toReversed()) {
    if (order.reason !== undefined) {
      reasoned.push({ order, reason: order.reason });
    }
  }
  return (
    <section>
      <h2>{m.trading_lecturer_reasons_title()}</h2>
      {reasoned.length === 0 ? (
        <p>{m.trading_lecturer_no_reasons_body({ name: studentName })}</p>
      ) : (
        <ul className={styles["list"]}>
          {reasoned.map(({ order, reason }) => (
            <li key={order.id} className={styles["item"]}>
              <OrderHeading order={order} />
              <p className={styles["reason"]}>{reason}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function OrderLines({ order, now }: { order: Order; now: Date }): ReactNode {
  return (
    <>
      <OrderHeading order={order} />
      {stateLines(order, stateAt(order, now)).map((line) => (
        <p key={line} className={styles["details"]}>
          {line}
        </p>
      ))}
      {order.reason !== undefined && (
        <p className={styles["reason"]}>
          {m.trading_reason_notice({ reason: order.reason })}
        </p>
      )}
    </>
  );
}

/** The side, the lots, the stock, and the price of an order, and when the student placed it for which trading day. */
function OrderHeading({ order }: { order: Order }): ReactNode {
  return (
    <>
      <p className={styles["title"]}>{orderTitle(order)}</p>
      <p className={styles["details"]}>
        {m.trading_placed_at_notice({
          time: formatMarketTime(order.placedAt),
          date: formatCalendarDate(order.tradingDay),
        })}
      </p>
    </>
  );
}

/** The heading of an order: its side, its lots, its stock, and its price. */
function orderTitle(order: Order): string {
  const inputs = { lots: lotCount(order.lots), code: order.code };
  switch (order.price.kind) {
    case "market":
      return marketTitles[order.side](inputs);
    case "limit":
      return limitTitles[order.side]({
        ...inputs,
        limit: formatRupiah(order.price.limit),
      });
  }
}

// An order whose trading day ended keeps the state waiting or resting until a check marks it expired, so the moment decides how it stands, as it decides what it sets aside.
function stateAt(order: Order, now: Date): OrderState {
  if (isOpenOrder(order, now) || !hasOpenState(order)) {
    return order.state;
  }
  return { kind: "expired", expiredAt: order.expiresAt };
}

function stateLines(order: Order, state: OrderState): string[] {
  switch (state.kind) {
    case "waiting":
      return [
        m.trading_waiting_notice({ code: order.code }),
        setAsideLine(order),
        expiryLine(order),
      ];
    case "resting":
      return [
        m.trading_resting_notice(),
        setAsideLine(order),
        expiryLine(order),
      ];
    case "filled":
      return [fillLine(order.side, state.fill)];
    case "expired":
      return [
        m.trading_expired_notice({
          date: formatCalendarDate(order.tradingDay),
          time: formatMarketClock(order.expiresAt),
        }),
      ];
    case "rejected":
      return [
        m.trading_rejected_notice({
          time: formatMarketTime(state.rejectedAt),
          quotedTime: formatMarketTime(state.quotedAt),
        }),
        orderFailureText(state.failure),
      ];
    case "cancelled":
      return [
        m.trading_cancelled_notice({
          time: formatMarketTime(state.cancelledAt),
        }),
      ];
  }
}

function setAsideLine(order: Order): string {
  switch (order.side) {
    case "buy":
      return m.trading_purchase_sets_aside_notice({
        cash: formatRupiah(order.setAsideCash),
      });
    case "sell":
      return m.trading_sale_sets_aside_notice({
        shares: shareCount(order.shares),
        code: order.code,
      });
  }
}

function expiryLine(order: Order): string {
  return m.trading_expires_notice({ time: formatMarketClock(order.expiresAt) });
}

function fillLine(side: OrderSide, fill: Fill): string {
  const amounts = {
    price: formatRupiah(fill.price),
    time: formatMarketTime(fill.quotedAt),
    value: formatRupiah(fill.value),
    fee: formatRupiah(fill.fee),
  };
  switch (side) {
    case "buy":
      return m.trading_purchase_filled_notice({
        ...amounts,
        cost: formatRupiah(purchaseCost(fill)),
      });
    case "sell":
      return m.trading_sale_filled_notice({
        ...amounts,
        proceeds: formatRupiah(fill.cashChange),
        tax: formatRupiah(fill.tax),
      });
  }
}
