import { NumberText } from "~/number-text";
import type { ReactNode } from "react";
import { ConceptCard } from "~/concept-card";
import { ConceptLesson } from "~/features/learning/concept-lesson";
import styles from "~/stat-grid.module.css";
import { PriceRange } from "./price-range";
import rangeStyles from "./stock-range.module.css";
import type { readStockYearRange } from "./read-stock-year-range.server";

export function StockRange({
  text,
}: {
  text: ReturnType<typeof readStockYearRange>;
}): ReactNode {
  const range = text.range;
  return (
    <div className={styles["stat"]}>
      <dt>
        <NumberText>{text.label}</NumberText>
        {range !== undefined && (
          <ConceptCard
            title={text.label}
            meaning={text.meaning}
            example={
              <p>
                <NumberText>{range.example}</NumberText>
              </p>
            }
            calculation={
              <p>
                <NumberText>{range.calculation}</NumberText>
              </p>
            }
            lesson={<ConceptLesson termId="rentang-52-minggu" />}
          />
        )}
      </dt>
      <dd className={rangeStyles["range"]}>
        {range === undefined ? (
          <span className={styles["note"]}>{text.unavailable}</span>
        ) : (
          <PriceRange low={range.low} high={range.high} latest={range.latest} />
        )}
      </dd>
    </div>
  );
}
