import type { ActivityStatus } from "./activity-selection";
import { activityStatusLabel } from "./activity-options";
import styles from "./order-outcome.module.css";
import type { ReactNode } from "react";
import { Message } from "~/message";
import { NumberText } from "~/number-text";
import { MarketTime } from "~/market-time";
import { formatRupiah } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { activityStatus } from "./activity-selection";
import type { StoredOrder } from "./order-rows";
import { OrderRejection } from "./order-rejection";
import type { PortfolioKind } from "./portfolio-store.server";

export function OrderOutcome({
  order,
  now,
  readOnly,
  portfolioKind,
}: {
  order: StoredOrder;
  now: Date;
  readOnly: boolean;
  portfolioKind: PortfolioKind;
}): ReactNode {
  if (order.state.kind === "rejected")
    return (
      <OrderRejection
        rejection={order.state}
        readOnly={readOnly}
        portfolioKind={portfolioKind}
      />
    );
  return <p>{orderOutcome(order, now)}</p>;
}

function orderOutcome(order: StoredOrder, now: Date): ReactNode {
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
    case "expired":
      return (
        <Message
          text={m.trading_activity_expired_notice}
          values={{ time: <MarketTime moment={order.expiresAt} /> }}
        />
      );
    case "rejected":
      throw new Error("OrderOutcome explains a rejection on its own.");
  }
}

const statusMarks: Record<ActivityStatus, string> = {
  waiting: "M9 3h6M9 21h6M9 3v4l6 10v4M15 3v4L9 17v4",
  filled: "M5 12l4 4L19 6",
  rejected: "M6 6l12 12M18 6 6 18",
  expired: "M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0",
  cancelled: "M6 6l12 12M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0",
};

export function OrderStatusChip({
  status,
}: {
  status: ActivityStatus;
}): ReactNode {
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
