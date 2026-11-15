import { activityFilters, activityStatusLabel } from "./activity-options";
import type { ReactNode } from "react";
import { Link } from "react-router";
import chipStyles from "~/chip.module.css";
import type { ClassId } from "~/features/classes/classes.schema";
import { StockName } from "~/features/market-data/stock-name";
import { stockPath } from "~/features/market-data/stock-path";
import { formatNumber, formatRupiah } from "~/formatting";
import { Message } from "~/message";
import { NumberText } from "~/number-text";
import { MarketTime } from "~/market-time";
import { m } from "~/paraglide/messages.js";
import { activityPath } from "./activity-path";
import { activityStatus } from "./activity-selection";
import type { ActivityFilter, ActivityStatus } from "./activity-selection";
import { lotCount } from "./count-parts";
import { isOpenOrder } from "./open-orders";
import type { StoredOrder } from "./order-rows";
import type { OrderSide } from "./order";
import { orderFailureText } from "./order-failure-text";
import styles from "./activity.module.css";
import { CancelOrder } from "./cancel-order";

const statusMarks: Record<ActivityStatus, string> = {
  waiting: "M9 3h6M9 21h6M9 3v4l6 10v4M15 3v4L9 17v4",
  filled: "M5 12l4 4L19 6",
  rejected: "M6 6l12 12M18 6 6 18",
  expired: "M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0",
  cancelled: "M6 6l12 12M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0",
};

const sideLabels: Record<OrderSide, () => string> = {
  buy: m.trading_buy_label,
  sell: m.trading_sell_label,
};

export function ActivityOrders({
  orders,
  now,
  classId,
  filter,
  readOnly = false,
  studentName,
  basePath,
}: {
  orders: readonly StoredOrder[];
  now: Date;
  classId: ClassId;
  filter: ActivityFilter;
  readOnly?: boolean;
  studentName?: string | undefined;
  basePath?: string;
}): ReactNode {
  const shown = orders
    .toReversed()
    .filter(
      (order) => filter === "all" || activityStatus(order, now) === filter,
    );
  return (
    <section
      className={styles["orderSection"]}
      aria-label={m.trading_activity_orders_label()}
    >
      {readOnly && (
        <h2 className={styles["journalTitle"]}>
          {m.trading_activity_orders_label()}
        </h2>
      )}
      <nav
        className={styles["filters"]}
        aria-label={m.trading_activity_status_label()}
      >
        {activityFilters.map((status) => (
          <Link
            key={status}
            to={`${basePath ?? activityPath(classId)}${basePath?.includes("?") === true ? "&" : "?"}status=${status}`}
            className={chipStyles["filter"]}
            aria-current={filter === status ? "page" : undefined}
          >
            <span>
              {activityStatusLabel(status)} ·{" "}
              <NumberText>
                {formatNumber(
                  orders.filter(
                    (order) =>
                      status === "all" || activityStatus(order, now) === status,
                  ).length,
                )}
              </NumberText>
            </span>
          </Link>
        ))}
      </nav>
      <div className={styles["panel"]}>
        {shown.length === 0 ? (
          <p className={styles["empty"]}>
            <NumberText verbatim>
              {orders.length === 0
                ? studentName === undefined
                  ? m.trading_activity_no_orders_body()
                  : m.trading_activity_student_no_orders_body({
                      name: studentName,
                    })
                : m.trading_activity_no_status_body()}
            </NumberText>
          </p>
        ) : (
          <ul className={styles["list"]} data-layout="rows">
            {shown.map((order) => (
              <li key={order.id} className={styles["order"]}>
                <div className={styles["orderHeader"]}>
                  <SideTag side={order.side} />
                  <Link
                    className={styles["stock"]}
                    to={stockPath(classId, order.code)}
                  >
                    <StockName
                      code={order.code}
                      withCompanyName={false}
                      codeDetail={
                        <NumberText>{lotCount(order.lots)}</NumberText>
                      }
                      detail={
                        <>
                          {order.price.kind === "market" ? (
                            m.trading_activity_market_label()
                          ) : (
                            <Message
                              text={m.trading_activity_limit_label}
                              values={{
                                price: (
                                  <NumberText>
                                    {formatRupiah(order.price.limit)}
                                  </NumberText>
                                ),
                              }}
                            />
                          )}
                          {" · "}
                          <Message
                            text={m.trading_activity_placed_notice}
                            values={{
                              time: <MarketTime moment={order.placedAt} />,
                            }}
                          />
                        </>
                      }
                    />
                  </Link>
                  <StatusChip status={activityStatus(order, now)} />
                </div>
                <div className={styles["orderBody"]}>
                  <p>{orderDetail(order, now, readOnly)}</p>
                  {order.reason !== undefined && (
                    <p className={styles["reason"]}>
                      <NumberText verbatim>
                        {m.trading_activity_reason_notice({
                          reason: order.reason,
                        })}
                      </NumberText>
                    </p>
                  )}
                  {!readOnly && order.state.kind === "rejected" && (
                    <Link
                      className={styles["button"]}
                      to={stockPath(classId, order.code)}
                    >
                      {m.trading_activity_ticket_link({ code: order.code })}
                    </Link>
                  )}
                  {!readOnly && isOpenOrder(order, now) && (
                    <CancelOrder
                      order={order}
                      side={sideLabels[order.side]()}
                    />
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export function SideTag({ side }: { side: StoredOrder["side"] }): ReactNode {
  return (
    <span className={styles["side"]} data-side={side}>
      {sideLabels[side]()}
    </span>
  );
}

function StatusChip({ status }: { status: ActivityStatus }): ReactNode {
  return (
    <span className={styles["status"]} data-status={status}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <path d={statusMarks[status]} />
      </svg>
      {activityStatusLabel(status)}
    </span>
  );
}

function orderDetail(
  order: StoredOrder,
  now: Date,
  readOnly: boolean,
): ReactNode {
  if (activityStatus(order, now) === "expired")
    return (
      <Message
        text={m.trading_activity_expired_notice}
        values={{ time: <MarketTime moment={order.expiresAt} /> }}
      />
    );
  switch (order.state.kind) {
    case "waiting":
    case "resting":
      return (
        <Message
          text={m.trading_activity_open_notice}
          values={{
            start: <MarketTime moment={order.tradesFrom} />,
            end: <MarketTime moment={order.expiresAt} />,
          }}
        />
      );
    case "filled":
      return (
        <Message
          text={m.trading_activity_fill_notice}
          values={{
            price: (
              <NumberText>{formatRupiah(order.state.fill.price)}</NumberText>
            ),
            time: <MarketTime moment={order.state.fill.quotedAt} />,
          }}
        />
      );
    case "cancelled":
      return (
        <Message
          text={m.trading_activity_cancelled_notice}
          values={{ time: <MarketTime moment={order.state.cancelledAt} /> }}
        />
      );
    case "rejected": {
      const reason = (
        <NumberText>{orderFailureText(order.state.failure)}</NumberText>
      );
      return (
        <Message
          text={m.trading_activity_rejection_notice}
          values={{
            time: <MarketTime moment={order.state.rejectedAt} />,
            quotedTime: <MarketTime moment={order.state.quotedAt} />,
            reason: readOnly ? <q>{reason}</q> : reason,
          }}
        />
      );
    }
    case "expired":
      return (
        <Message
          text={m.trading_activity_expired_notice}
          values={{ time: <MarketTime moment={order.expiresAt} /> }}
        />
      );
  }
}
