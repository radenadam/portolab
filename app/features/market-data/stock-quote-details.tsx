import type { ReactNode } from "react";
import { Link } from "react-router";
import type { ClassId } from "~/features/classes/classes.schema";
import { classPath } from "~/features/classes/class-path";
import { homeTitle } from "~/features/trading/home-title";
import { homeHoldingsSectionId } from "~/features/trading/home-holdings-section-id";
import { formatMarketTime, formatRupiah } from "~/formatting";
import { NumberText } from "~/number-text";
import { m } from "~/paraglide/messages.js";
import type { StockQuote } from "./price-source.server";
import styles from "./stock-page.module.css";

export function StockQuoteDetails({
  classId,
  quote,
  hasPortfolioQuotes,
}: {
  classId: ClassId;
  quote: Pick<StockQuote, "quotedAt" | "previousClose"> | undefined;
  hasPortfolioQuotes: boolean;
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
          to={`${classPath(classId)}#${homeHoldingsSectionId}`}
          className={styles["portfolioQuotes"]}
          aria-label={m.market_data_portfolio_quotes_link({
            page: homeTitle(),
          })}
        >
          {homeTitle()}
        </Link>
      )}
    </div>
  );
}
