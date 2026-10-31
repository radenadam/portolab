import type { ReactNode } from "react";
import {
  formatIndexLevel,
  formatList,
  formatMarketClock,
  formatMarketTime,
  formatNumber,
  formatRupiah,
  formatSignedPercent,
} from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { isSameWibDay } from "./idx-calendar";
import { priceDelayMinutes } from "./price-delay-minutes";
import type { Quote } from "./price-source.server";
import styles from "./prices-view.module.css";
import { quoteChange } from "./quote-change";
import type { UpdateAttempt } from "./quote-store.server";
import { nextScheduledAttempt } from "./update-schedule";

interface PricesViewProps {
  quotes: readonly Quote[];
  latestAttempt: UpdateAttempt | undefined;
  /** The moment that the page shows, which decides whether the next attempt is still to come. */
  now: Date;
}

/** The table of the latest delayed prices, with the delay and, when the latest attempt could not update some prices or all, which ones and when the job tries again. */
export function PricesView({
  quotes,
  latestAttempt,
  now,
}: PricesViewProps): ReactNode {
  const latestQuotedAt = latestQuoteTime(quotes);
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
                nextAttemptSentence(latestAttempt, now),
              ].join(" ")
            : m.market_data_empty_body()}
        </p>
      ) : (
        <>
          {latestAttempt !== undefined &&
            latestAttempt.failedCodes.length > 0 && (
              <p className={styles["notice"]}>
                {updateFailureNotice(latestAttempt, quotes, now)}
              </p>
            )}
          <p className={styles["notice"]}>
            {m.market_data_delay_notice({
              minutes: formatNumber(priceDelayMinutes),
              time: formatMarketTime(latestQuotedAt),
            })}
          </p>
          <table className={styles["table"]}>
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

// A price that the attempt could not update has a row with an older price, or no row when Portolab never stored one, and each case has its own sentence.
function updateFailureNotice(
  attempt: UpdateAttempt,
  quotes: readonly Quote[],
  now: Date,
): string {
  const time = formatMarketTime(attempt.attemptedAt);
  const staleCodes: string[] = [];
  const missingCodes: string[] = [];
  for (const code of attempt.failedCodes) {
    if (quotes.some((quote) => quote.code === code)) {
      staleCodes.push(code);
    } else {
      missingCodes.push(code);
    }
  }
  const sentences: string[] = [];
  if (!attempt.succeeded) {
    sentences.push(m.market_data_update_failed_notice({ time }));
  } else if (staleCodes.length > 0) {
    const codes = formatList(staleCodes);
    sentences.push(
      staleCodes.length === 1
        ? m.market_data_one_stale_price_notice({ codes, time })
        : m.market_data_several_stale_prices_notice({ codes, time }),
    );
  }
  if (missingCodes.length > 0) {
    const codes = formatList(missingCodes);
    sentences.push(
      missingCodes.length === 1
        ? m.market_data_one_missing_price_notice({ codes, time })
        : m.market_data_several_missing_prices_notice({ codes, time }),
    );
  }
  sentences.push(nextAttemptSentence(attempt, now));
  return sentences.join(" ");
}

// The time comes from the schedule that the job follows, so the page never promises an attempt that the job does not make. Once that time has come, the job is making the attempt, because the page shows the latest attempt that the job finished.
function nextAttemptSentence(attempt: UpdateAttempt, now: Date): string {
  const nextAttempt = nextScheduledAttempt(attempt);
  return nextAttempt <= now
    ? m.market_data_attempting_now_notice()
    : m.market_data_next_attempt_notice({
        nextTime: formatMarketTime(nextAttempt),
      });
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
  const change = quoteChange(quote);
  return (
    <tr>
      <th scope="row">{quote.code}</th>
      <td className={styles["number"]}>
        {quote.kind === "stock"
          ? formatRupiah(quote.price)
          : formatIndexLevel(quote.level)}
      </td>
      <td className={styles["number"]}>
        <ChangeArrow change={change} /> {formatSignedPercent(change)}
      </td>
      <td className={styles["number"]}>
        {isSameWibDay(quote.quotedAt, latestQuotedAt)
          ? formatMarketClock(quote.quotedAt)
          : formatMarketTime(quote.quotedAt)}
      </td>
    </tr>
  );
}

// The arrow repeats the sign of the change for sighted readers, so screen readers skip it.
function ChangeArrow({ change }: { change: number }): ReactNode {
  if (change === 0) {
    return null;
  }
  return <span aria-hidden="true">{change > 0 ? "▲" : "▼"}</span>;
}
