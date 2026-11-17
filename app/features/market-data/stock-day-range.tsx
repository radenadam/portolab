import type { ReactNode } from "react";
import { ConceptCard } from "~/concept-card";
import { ConceptLesson } from "~/features/learning/concept-lesson";
import { NumberText } from "~/number-text";
import styles from "~/stat-grid.module.css";
import { PriceRange } from "./price-range";
import rangeStyles from "./stock-range.module.css";
import type { readStockDayRange } from "./read-stock-day-range.server";

export function StockDayRange({
  text,
}: {
  text: ReturnType<typeof readStockDayRange>;
}): ReactNode {
  const range = text.range;
  return (
    <div className={styles["stat"]}>
      <dt>
        {text.label}
        <ConceptCard
          title={text.label}
          meaning={text.meaning}
          example={
            <p>
              <NumberText>
                {(textValue) =>
                  range === undefined
                    ? text.explanation
                    : text.explanation.replaceAll(range.time, () =>
                        textValue(<NumberText whole>{range.time}</NumberText>),
                      )
                }
              </NumberText>
            </p>
          }
          lesson={<ConceptLesson termId="harga-tertunda" />}
        />
      </dt>
      <dd className={rangeStyles["range"]}>
        {range === undefined ? (
          <span className={styles["note"]}>{text.explanation}</span>
        ) : (
          <PriceRange low={range.low} high={range.high} latest={range.latest} />
        )}
      </dd>
    </div>
  );
}
