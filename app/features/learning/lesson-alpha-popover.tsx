import type { ReactNode } from "react";
import { ChangeText } from "~/change-text";
import { formatSignedPercent } from "~/formatting";
import type { AnalysisHolding } from "~/features/measures/analysis-holdings";
import {
  MarketLineFormula,
  RequiredReturnFormula,
} from "~/features/measures/capm-formulas";
import { measureSecurityMarketLineDistance } from "~/features/measures/capm";
import { NumberText } from "~/number-text";
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
        <h2>{holding.code}</h2>
        <p>
          <MarketLineFormula
            of="i"
            distance={measureSecurityMarketLineDistance(
              holding.expectedReturn,
              holding.requiredReturn,
            )}
          />
        </p>
        <strong>
          <ChangeText colored change={formatSignedPercent(holding.distance)} />
        </strong>
        <p>
          <RequiredReturnFormula of="i" required={holding.requiredReturn} />
        </p>
        <p>
          <NumberText>
            {m.learning_monthly_result_notice({
              value: formatSignedPercent(holding.requiredReturn.value).text,
            })}
          </NumberText>
        </p>
      </div>
    </Popover>
  );
}
