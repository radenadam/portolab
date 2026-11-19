import type { ReactNode } from "react";
import { formatCorrelation, formatNumber, formatPercent } from "~/formatting";
import {
  Formula,
  MathNumber,
  Operand,
  Operator,
  SquareRoot,
  Squared,
  Variable,
} from "~/math-notation";
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
  const first = <MathNumber>{formatNumber(weight, 2)}</MathNumber>;
  const second = <MathNumber>{formatNumber(1 - weight, 2)}</MathNumber>;
  const firstRisk = (
    <MathNumber>{formatPercent(risks.first, "two")}</MathNumber>
  );
  const secondRisk = (
    <MathNumber>{formatPercent(risks.second, "two")}</MathNumber>
  );
  return (
    <>
      <p>
        <Formula
          left={<Variable name="σ" index="p" />}
          right={
            <SquareRoot>
              <Variable name="w" index="i" power={2} />
              <Variable name="σ" index="i" power={2} />
              <Operator symbol="+" />
              <Variable name="w" index="j" power={2} />
              <Variable name="σ" index="j" power={2} />
              <Operator symbol="+" />
              <MathNumber>2</MathNumber>
              <Variable name="w" index="i" />
              <Variable name="w" index="j" />
              <Variable name="ρ" index="ij" />
              <Variable name="σ" index="i" />
              <Variable name="σ" index="j" />
            </SquareRoot>
          }
          followingLines={[
            {
              operator: "=",
              expression: (
                <SquareRoot>
                  <Squared>{first}</Squared>
                  <Operator symbol="×" />
                  <Squared>{firstRisk}</Squared>
                  <Operator symbol="+" />
                  <Squared>{second}</Squared>
                  <Operator symbol="×" />
                  <Squared>{secondRisk}</Squared>
                  <Operator symbol="+" />
                  <MathNumber>2</MathNumber>
                  <Operator symbol="×" />
                  {first}
                  <Operator symbol="×" />
                  {second}
                  <Operand
                    value={correlation}
                    text={formatCorrelation(correlation)}
                    operator="×"
                  />
                  <Operator symbol="×" />
                  {firstRisk}
                  <Operator symbol="×" />
                  {secondRisk}
                </SquareRoot>
              ),
            },
          ]}
          scrolls
        />
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
