import { Message } from "~/message";
import type { ReactNode } from "react";
import { Form, Link, useLocation } from "react-router";
import type { ClassId } from "~/features/classes/classes.schema";
import { CompanyTile } from "~/features/market-data/stock-name";
import { stockPath } from "~/features/market-data/stock-path";
import { homeSummaryTimeField } from "./home-summary-time";
import { NumberText } from "~/number-text";
import { m } from "~/paraglide/messages.js";
import { activityStatus } from "./activity-selection";
import { lotCount } from "./count-parts";
import { orderSideLabel } from "./order-form-fields";
import { OrderOutcome, OrderStatusChip } from "./order-outcome";
import type { StoredOrder } from "./order-rows";
import styles from "./home-since-card.module.css";

export function HomeSinceCard({
  orders,
  now,
  classId,
  failure,
}: {
  orders: readonly StoredOrder[];
  now: Date;
  classId: ClassId;
  failure?: string | undefined;
}): ReactNode {
  const location = useLocation();
  if (orders.length === 0 && failure === undefined) return null;
  return (
    <section className={styles["card"]} aria-labelledby="home-since-title">
      {failure !== undefined && (
        <div className={styles["failure"]} role="alert">
          <p>
            <NumberText>{failure}</NumberText>
          </p>
          <Link
            className={styles["reload"]}
            reloadDocument
            to={location.pathname + location.search}
          >
            {m.trading_home_since_reload_link()}
          </Link>
        </div>
      )}
      <div className={styles["heading"]}>
        <h2 id="home-since-title">{m.trading_home_since_visit_title()}</h2>
        {orders.length > 0 && (
          <Form method="post">
            <input
              type="hidden"
              name={homeSummaryTimeField}
              value={now.toISOString()}
            />
            <button className={styles["close"]} type="submit">
              {m.trading_home_since_close_label()}
            </button>
          </Form>
        )}
      </div>
      <ul className={styles["list"]}>
        {orders.map((order) => (
          <li key={order.id} className={styles["item"]}>
            <div className={styles["trade"]}>
              <CompanyTile code={order.code} small />
              <strong>
                <Message
                  text={m.trading_home_since_trade_label}
                  values={{
                    side: orderSideLabel(order.side),
                    lots: <NumberText whole>{lotCount(order.lots)}</NumberText>,
                    code: <span className={styles["code"]}>{order.code}</span>,
                  }}
                />
              </strong>
              <OrderStatusChip status={activityStatus(order, now)} />
            </div>
            <div className={styles["outcome"]}>
              <OrderOutcome
                order={order}
                now={now}
                readOnly={false}
                portfolioKind="membership"
              />
              {order.state.kind === "rejected" && (
                <Link
                  className={styles["retry"]}
                  to={stockPath(classId, order.code, order.side)}
                >
                  {m.trading_activity_ticket_link({ code: order.code })}
                </Link>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
