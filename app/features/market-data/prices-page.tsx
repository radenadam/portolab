import type { ReactNode } from "react";
import { database } from "~/database/database.server";
import {
  formatIndexLevel,
  formatMarketTime,
  formatRupiah,
  formatSignedPercent,
} from "~/formatting";
import { m } from "~/paraglide/messages.js";
import type { Route } from "./+types/prices-page";
import { priceChange } from "./price-change";
import type { Quote } from "./price-source.server";
import styles from "./prices-page.module.css";
import { listLatestQuotes } from "./quote-store.server";

export function meta(): Route.MetaDescriptors {
  return [{ title: `${m.market_data_title()} | ${m.app_name()}` }];
}

export function loader(): { quotes: Quote[] } {
  return { quotes: listLatestQuotes(database()) };
}

export default function PricesPage({
  loaderData,
}: Route.ComponentProps): ReactNode {
  const { quotes } = loaderData;
  const latestQuotedAt = latestQuoteTime(quotes);
  return (
    <>
      <h1>{m.market_data_title()}</h1>
      {latestQuotedAt === undefined ? (
        <p>{m.market_data_empty_body()}</p>
      ) : (
        <>
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
              </tr>
            </thead>
            <tbody>
              {quotes.map((quote) => (
                <QuoteRow key={quote.code} quote={quote} />
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

function QuoteRow({ quote }: { quote: Quote }): ReactNode {
  const [last, previous] =
    quote.kind === "stock"
      ? [quote.price, quote.previousClose]
      : [quote.level, quote.previousLevel];
  const change = priceChange(last, previous);
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
