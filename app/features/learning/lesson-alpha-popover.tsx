import type { ReactNode } from "react";
import { formatSignedPercent } from "~/formatting";
import type { AnalysisHolding } from "~/features/measures/analysis-holdings";
import { CalculationPart } from "~/features/measures/calculation-part";
import {
  HoldingRequiredReturnPart,
  holdingAlphaRow,
  holdingAlphaTitle,
} from "~/features/measures/holding-alpha-calculation";
import { m } from "~/paraglide/messages.js";
import { Popover } from "~/popover";
import styles from "./lesson-practice.module.css";

export function lessonAlphaPopoverId(code: string, idPrefix: string): string {
  return `${idPrefix}lesson-alpha-${code}`;
}

export function lessonAlphaLabel(holding: AnalysisHolding): string {
  return m.learning_alpha_calculation_label({
    code: holding.code,
    alpha: formatSignedPercent(holding.distance).text,
  });
}

/** The calculation of the alpha of one stock, with the return that CAPM requires of it, as the calculations of Analisis show them. */
export function LessonAlphaPopover({
  id,
  holding,
}: {
  id: string;
  holding: AnalysisHolding;
}): ReactNode {
  return (
    <Popover id={id} label={lessonAlphaLabel(holding)} placement="aboveStart">
      <div className={styles["calculation"]}>
        <CalculationPart
          title={holdingAlphaTitle(holding.code)}
          level={2}
          row={holdingAlphaRow(holding)}
        />
        <HoldingRequiredReturnPart holding={holding} />
      </div>
    </Popover>
  );
}
