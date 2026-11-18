import type { ReactNode } from "react";
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
import { withLessonTask } from "./lesson-task";
import { LessonTaskLink } from "./lesson-task-link";
import type { TradingLessonData } from "./trading-lesson-data";
import styles from "./lesson-practice.module.css";
export function TradingOwnNumbers({
  trading,
}: {
  trading: Pick<TradingLessonData, "last">;
}): ReactNode {
  const last = trading.last;
  return (
    <section
      className={styles["yours"]}
      aria-label={m.learning_your_numbers_label()}
      data-learning-last-trade={last === undefined ? undefined : ""}
    >
      <strong>{m.learning_your_numbers_label()}</strong>
      {last === undefined ? (
        <p>{m.learning_no_filled_order_notice()}</p>
      ) : (
        <>
          <p>
            <NumberText>
              {(textValue) =>
                filledTradeText(
                  last,
                  textValue(
                    <strong>
                      <NumberText whole>
                        {formatRupiah(rupiah(Math.abs(last.fill.cashChange)))}
                      </NumberText>
                    </strong>,
                  ),
                )
              }
            </NumberText>
          </p>
          <p className={styles["provenance"]}>
            <NumberText whole>
              {formatMarketTime(last.fill.quotedAt)}
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
          <LessonTaskLink
            to={withLessonTask(
              pathWithQuery(`${stockPath(classId, trading.code)}/buy`, {
                priceKind: "limit",
              }),
              6,
            )}
            label={m.learning_open_limit_link({ code: trading.code })}
            taskPage={taskPage}
          />
        )}
      </div>
    </PracticePanel>
  );
}

function filledTradeText(
  last: NonNullable<TradingLessonData["last"]>,
  total: string,
): string {
  const values = {
    lots: lotCount(last.lots),
    code: last.code,
    price: formatRupiah(last.fill.price),
    value: formatRupiah(last.fill.value),
    fee: formatRupiah(last.fill.fee),
    tax: formatRupiah(last.fill.tax),
    total,
  };
  switch (last.side) {
    case "buy":
      return m.learning_last_purchase_notice(values);
    case "sell":
      return m.learning_last_sale_notice(values);
  }
}
