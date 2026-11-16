import type { ReactNode } from "react";
import { ChangeText } from "~/change-text";
import { formatSignedPercent } from "~/formatting";
import type { AnalysisHolding } from "~/features/measures/analysis-holdings";
import { PopoverButton } from "~/popover";
import { percentOf } from "~/charts/plot";
import { plotFraction } from "~/units/plot-fraction";
import styles from "./lesson-practice.module.css";
import {
  LessonAlphaPopover,
  lessonAlphaPopoverId,
  lessonAlphaLabel,
} from "./lesson-alpha-popover";

export function LessonAlpha({
  holdings,
  idPrefix = "",
}: {
  holdings: readonly AnalysisHolding[];
  idPrefix?: string;
}): ReactNode {
  const rows = holdings.toSorted(
    (first, second) => first.distance - second.distance,
  );
  const limit = Math.max(
    ...rows.map((row) => Math.abs(row.distance)),
    Number.EPSILON,
  );
  return (
    <div>
      {rows.map((holding) => {
        const change = formatSignedPercent(holding.distance);
        const id = lessonAlphaPopoverId(holding.code, idPrefix);
        return (
          <div key={holding.code}>
            <PopoverButton
              popover={id}
              className={styles["pair"]}
              label={lessonAlphaLabel(holding)}
            >
              <span className={styles["code"]}>{holding.code}</span>
              <span className={styles["alphaBar"]} aria-hidden="true">
                <i
                  data-change={change.direction}
                  style={{
                    left: percentOf(
                      plotFraction(
                        Math.min(0.5, 0.5 + holding.distance / (2 * limit)),
                      ),
                    ),
                    width: percentOf(
                      plotFraction(Math.abs(holding.distance) / (2 * limit)),
                    ),
                  }}
                />
              </span>
              <ChangeText colored change={change} />
            </PopoverButton>
            <LessonAlphaPopover id={id} holding={holding} />
          </div>
        );
      })}
    </div>
  );
}
