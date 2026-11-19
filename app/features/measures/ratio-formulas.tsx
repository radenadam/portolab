import type { ReactNode } from "react";
import {
  formatFormulaBeta,
  formatFormulaPercent,
} from "~/formula-input-formatting";
import {
  Formula,
  Fraction,
  MathNumber,
  Operand,
  Operator,
  Variable,
} from "~/math-notation";
import type { FormulaLine } from "~/math-notation";
import type { MonthlyReturn } from "~/units/monthly-return";
import { ExpectedReturn, RiskFreeRate } from "./formulas";
import type {
  SharpeRatioMeasure,
  TreynorRatioMeasure,
} from "./performance-ratios";

// Decision 0020 explains why a formula is notation and not a message, and decision 0031 gives the symbols of these ratios.

/** (E(Rₚ) − R_f) / x, the return of a portfolio above the rate free of risk for each unit of a risk, with its numbers when a calculation shows them. */
function ExcessReturnRatio({
  symbol,
  risk,
  inputs,
}: {
  symbol: "S" | "T";
  risk: ReactNode;
  inputs:
    | {
        expectedReturn: MonthlyReturn;
        riskFreeRate: MonthlyReturn;
        risk: ReactNode;
      }
    | undefined;
}): ReactNode {
  const lines: FormulaLine[] = [];
  if (inputs !== undefined)
    lines.push({
      operator: "=",
      expression: (
        <Fraction
          numerator={
            <>
              <MathNumber>
                {formatFormulaPercent(inputs.expectedReturn)}
              </MathNumber>
              <Operand
                value={inputs.riskFreeRate}
                text={formatFormulaPercent(inputs.riskFreeRate)}
                operator="−"
              />
            </>
          }
          denominator={inputs.risk}
        />
      ),
    });
  return (
    <Formula
      left={<Variable name={symbol} index="p" />}
      right={
        <Fraction
          numerator={
            <>
              <ExpectedReturn of="p" />
              <Operator symbol="−" />
              <RiskFreeRate />
            </>
          }
          denominator={risk}
        />
      }
      followingLines={lines}
    />
  );
}

/** Sₚ = (E(Rₚ) − R_f) / σₚ, with the expected return, the rate free of risk, and the standard deviation of the portfolio. */
export function SharpeRatioFormula({
  inputs,
}: {
  inputs: SharpeRatioMeasure["inputs"] | undefined;
}): ReactNode {
  return (
    <ExcessReturnRatio
      symbol="S"
      risk={<Variable name="σ" index="p" />}
      inputs={
        inputs === undefined
          ? undefined
          : {
              ...inputs,
              risk: (
                <MathNumber>
                  {formatFormulaPercent(inputs.standardDeviation)}
                </MathNumber>
              ),
            }
      }
    />
  );
}

/** Tₚ = (E(Rₚ) − R_f) / βₚ, with the expected return, the rate free of risk, and the beta of the portfolio. */
export function TreynorRatioFormula({
  inputs,
}: {
  inputs: TreynorRatioMeasure["inputs"] | undefined;
}): ReactNode {
  return (
    <ExcessReturnRatio
      symbol="T"
      risk={<Variable name="β" index="p" />}
      inputs={
        inputs === undefined
          ? undefined
          : {
              ...inputs,
              risk: <MathNumber>{formatFormulaBeta(inputs.beta)}</MathNumber>,
            }
      }
    />
  );
}
