import type { ComponentProps, ReactNode } from "react";
import { BackLink } from "~/back-link";
import { withLessonTask } from "~/features/learning/lesson-task";
import { StarButton } from "~/features/watchlist/star-button";
import { NumberText } from "~/number-text";
import { ChangeChip } from "~/change-chip";
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
  trade,
}: {
  stock: ComponentProps<typeof StockPage>["loaderData"];
  returnTo: string;
  trade: ReactNode;
}): ReactNode {
  const { classId, code, quote, holding } = stock;
  return (
    <header className={styles["header"]}>
      <BackLink
        to={withLessonTask(stock.returnPath, stock.task)}
        label={stock.returnLabel}
      />
      {/* The star belongs to the code, and the sector and the place of the stock in the portfolio belong to its name, so they stand in the column of the name beside the tile, and the identity of the stock reads as one block. */}
      <div className={styles["identity"]}>
        <StockName
          code={code}
          heading
          codeAction={
            <StarButton
              classId={classId}
              code={code}
              watched={stock.watched}
              returnTo={returnTo}
            />
          }
          detail={
            <StockMetadata
              code={code}
              held={holding !== undefined}
              isLq45={stock.isLq45}
            />
          }
        />
        {trade}
      </div>
      {quote?.kind === "stock" && (
        <div className={styles["quote"]}>
          <strong className={styles["price"]}>
            <NumberText>{formatRupiah(quote.price)}</NumberText>
          </strong>
          <ChangeChip
            change={formatSignedRupiah(
              rupiah(quote.price - quote.previousClose),
            )}
          />
          <ChangeChip change={formatSignedPercent(quoteChange(quote))} />
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
