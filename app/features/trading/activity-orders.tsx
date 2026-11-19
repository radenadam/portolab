import { MarketTime } from "~/market-time";
import { OrderOutcome, OrderStatusChip } from "./order-outcome";
import { withLessonTask } from "~/features/learning/lesson-task";
import type { LessonTask } from "~/features/learning/lesson-task";
import { activityFilters, activityStatusLabel } from "./activity-options";
import type { ReactNode } from "react";
import { Link } from "react-router";
import chipStyles from "~/chip.module.css";
import type { ClassId } from "~/features/classes/classes.schema";
import { StockName } from "~/features/market-data/stock-name";
import { stockPath } from "~/features/market-data/stock-path";
import { StockPageLink } from "~/features/market-data/stock-page-link";
import { formatNumber, formatRupiah } from "~/formatting";
import { Message } from "~/message";
import { NumberText } from "~/number-text";
import { m } from "~/paraglide/messages.js";
import { activityPath } from "./activity-path";
import { activityStatus } from "./activity-selection";
import type { ActivityFilter } from "./activity-selection";
import { lotCount } from "./count-parts";
import { isOpenOrder } from "./open-orders";
import type { StoredOrder } from "./order-rows";
import styles from "./activity.module.css";
import { SideTag } from "./side-tag";
import { orderSideLabel } from "./order-form-fields";
import { CancelOrder } from "./cancel-order";
import type { PortfolioKind } from "./portfolio-store.server";
import type { JournalTrade } from "./trade-journal";
import { TradePerformance, tradePerformanceScale } from "./trade-performance";
import type { PricesOfView } from "~/features/market-data/read-prices.server";
import { SharedQuoteTimeNotice } from "~/features/market-data/shared-quote-time-notice";

export function ActivityOrders({
  orders,
  now,
  classId,
  filter,
  task,
  readOnly = false,
  studentName,
  basePath,
  portfolioKind = "membership",
  trades,
  prices,
}: {
  trades: readonly JournalTrade[];
  prices: Pick<PricesOfView, "now" | "source" | "latestAttempt">;
  orders: readonly StoredOrder[];
  now: Date;
  classId: ClassId;
  filter: ActivityFilter;
  task?: LessonTask | undefined;
  readOnly?: boolean;
  studentName?: string | undefined;
  basePath?: string;
  portfolioKind?: PortfolioKind | undefined;
}): ReactNode {
  const tradeOf = new Map(trades.map((trade) => [trade.order.id, trade]));
  const scale = tradePerformanceScale(trades);
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
            to={withLessonTask(
              `${basePath ?? activityPath(classId)}${basePath?.includes("?") === true ? "&" : "?"}status=${status}`,
              task,
            )}
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
            {shown.map((order) => {
              const trade = tradeOf.get(order.id);
              return (
                <li key={order.id} className={styles["order"]}>
                  <div className={styles["orderHeader"]}>
                    <SideTag side={order.side} />
                    <StockPageLink
                      classId={classId}
                      code={order.code}
                      id={`order-${String(order.id)}`}
                      keepReturn={readOnly}
                      className={styles["stock"]}
                      task={task}
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
                    </StockPageLink>
                    <OrderStatusChip status={activityStatus(order, now)} />
                  </div>
                  <div className={styles["orderBody"]}>
                    <OrderOutcome
                      order={order}
                      now={now}
                      readOnly={readOnly}
                      portfolioKind={portfolioKind}
                    />
                    {trade !== undefined && (
                      <TradePerformance
                        trade={trade}
                        prices={prices}
                        maximum={scale.maximum}
                        sharedTime={scale.sharedTime}
                      />
                    )}
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
                        to={withLessonTask(
                          stockPath(classId, order.code, order.side),
                          task,
                        )}
                      >
                        {m.trading_activity_ticket_link({ code: order.code })}
                      </Link>
                    )}
                    {!readOnly && isOpenOrder(order, now) && (
                      <CancelOrder
                        order={order}
                        side={orderSideLabel(order.side)}
                      />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {scale.sharedTime !== undefined && (
          <SharedQuoteTimeNotice
            moment={scale.sharedTime}
            className={styles["journalNote"]}
          />
        )}
      </div>
    </section>
  );
}
