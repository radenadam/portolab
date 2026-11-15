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
import { Popover, PopoverButton } from "~/popover";
import { percentOf } from "~/charts/plot";
import { plotFraction } from "~/units/plot-fraction";
import styles from "./lesson-practice.module.css";

export function LessonAlpha({
  holdings,
}: {
  holdings: readonly AnalysisHolding[];
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
        const id = `lesson-alpha-${holding.code}`;
        return (
          <div key={holding.code}>
            <PopoverButton
              popover={id}
              className={styles["pair"]}
              label={m.learning_alpha_calculation_label({
                code: holding.code,
                alpha: change.text,
              })}
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
            <Popover
              id={id}
              label={m.learning_alpha_calculation_label({
                code: holding.code,
                alpha: change.text,
              })}
              placement="aboveStart"
            >
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
                  <ChangeText colored change={change} />
                </strong>
                <p>
                  <RequiredReturnFormula
                    of="i"
                    required={holding.requiredReturn}
                  />
                </p>
                <p>
                  <NumberText>
                    {m.learning_monthly_result_notice({
                      value: formatSignedPercent(holding.requiredReturn.value)
                        .text,
                    })}
                  </NumberText>
                </p>
              </div>
            </Popover>
          </div>
        );
      })}
    </div>
  );
}
