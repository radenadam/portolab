import { withLessonTask } from "~/features/learning/lesson-task";
import type { LessonTask } from "~/features/learning/lesson-task";
import { orderSideLabel } from "./order-form-fields";
import type { ReactNode } from "react";
import { useEffect, use } from "react";
import { Link } from "react-router";
import { CompanyTile } from "~/features/market-data/stock-name";
import { formatMarketTime, formatRupiah } from "~/formatting";
import { NumberText } from "~/number-text";
import { m } from "~/paraglide/messages.js";
import { lotCount } from "./count-parts";
import { isOpenOrder } from "./open-orders";
import type { Order } from "./order";
import styles from "./ticket.module.css";
import { TicketDraftContext } from "./ticket-draft-memory";
import { TicketSchedule } from "./ticket-schedule";
import { Message } from "~/message";
import { rupiah } from "~/units/rupiah";
import type { Rupiah } from "~/units/rupiah";
import { SideTag } from "./side-tag";

export function TicketDone({
  order,
  now,
  closePath,
  task,
  activity,
  available,
}: {
  order: Order;
  now: Date;
  closePath: string;
  task?: LessonTask | undefined;
  activity: string;
  /** The cash that the portfolio has now, apart from what its open orders set aside. */
  available: Rupiah;
}): ReactNode {
  const memory = use(TicketDraftContext);
  useEffect(() => {
    memory?.delete(order.side);
  }, [memory, order.side]);
  const filled = order.state.kind === "filled";
  const side = orderSideLabel(order.side);
  return (
    <div className={styles["done"]} role="status" data-side={order.side}>
      <span className={styles["successMark"]} aria-hidden="true">
        {filled ? "✓" : "◷"}
      </span>
      <div className={styles["doneTitle"]}>
        <SideTag side={order.side} />
        <CompanyTile code={order.code} small />
        <h3>
          {filled
            ? m.trading_ticket_filled_title()
            : isOpenOrder(order, now)
              ? m.trading_ticket_waiting_title()
              : m.trading_ticket_ended_title()}
        </h3>
      </div>
      <p>
        <NumberText>
          {m.trading_ticket_done_notice({
            side,
            lots: lotCount(order.lots),
            code: order.code,
          })}
        </NumberText>
      </p>
      {order.state.kind === "filled" ? (
        <p>
          <Message
            text={m.trading_ticket_fill_notice}
            values={{
              price: (
                <NumberText whole>
                  {formatRupiah(order.state.fill.price)}
                </NumberText>
              ),
              time: (
                <NumberText whole>
                  {formatMarketTime(order.state.fill.quotedAt)}
                </NumberText>
              ),
            }}
          />
        </p>
      ) : (
        isOpenOrder(order, now) && (
          <p>
            <TicketSchedule {...order} />
          </p>
        )
      )}
      <dl className={styles["breakdown"]}>
        {order.state.kind === "filled" && (
          <>
            <dt>
              {order.side === "buy"
                ? m.trading_ticket_paid_label()
                : m.trading_ticket_received_label()}
            </dt>
            <dd>
              <NumberText>
                {formatRupiah(rupiah(Math.abs(order.state.fill.cashChange)))}
              </NumberText>
            </dd>
          </>
        )}
        <dt>{m.trading_ticket_available_label()}</dt>
        <dd>
          <NumberText>{formatRupiah(available)}</NumberText>
        </dd>
      </dl>
      {order.state.kind === "filled" && order.reason !== undefined && (
        <p className={styles["doneReason"]}>
          <NumberText verbatim>
            {m.trading_ticket_reason_notice({ reason: order.reason })}
          </NumberText>
        </p>
      )}
      <div className={styles["doneActions"]}>
        <Link
          className={styles["primaryLink"]}
          to={withLessonTask(activity, task)}
        >
          {m.trading_ticket_activity_link()}
        </Link>
        <Link className={styles["fix"]} to={closePath} preventScrollReset>
          {m.trading_ticket_close_link()}
        </Link>
      </div>
    </div>
  );
}
