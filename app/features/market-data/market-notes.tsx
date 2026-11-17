import type { ReactNode } from "react";
import { monthSpanInputs } from "~/features/measures/month-span";
import { formatMarketTime } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { NumberText } from "~/number-text";
import type { MarketRow } from "./filter-market-rows";
import type { IndexQuote } from "./price-source.server";
import type { readMarket } from "./read-market.server";
import styles from "./market-view.module.css";

/** The one line below the list, as the references draw it: the time that its prices share, the months from which its measures come, and what the ticks of the table mark. A stock takes only the months in which the index has a return too, and it can lack some of them, so the line states the months of the index as the most that a measure uses. */
export function MarketNotes({
  rows,
  sharedTime,
  indexQuote,
  reference,
  index,
  view = "list",
}: {
  rows: readonly MarketRow[];
  sharedTime: Date | undefined;
  indexQuote: IndexQuote | undefined;
  reference: ReturnType<typeof readMarket>["marketReference"];
  index: string;
  view?: "list" | "map";
}): ReactNode {
  const hasReferenceMarks =
    reference.ok &&
    rows.some(
      (row) =>
        row.measures !== undefined ||
        (row.quote !== undefined && indexQuote !== undefined),
    );
  if (sharedTime === undefined && !reference.ok) return null;
  return (
    <p className={styles["status"]}>
      {sharedTime !== undefined && (
        <span>
          <NumberText>
            {m.market_data_prices_time_notice({
              time: formatMarketTime(sharedTime),
            })}
          </NumberText>{" "}
        </span>
      )}
      {reference.ok && (
        <span>
          <NumberText>
            {m.market_data_measure_window_notice(
              monthSpanInputs(reference.value.months, "short"),
            )}
          </NumberText>{" "}
        </span>
      )}
      {hasReferenceMarks && view === "list" && (
        <span className={styles["tableReference"]}>
          {m.market_data_reference_marks_notice({ index })}
        </span>
      )}
    </p>
  );
}
