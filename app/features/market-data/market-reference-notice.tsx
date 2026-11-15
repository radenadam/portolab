import type { ReactNode } from "react";
import { monthSpanInputs } from "~/features/measures/month-span";
import { m } from "~/paraglide/messages.js";
import { NumberText } from "~/number-text";
import type { MarketRow } from "./filter-market-rows";
import type { IndexQuote } from "./price-source.server";
import type { readMarket } from "./read-market.server";
import styles from "./market-view.module.css";

export function MarketReferenceNotice({
  rows,
  indexQuote,
  reference,
  index,
}: {
  rows: readonly MarketRow[];
  indexQuote: IndexQuote | undefined;
  reference: ReturnType<typeof readMarket>["marketReference"];
  index: string;
}): ReactNode {
  if (!reference.ok) return null;
  const hasReferenceMarks = rows.some(
    (row) =>
      row.measures !== undefined ||
      (row.quote !== undefined && indexQuote !== undefined),
  );
  return (
    <p className={styles["status"]}>
      {hasReferenceMarks && (
        <span className={styles["tableReference"]}>
          {m.market_data_reference_marks_notice({ index })}{" "}
        </span>
      )}
      <NumberText>
        {m.market_data_reference_notice({
          index,
          ...monthSpanInputs(reference.value.months),
        })}
      </NumberText>
    </p>
  );
}
