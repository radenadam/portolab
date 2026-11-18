import type { ReactNode } from "react";
import { Operand } from "~/features/measures/formulas";
import { formatCorrelation, formatNumber, formatPercent } from "~/formatting";
import { NumberText } from "~/number-text";
import { m } from "~/paraglide/messages.js";
import type { Correlation } from "~/units/correlation";
import type { MonthlyReturn } from "~/units/monthly-return";
import type { PortfolioWeight } from "~/units/portfolio-weight";

/** σₚ = √(w²ᵢσ²ᵢ + w²ⱼσ²ⱼ + 2wᵢwⱼρᵢⱼσᵢσⱼ), the risk of two stocks, which shows the correlation that the lesson changes. */
export function TwoStockFormula({
  weight,
  risks,
  correlation,
  result,
}: {
  weight: PortfolioWeight;
  risks: { first: MonthlyReturn; second: MonthlyReturn };
  correlation: Correlation;
  result: MonthlyReturn;
}): ReactNode {
  const first = formatNumber(weight, 2);
  const second = formatNumber(1 - weight, 2);
  const firstRisk = formatPercent(risks.first, "two");
  const secondRisk = formatPercent(risks.second, "two");
  return (
    <>
      <p>
        σ<sub>p</sub> = √(w²<sub>i</sub>σ²<sub>i</sub> + w²<sub>j</sub>σ²
        <sub>j</sub> + 2w<sub>i</sub>w<sub>j</sub>ρ<sub>ij</sub>σ<sub>i</sub>σ
        <sub>j</sub>)
        <br />= √(<NumberText whole>{first}</NumberText>² ×{" "}
        <NumberText whole>{firstRisk}</NumberText>² +{" "}
        <NumberText whole>{second}</NumberText>² ×{" "}
        <NumberText whole>{secondRisk}</NumberText>² + 2 ×{" "}
        <NumberText whole>{first}</NumberText> ×{" "}
        <NumberText whole>{second}</NumberText>{" "}
        <Operand
          value={correlation}
          text={formatCorrelation(correlation)}
          operator="×"
        />{" "}
        × <NumberText whole>{firstRisk}</NumberText> ×{" "}
        <NumberText whole>{secondRisk}</NumberText>)
      </p>
      <strong>
        <NumberText>
          {m.learning_monthly_result_notice({
            value: formatPercent(result, "three"),
          })}
        </NumberText>
      </strong>
    </>
  );
}
