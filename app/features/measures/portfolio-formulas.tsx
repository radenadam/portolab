import type { ReactNode } from "react";
import { formatPercent, formatVariance } from "~/formatting";
import {
  Formula,
  Fraction,
  MathNumber,
  Operator,
  Sum,
  Variable,
} from "~/math-notation";
import type { MonthlyVariance } from "~/units/monthly-variance";
import type { PortfolioWeight } from "~/units/portfolio-weight";
import { ExpectedReturn } from "./formulas";

// Decision 0020 explains why a formula is notation and not a message, and what each symbol and subscript stands for. Decision 0070 explains why it is MathML.

/** E(Rₚ) = Σ wᵢ E(Rᵢ) or βₚ = Σ wᵢ βᵢ, the sum of the measures of the stocks of a portfolio, each times its weight. */
export function WeightedSumFormula({
  measure,
}: {
  measure: "expectedReturn" | "beta";
}): ReactNode {
  const sides: Record<typeof measure, { left: ReactNode; term: ReactNode }> = {
    expectedReturn: {
      left: <ExpectedReturn of="p" />,
      term: <ExpectedReturn of="i" />,
    },
    beta: {
      left: <Variable name="β" index="p" />,
      term: <Variable name="β" index="i" />,
    },
  };
  return (
    <Formula
      left={sides[measure].left}
      right={
        <>
          <Sum />
          <Variable name="w" index="i" />
          {sides[measure].term}
        </>
      }
      spreadsheetFunction="SUMPRODUCT"
    />
  );
}

/** σ²ₚ = Σᵢ Σⱼ wᵢ wⱼ σᵢⱼ, the weights times the covariance matrix times the weights, with the variance that it gives when a lesson shows it. */
export function PortfolioVarianceFormula({
  variance,
}: {
  variance?: MonthlyVariance | undefined;
}): ReactNode {
  return (
    <Formula
      left={<Variable name="σ" index="p" power={2} />}
      right={
        <>
          <Sum over="i" />
          <Sum over="j" />
          <Variable name="w" index="i" />
          <Variable name="w" index="j" />
          <Variable name="σ" index="ij" />
        </>
      }
      followingLines={
        variance === undefined
          ? []
          : [
              {
                operator: "=",
                expression: <MathNumber>{formatVariance(variance)}</MathNumber>,
              },
            ]
      }
      spreadsheetFunction="MMULT"
    />
  );
}

/** σᵢₚ = Σⱼ wⱼ σᵢⱼ, the covariance of a stock with its portfolio from the weights and the covariances of the stocks. */
export function CovarianceWithPortfolioFormula(): ReactNode {
  return (
    <Formula
      left={<Variable name="σ" index="ip" />}
      right={
        <>
          <Sum over="j" />
          <Variable name="w" index="j" />
          <Variable name="σ" index="ij" />
        </>
      }
      spreadsheetFunction="SUMPRODUCT"
    />
  );
}

/** cᵢ = wᵢ σᵢₚ / σ²ₚ, the share of the variance of a portfolio that one stock adds, with the numbers of a stock when a calculation shows them. */
export function VarianceShareFormula({
  inputs,
}: {
  inputs?:
    | {
        weight: PortfolioWeight;
        covarianceWithPortfolio: MonthlyVariance;
        portfolioVariance: MonthlyVariance;
      }
    | undefined;
}): ReactNode {
  return (
    <Formula
      left={<Variable name="c" index="i" />}
      right={
        <Fraction
          numerator={
            <>
              <Variable name="w" index="i" />
              <Variable name="σ" index="ip" />
            </>
          }
          denominator={<Variable name="σ" index="p" power={2} />}
        />
      }
      followingLines={
        inputs === undefined
          ? []
          : [
              {
                operator: "≈",
                expression: (
                  <Fraction
                    numerator={
                      <>
                        <MathNumber>
                          {formatPercent(inputs.weight, "two")}
                        </MathNumber>
                        <Operator symbol="×" />
                        <MathNumber>
                          {formatVariance(inputs.covarianceWithPortfolio)}
                        </MathNumber>
                      </>
                    }
                    denominator={
                      <MathNumber>
                        {formatVariance(inputs.portfolioVariance)}
                      </MathNumber>
                    }
                  />
                ),
              },
            ]
      }
    />
  );
}
