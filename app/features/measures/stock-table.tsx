import type { ReactNode } from "react";
import type { ClassId } from "~/features/classes/classes.schema";
import { marketIndex } from "~/features/market-data/tracked-instruments";
import { formatBeta, formatPercent } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { shortMeasureFailureText } from "./measure-failure-text";
import { MeasureTable, StockLink } from "./measure-table";
import type { StockRow } from "./read-measures.server";

/** The expected return, the standard deviation, and the beta of each stock, or in short why a stock has none, each stock with a link to its page, which shows every formula and every input, or the whole reason. */
export function StockTable({
  classId,
  stocks,
}: {
  classId: ClassId;
  stocks: readonly StockRow[];
}): ReactNode {
  return (
    <MeasureTable
      header={[
        m.measures_stock_label(),
        m.measures_expected_return_label(),
        m.measures_standard_deviation_label(),
        m.measures_beta_label({ index: marketIndex.code }),
      ]}
      rows={stocks.map(({ code, measures }) => ({
        key: code,
        name: <StockLink classId={classId} code={code} />,
        cells: measures.ok
          ? {
              kind: "numbers",
              values: [
                formatPercent(measures.value.expectedReturn, "two"),
                formatPercent(measures.value.standardDeviation, "two"),
                formatBeta(measures.value.beta),
              ],
            }
          : { kind: "note", text: shortMeasureFailureText(measures.failure) },
      }))}
    />
  );
}
