import type { ReactNode } from "react";
import { Link } from "react-router";
import type { ClassId } from "~/features/classes/classes.schema";
import { stockPath } from "~/features/market-data/stock-path";
import { orderFailureText } from "~/features/trading/order-failure-text";
import { lotCount } from "~/features/trading/count-parts";
import {
  formatRupiah,
  formatMarketTime,
  formatCalendarDate,
} from "~/formatting";
import { NumberText } from "~/number-text";
import { m } from "~/paraglide/messages.js";
import { rupiah } from "~/units/rupiah";
import { pathWithQuery } from "~/path-with-query";
import { PracticePanel } from "./practice-panel";
import type { TradingLessonData } from "./trading-lesson-data";
import styles from "./lesson-practice.module.css";
export function TradingOwnNumbers({
  trading,
}: {
  trading: Pick<TradingLessonData, "last">;
}): ReactNode {
  return (
    <section
      className={styles["yours"]}
      data-learning-last-trade={trading.last === undefined ? undefined : ""}
    >
      <strong>{m.learning_your_numbers_label()}</strong>
      {trading.last === undefined ? (
        <p>{m.learning_no_filled_order_notice()}</p>
      ) : (
        <>
          <p>
            <NumberText>{filledTradeText(trading.last)}</NumberText>
          </p>
          <p className={styles["provenance"]}>
            <NumberText whole>
              {formatMarketTime(trading.last.fill.quotedAt)}
            </NumberText>
          </p>
        </>
      )}
    </section>
  );
}
export function TradingLessonPractice({
  classId,
  trading,
  date,
  idPrefix,
  taskPage,
}: {
  classId: ClassId;
  trading: TradingLessonData;
  date: string;
  idPrefix: string;
  taskPage: string | undefined;
}): ReactNode {
  return (
    <PracticePanel idPrefix={idPrefix}>
      {trading.quote !== undefined && (
        <p>
          <NumberText>
            {m.learning_trade_price_notice({
              code: trading.quote.code,
              price: formatRupiah(trading.quote.price),
              time: formatMarketTime(trading.quote.quotedAt),
            })}
          </NumberText>
        </p>
      )}
      {trading.quoteNotice !== undefined && (
        <p>
          <NumberText>{trading.quoteNotice}</NumberText>
        </p>
      )}
      {trading.range?.ok === true && (
        <p>
          <NumberText>
            {m.learning_trade_band_notice({
              date: formatCalendarDate(date),
              lowest: formatRupiah(trading.range.value.lowest),
              highest: formatRupiah(trading.range.value.highest),
              reference: formatRupiah(trading.range.value.reference),
            })}
          </NumberText>
        </p>
      )}
      {trading.range?.ok === false && (
        <p>
          <NumberText>
            {orderFailureText(trading.range.failure, trading.portfolioKind)}
          </NumberText>
        </p>
      )}
      <div className={styles["task"]}>
        <p>
          <strong>{m.learning_task_label()}</strong>{" "}
          {trading.range?.ok === true
            ? m.learning_limit_task_notice()
            : m.learning_limit_data_task_notice()}
        </p>
        {trading.code !== undefined && (
          <Link
            className={styles["button"]}
            to={
              taskPage ??
              pathWithQuery(`${stockPath(classId, trading.code)}/buy`, {
                priceKind: "limit",
                lessonTask: "6",
              })
            }
          >
            {taskPage === undefined
              ? m.learning_open_limit_link({ code: trading.code })
              : m.learning_open_practice_link()}
          </Link>
        )}
      </div>
    </PracticePanel>
  );
}

function filledTradeText(last: NonNullable<TradingLessonData["last"]>): string {
  const values = {
    lots: lotCount(last.lots),
    code: last.code,
    price: formatRupiah(last.fill.price),
    value: formatRupiah(last.fill.value),
    fee: formatRupiah(last.fill.fee),
    tax: formatRupiah(last.fill.tax),
    total: formatRupiah(rupiah(Math.abs(last.fill.cashChange))),
  };
  switch (last.side) {
    case "buy":
      return m.learning_last_purchase_notice(values);
    case "sell":
      return m.learning_last_sale_notice(values);
  }
}
