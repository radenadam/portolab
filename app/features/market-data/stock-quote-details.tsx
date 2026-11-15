import type { ReactNode } from "react";
import { Link } from "react-router";
import { homeHoldingsSectionId } from "~/features/trading/home-holdings-section-id";
import { formatMarketTime, formatRupiah } from "~/formatting";
import { NumberText } from "~/number-text";
import { m } from "~/paraglide/messages.js";
import type { StockQuote } from "./price-source.server";
import styles from "./stock-page.module.css";

export function StockQuoteDetails({
  quote,
  hasPortfolioQuotes,
  portfolio,
}: {
  quote: Pick<StockQuote, "quotedAt" | "previousClose"> | undefined;
  hasPortfolioQuotes: boolean;
  portfolio: { path: string; title: string };
}): ReactNode {
  if (quote === undefined && !hasPortfolioQuotes) return null;
  return (
    <div className={styles["quoteDetails"]}>
      {quote !== undefined && (
        <p className={styles["muted"]}>
          <NumberText>
            {m.market_data_stock_quote_notice({
              time: formatMarketTime(quote.quotedAt),
              previous: formatRupiah(quote.previousClose),
            })}
          </NumberText>
        </p>
      )}
      {hasPortfolioQuotes && (
        <Link
          to={`${portfolio.path}#${homeHoldingsSectionId}`}
          className={styles["portfolioQuotes"]}
          aria-label={m.market_data_portfolio_quotes_link({
            page: portfolio.title,
          })}
        >
          {portfolio.title}
        </Link>
      )}
    </div>
  );
}
