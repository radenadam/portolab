import { QuoteNotice } from "~/features/market-data/quote-notice";
import { NumberText } from "~/number-text";
import type { ReactNode } from "react";
import { ChangeText } from "~/change-text";
import tableStyles from "~/data-table.module.css";
import {
  formatIndexLevel,
  formatMarketClock,
  formatMarketTime,
  formatMarketTimeParts,
  formatNumber,
  formatRupiah,
  formatSignedPercent,
} from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { isSameWibDay } from "./idx-calendar";
import { latestQuoteTime } from "./latest-quote-time";
import type { PriceSourceDescription, Quote } from "./price-source.server";
import styles from "./prices-view.module.css";
import { quoteChange } from "./quote-change";
import { noPricesText, quoteFailureText } from "./quote-failure-text";
import { StockName } from "./stock-name";
import { Link } from "react-router";
import type { ClassId } from "~/features/classes/classes.schema";
import type { LessonTask } from "~/features/learning/lesson-task";
import { withLessonTask } from "~/features/learning/lesson-task";
import { stockPath } from "./stock-path";
import type { UpdateAttempt } from "./update-attempts.server";

interface PricesViewProps {
  classId?: ClassId;
  task?: LessonTask | undefined;
  quotes: readonly Quote[];
  latestAttempt: UpdateAttempt | undefined;
  /** The moment that the page shows, which decides whether the next attempt is still to come. */
  now: Date;
  source: PriceSourceDescription;
}

/** The table of the latest delayed prices, with the delay and, when the latest attempt could not update some prices or all, which ones and when the job tries again. */
export function PricesView({
  quotes,
  latestAttempt,
  now,
  source,
  classId,
  task,
}: PricesViewProps): ReactNode {
  const latestQuotedAt = latestQuoteTime(quotes);
  const failure = quoteFailureText(latestAttempt, quotes, {
    now,
    delayMinutes: source.delayMinutes,
  });
  return (
    <>
      <h1>{m.market_data_page_title()}</h1>
      {latestQuotedAt === undefined ? (
        <p>
          <NumberText>
            {noPricesText(latestAttempt, {
              now,
              delayMinutes: source.delayMinutes,
            })}
          </NumberText>
        </p>
      ) : (
        <>
          <QuoteNotice text={failure} className={styles["notice"]} />
          <p className={styles["notice"]}>
            <NumberText>
              {m.market_data_delay_notice({
                minutes: formatNumber(source.delayMinutes),
                source: source.name,
                time: formatMarketTime(latestQuotedAt),
              })}
            </NumberText>
          </p>
          <table className={tableStyles["table"]}>
            <thead>
              <tr>
                <th scope="col">{m.market_data_stock_label()}</th>
                <th scope="col">{m.market_data_last_label()}</th>
                <th scope="col">{m.market_data_change_label()}</th>
                <th scope="col">{m.market_data_time_label()}</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((quote) => (
                <QuoteRow
                  key={quote.code}
                  quote={quote}
                  latestQuotedAt={latestQuotedAt}
                  classId={classId}
                  task={task}
                />
              ))}
            </tbody>
          </table>
        </>
      )}
    </>
  );
}

// Each row shows when it was quoted, because a price that the source stopped sending keeps its old time. A row from another day than the newest price shows its date too, so it stands out.
function QuoteRow({
  quote,
  latestQuotedAt,
  classId,
  task,
}: {
  quote: Quote;
  latestQuotedAt: Date;
  classId: ClassId | undefined;
  task: LessonTask | undefined;
}): ReactNode {
  return (
    <tr>
      <th scope="row" className={styles["stock"]}>
        {quote.kind === "stock" ? (
          classId === undefined || task === undefined ? (
            <StockName code={quote.code} withSector />
          ) : (
            <Link to={withLessonTask(stockPath(classId, quote.code), task)}>
              <StockName code={quote.code} withSector />
            </Link>
          )
        ) : (
          quote.code
        )}
      </th>
      <td className={tableStyles["number"]}>
        <NumberText>
          {quote.kind === "stock"
            ? formatRupiah(quote.price)
            : formatIndexLevel(quote.level)}
        </NumberText>
      </td>
      <td className={tableStyles["number"]}>
        <ChangeText change={formatSignedPercent(quoteChange(quote))} />
      </td>
      <td className={tableStyles["wrappingNumber"]}>
        <QuoteTime
          quotedAt={quote.quotedAt}
          isNewestDay={isSameWibDay(quote.quotedAt, latestQuotedAt)}
        />
      </td>
    </tr>
  );
}

// The date and the time come from the format of the notices, so a moment reads the same in the table and in the text above it.
function QuoteTime({
  quotedAt,
  isNewestDay,
}: {
  quotedAt: Date;
  isNewestDay: boolean;
}): ReactNode {
  if (isNewestDay) {
    return (
      <span className={styles["clock"]}>
        <NumberText>{formatMarketClock(quotedAt)}</NumberText>
      </span>
    );
  }
  const { date, clock } = formatMarketTimeParts(quotedAt);
  return (
    <>
      <span className={styles["date"]}>
        <NumberText>{date}</NumberText>
      </span>
      <span className={styles["clock"]}>
        <NumberText>{clock}</NumberText>
      </span>
    </>
  );
}
