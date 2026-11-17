import type { ReactNode } from "react";
import { StockStatisticsWindow } from "~/features/measures/stock-statistics-window";
import { StockKeyMeasures } from "~/features/measures/stock-key-measures";
import { StockMeasuresView } from "~/features/measures/stock-measures-view";
import { MethodNotice } from "~/features/measures/method-notice";
import { m } from "~/paraglide/messages.js";
import type { Route } from "./+types/stock-page";
import { QuoteNotice } from "./quote-notice";
import { StockRange } from "./stock-range";
import { StockDayRange } from "./stock-day-range";
import styles from "./stock-page.module.css";

export function StockStatistics({
  stock,
}: {
  stock: Pick<
    Route.ComponentProps["loaderData"],
    | "classId"
    | "code"
    | "measures"
    | "correlation"
    | "range"
    | "dayRangeText"
    | "portfolioKind"
    | "portfolioNotice"
  >;
}): ReactNode {
  const { classId, code } = stock;
  return (
    <section className={styles["panel"]} aria-labelledby="statistics-title">
      <div className={styles["statisticsHeader"]}>
        <h2 id="statistics-title">{m.market_data_statistics_title()}</h2>
        {stock.measures.ok && (
          <span className={styles["muted"]}>
            <StockStatisticsWindow measures={stock.measures.value} />
          </span>
        )}
      </div>
      <StockKeyMeasures
        portfolioKind={stock.portfolioKind}
        classId={classId}
        code={code}
        measures={stock.measures}
        correlation={stock.correlation}
      >
        <StockDayRange text={stock.dayRangeText} />
        <StockRange text={stock.range} />
      </StockKeyMeasures>
      <QuoteNotice text={stock.portfolioNotice} className={styles["muted"]} />
      <details className={styles["calculations"]}>
        <summary>{m.market_data_all_calculations_label()}</summary>
        <MethodNotice />
        <StockMeasuresView
          code={code}
          measures={stock.measures}
          portfolioKind={stock.portfolioKind}
        />
      </details>
    </section>
  );
}
