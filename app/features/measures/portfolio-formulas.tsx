import type { ReactNode } from "react";
import { formatBeta, formatPercent, formatVariance } from "~/formatting";
import {
  Formula,
  Fraction,
  MathNumber,
  Operand,
  Operator,
  Sum,
  Variable,
  sumLines,
} from "~/math-notation";
import type { FormulaLine } from "~/math-notation";
import type { Beta } from "~/units/beta";
import type { MonthlyReturn } from "~/units/monthly-return";
import type { MonthlyVariance } from "~/units/monthly-variance";
import type { PortfolioWeight } from "~/units/portfolio-weight";
import { ExpectedReturn } from "./formulas";

// Decision 0020 explains why a formula is notation and not a message, and what each symbol and subscript stands for. Decision 0070 explains why it is MathML.

// A term of a sum with its numbers is about as wide as a short word, so two of them fit on one line of a phone, as decision 0070 sets.
const termsPerLine = 2;

/** A stock of a portfolio in a weighted sum: its code, its weight, and its measure. */
type WeightedTerm =
  | {
      code: string;
      weight: PortfolioWeight;
      kind: "expectedReturn";
      value: MonthlyReturn;
    }
  | { code: string; weight: PortfolioWeight; kind: "beta"; value: Beta };

function termValueText(term: WeightedTerm): string {
  switch (term.kind) {
    case "expectedReturn":
      return formatPercent(term.value, "two");
    case "beta":
      return formatBeta(term.value);
  }
}

/** E(Rₚ) = Σ wᵢ E(Rᵢ) or βₚ = Σ wᵢ βᵢ, the sum of the measures of the stocks of a portfolio, each times its weight, with the weight and the measure of each stock below it when a portfolio gives them. */
export function WeightedSumFormula({
  measure,
  terms,
}: {
  measure: "expectedReturn" | "beta";
  terms?: readonly WeightedTerm[] | undefined;
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
      followingLines={
        terms === undefined
          ? []
          : sumLines(
              "=",
              terms.map((term) => ({
                key: term.code,
                term: (
                  <>
                    <MathNumber>{formatPercent(term.weight, "two")}</MathNumber>
                    <Operand
                      value={term.value}
                      text={termValueText(term)}
                      operator="×"
                    />
                  </>
                ),
              })),
              termsPerLine,
            )
      }
      spreadsheetFunction="SUMPRODUCT"
    />
  );
}

/** σ²ₚ = Σᵢ Σⱼ wᵢ wⱼ σᵢⱼ, the weights times the covariance matrix times the weights, with the variance that it gives when a lesson shows it. A portfolio that gives the covariance of each stock with the portfolio shows the same sum as Σᵢ wᵢ σᵢₚ, with the weight and that covariance of each stock. */
export function PortfolioVarianceFormula({
  variance,
  risks,
}: {
  variance?: MonthlyVariance | undefined;
  risks?:
    | readonly {
        code: string;
        weight: PortfolioWeight;
        covarianceWithPortfolio: MonthlyVariance;
      }[]
    | undefined;
}): ReactNode {
  const lines: FormulaLine[] = [];
  if (risks !== undefined) {
    lines.push(
      {
        operator: "=",
        expression: (
          <>
            <Sum over="i" />
            <Variable name="w" index="i" />
            <Variable name="σ" index="ip" />
          </>
        ),
      },
      ...sumLines(
        "=",
        risks.map((risk) => ({
          key: risk.code,
          term: (
            <>
              <MathNumber>{formatPercent(risk.weight, "two")}</MathNumber>
              <Operand
                value={risk.covarianceWithPortfolio}
                text={formatVariance(risk.covarianceWithPortfolio)}
                operator="×"
              />
            </>
          ),
        })),
        termsPerLine,
      ),
    );
  }
  if (variance !== undefined) {
    lines.push({
      operator: "=",
      expression: <MathNumber>{formatVariance(variance)}</MathNumber>,
    });
  }
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
      followingLines={lines}
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
