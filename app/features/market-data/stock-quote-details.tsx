import type { ReactNode } from "react";
import { formatMarketTime, formatRupiah } from "~/formatting";
import { NumberText } from "~/number-text";
import { m } from "~/paraglide/messages.js";
import type { StockQuote } from "./price-source.server";
import { sharedQuoteTime } from "./shared-quote-time";
import { SharedQuoteTimeNotice } from "./shared-quote-time-notice";
import styles from "./stock-page.module.css";

/** The time of the price of the stock, which the page states once. The weight of the position and the impact of a trade show beside them the times of the prices of the holdings that differ from it. */
export function StockQuoteDetails({
  quote,
  portfolioQuotes,
}: {
  quote: Pick<StockQuote, "quotedAt" | "previousClose"> | undefined;
  /** The prices of the holdings behind the values of the portfolio that the page shows, or none when it shows no such value. */
  portfolioQuotes: readonly { code: string; quotedAt: Date }[];
}): ReactNode {
  const sharedTime = stockPageTime(quote, portfolioQuotes);
  if (sharedTime === undefined) return null;
  return (
    <div className={styles["quoteDetails"]}>
      {quote === undefined ? (
        <SharedQuoteTimeNotice
          moment={sharedTime}
          className={styles["muted"]}
        />
      ) : (
        <p className={styles["muted"]}>
          <NumberText>
            {m.market_data_stock_quote_notice({
              time: formatMarketTime(quote.quotedAt),
              previous: formatRupiah(quote.previousClose),
            })}
          </NumberText>
        </p>
      )}
    </div>
  );
}

/** The time that the page of a stock states once: the time of the price of the stock, or of most prices of the holdings when the stock has none. */
export function stockPageTime(
  quote: Pick<StockQuote, "quotedAt"> | undefined,
  portfolioQuotes: readonly { code: string; quotedAt: Date }[],
): Date | undefined {
  return quote?.quotedAt ?? sharedQuoteTime(portfolioQuotes);
}
