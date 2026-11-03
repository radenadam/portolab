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
import type { PriceSourceDescription, Quote } from "./price-source.server";
import styles from "./prices-view.module.css";
import { quoteChange } from "./quote-change";
import { nextAttemptSentence, quoteFailureText } from "./quote-failure-text";
import type { UpdateAttempt } from "./update-attempts.server";

interface PricesViewProps {
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
          {latestAttempt?.succeeded === false
            ? [
                m.market_data_empty_failed_body({
                  time: formatMarketTime(latestAttempt.attemptedAt),
                }),
                nextAttemptSentence(latestAttempt, now, source.delayMinutes),
              ].join(" ")
            : m.market_data_empty_body()}
        </p>
      ) : (
        <>
          {failure !== undefined && (
            <p className={styles["notice"]}>{failure}</p>
          )}
          <p className={styles["notice"]}>
            {m.market_data_delay_notice({
              minutes: formatNumber(source.delayMinutes),
              source: source.name,
              time: formatMarketTime(latestQuotedAt),
            })}
          </p>
          <table className={tableStyles["table"]}>
            <thead>
              <tr>
                <th scope="col">{m.market_data_code_label()}</th>
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
                />
              ))}
            </tbody>
          </table>
        </>
      )}
    </>
  );
}

function latestQuoteTime(quotes: readonly Quote[]): Date | undefined {
  let latest: Date | undefined;
  for (const quote of quotes) {
    if (latest === undefined || quote.quotedAt > latest) {
      latest = quote.quotedAt;
    }
  }
  return latest;
}

// Each row shows when it was quoted, because a price that the source stopped sending keeps its old time. A row from another day than the newest price shows its date too, so it stands out.
function QuoteRow({
  quote,
  latestQuotedAt,
}: {
  quote: Quote;
  latestQuotedAt: Date;
}): ReactNode {
  return (
    <tr>
      <th scope="row">{quote.code}</th>
      <td className={tableStyles["number"]}>
        {quote.kind === "stock"
          ? formatRupiah(quote.price)
          : formatIndexLevel(quote.level)}
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
      <span className={styles["clock"]}>{formatMarketClock(quotedAt)}</span>
    );
  }
  const { date, clock } = formatMarketTimeParts(quotedAt);
  return (
    <>
      <span className={styles["date"]}>{date}</span>
      <span className={styles["clock"]}>{clock}</span>
    </>
  );
}
