import type { ReactNode } from "react";
import {
  formatIndexLevel,
  formatMarketClock,
  formatMarketTime,
  formatRupiah,
  formatSignedPercent,
} from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { isSameWibDay } from "./idx-calendar";
import { quoteChange } from "./price-change";
import type { Quote } from "./price-source.server";
import styles from "./prices-view.module.css";
import type { UpdateAttempt } from "./quote-store.server";

interface PricesViewProps {
  quotes: readonly Quote[];
  latestAttempt: UpdateAttempt | undefined;
}

/** The table of the latest delayed prices, with the delay and, when the source failed, the time of the failure. */
export function PricesView({
  quotes,
  latestAttempt,
}: PricesViewProps): ReactNode {
  const latestQuotedAt = latestQuoteTime(quotes);
  return (
    <>
      <h1>{m.market_data_page_title()}</h1>
      {latestQuotedAt === undefined ? (
        <p>
          {latestAttempt?.succeeded === false
            ? m.market_data_empty_failed_body({
                time: formatMarketTime(latestAttempt.attemptedAt),
              })
            : m.market_data_empty_body()}
        </p>
      ) : (
        <>
          {latestAttempt?.succeeded === false && (
            <p className={styles["notice"]}>
              {m.market_data_update_failed_notice({
                time: formatMarketTime(latestAttempt.attemptedAt),
              })}
            </p>
          )}
          <p className={styles["notice"]}>
            {m.market_data_delay_notice({
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
