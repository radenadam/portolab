import { studentReasonsSectionId } from "./student-reasons-section-id";
import type { ReactNode } from "react";
import {
  formatCalendarDate,
  formatMarketTime,
  formatRupiah,
} from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { lotCount } from "./count-parts";
import type { Order, OrderSide } from "./order";
import type { StoredOrder } from "./order-rows";
import styles from "./trading.module.css";

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

export function ReasonSection({
  orders,
  studentName,
}: {
  orders: readonly StoredOrder[];
  studentName: string;
}): ReactNode {
  const reasoned: { order: StoredOrder; reason: string }[] = [];
  for (const order of orders.toReversed()) {
    if (order.reason !== undefined) {
      reasoned.push({ order, reason: order.reason });
    }
  }
  return (
    <section id={studentReasonsSectionId}>
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
