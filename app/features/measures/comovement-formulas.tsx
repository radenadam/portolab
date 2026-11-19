import type { ReactNode } from "react";
import { formatPercent, formatVariance } from "~/formatting";
import {
  Formula,
  Fraction,
  MathNumber,
  Operator,
  Variable,
} from "~/math-notation";
import type { StockMeasures } from "./capm";
import type { Subject } from "./formulas";
import type { CorrelationMeasure } from "./return-statistics";

// The formulas of how the returns of two instruments move together, a correlation and a beta, with the covariance that both divide. Decision 0020 explains why a formula is notation, and decision 0070 explains why it is MathML.

/** ρᵢₘ = σᵢₘ / (σᵢ σₘ), with the covariance and the standard deviations. */
export function CorrelationFormula({
  first,
  second,
  correlation,
}: {
  first: Subject;
  second: Subject;
  correlation: CorrelationMeasure | undefined;
}): ReactNode {
  const pair = `${first}${second}`;
  const inputs = correlation?.inputs;
  return (
    <Formula
      left={<Variable name="ρ" index={pair} />}
      right={
        <Fraction
          numerator={<Variable name="σ" index={pair} />}
          denominator={
            <>
              <Variable name="σ" index={first} />
              <Variable name="σ" index={second} />
            </>
          }
        />
      }
      followingLines={
        inputs === undefined
          ? []
          : [
              {
                operator: "=",
                expression: (
                  <Fraction
                    numerator={
                      <MathNumber>
                        {formatVariance(inputs.covariance)}
                      </MathNumber>
                    }
                    denominator={
                      <>
                        <MathNumber>
                          {formatPercent(inputs.firstStandardDeviation, "two")}
                        </MathNumber>
                        <Operator symbol="×" />
                        <MathNumber>
                          {formatPercent(inputs.secondStandardDeviation, "two")}
                        </MathNumber>
                      </>
                    }
                  />
                ),
              },
            ]
      }
      spreadsheetFunction="CORREL"
    />
  );
}

/** βᵢ = σᵢₘ / σ²ₘ, with the covariance and the variance of the market. */
export function BetaFormula({
  beta,
}: {
  beta: StockMeasures["beta"] | undefined;
}): ReactNode {
  return (
    <Formula
      left={<Variable name="β" index="i" />}
      right={
        <Fraction
          numerator={<Variable name="σ" index="iM" />}
          denominator={<Variable name="σ" index="M" power={2} />}
        />
      }
      followingLines={
        beta === undefined
          ? []
          : [
              {
                operator: "=",
                expression: (
                  <Fraction
                    numerator={
                      <MathNumber>
                        {formatVariance(beta.inputs.covarianceWithMarket)}
                      </MathNumber>
                    }
                    denominator={
                      <MathNumber>
                        {formatVariance(beta.inputs.marketVariance)}
                      </MathNumber>
                    }
                  />
                ),
              },
            ]
      }
      spreadsheetFunction="SLOPE"
    />
  );
}
