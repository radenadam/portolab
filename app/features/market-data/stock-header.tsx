import type { ComponentProps, ReactNode } from "react";
import { Link } from "react-router";
import { withLessonTask } from "~/features/learning/lesson-task";
import { StarButton } from "~/features/watchlist/star-button";
import { NumberText } from "~/number-text";
import { ChangeText } from "~/change-text";
import {
  formatRupiah,
  formatSignedPercent,
  formatSignedRupiah,
} from "~/formatting";
import { rupiah } from "~/units/rupiah";
import { StockQuoteDetails } from "./stock-quote-details";
import { QuoteNotice } from "./quote-notice";
import { hasStockPortfolioQuotes } from "./has-stock-portfolio-quotes";
import { quoteChange } from "./quote-change";
import { StockMetadata } from "./stock-metadata";
import { StockName } from "./stock-name";
import type StockPage from "./stock-page";
import styles from "./stock-page.module.css";

export function StockHeader({
  stock,
  returnTo,
}: {
  stock: ComponentProps<typeof StockPage>["loaderData"];
  returnTo: string;
}): ReactNode {
  const { classId, code, quote, holding } = stock;
  return (
    <header className={styles["header"]}>
      <div className={styles["identity"]}>
        <Link
          to={withLessonTask(stock.returnPath, stock.task)}
          className={styles["back"]}
          aria-label={stock.returnLabel}
        >
          ‹
        </Link>
        <StockName code={code} heading />
        <div className={styles["star"]}>
          <StarButton
            classId={classId}
            code={code}
            watched={stock.watched}
            returnTo={returnTo}
          />
        </div>
      </div>
      <p className={styles["muted"]}>
        <StockMetadata
          code={code}
          held={holding !== undefined}
          isLq45={stock.isLq45}
        />
      </p>
      {quote?.kind === "stock" && (
        <div className={styles["quote"]}>
          <strong className={styles["price"]}>
            <NumberText>{formatRupiah(quote.price)}</NumberText>
          </strong>
          <span className={styles["change"]}>
            <ChangeText
              colored
              change={formatSignedRupiah(
                rupiah(quote.price - quote.previousClose),
              )}
            />
          </span>
          <span className={styles["change"]}>
            <ChangeText
              colored
              change={formatSignedPercent(quoteChange(quote))}
            />
          </span>
        </div>
      )}
      <StockQuoteDetails
        quote={quote?.kind === "stock" ? quote : undefined}
        portfolioQuotes={
          hasStockPortfolioQuotes(stock) ? stock.portfolioQuotes : []
        }
      />
      <QuoteNotice text={stock.quoteNotice} className={styles["muted"]} />
    </header>
  );
}
