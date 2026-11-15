import type { ReactNode } from "react";
import { formatList } from "~/formatting";
import { NumberText } from "~/number-text";
import { m } from "~/paraglide/messages.js";
import type { MarketRow } from "./filter-market-rows";
import styles from "./market-view.module.css";

export const marketMeasureNotesId = "market-measure-notes";

export function MarketMeasureNotes({
  rows,
}: {
  rows: readonly MarketRow[];
}): ReactNode {
  const groups = new Map<string, string[]>();
  for (const row of rows) {
    if (row.measureFailure === undefined) continue;
    const codes = groups.get(row.measureFailure) ?? [];
    codes.push(row.code);
    groups.set(row.measureFailure, codes);
  }
  if (groups.size === 0) return null;
  return (
    <details className={styles["measureNotes"]}>
      <summary id={marketMeasureNotesId}>
        {m.market_data_unavailable_measures_label()}
      </summary>
      <dl>
        {[...groups].map(([failure, codes]) => (
          <div key={failure}>
            <dt>{formatList(codes, "conjunction")}</dt>
            <dd>
              <NumberText>{failure}</NumberText>
            </dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
