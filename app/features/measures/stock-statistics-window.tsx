import type { ReactNode } from "react";
import { NumberText } from "~/number-text";
import { m } from "~/paraglide/messages.js";
import type { StockSummary } from "./measure-summaries";
import { monthSpanInputs, monthSpanOf } from "./month-span";

/** Correlation can use fewer months, so the header names only the measures that share this window. */
export function StockStatisticsWindow({
  measures,
}: {
  measures: StockSummary;
}): ReactNode {
  return (
    <NumberText>
      {m.measures_stock_statistics_notice(
        monthSpanInputs(monthSpanOf(measures.returns), "short"),
      )}
    </NumberText>
  );
}
