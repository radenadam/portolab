import type { ReactNode } from "react";
import { formatBeta, formatNumber, formatPercent } from "~/formatting";
import {
  Formula,
  Fraction,
  MathNumber,
  MathWord,
  Operand,
  Operator,
  Parenthesized,
  Variable,
} from "~/math-notation";
import type { FormulaLine } from "~/math-notation";
import type { Beta } from "~/units/beta";
import type {
  MarketLine,
  RequiredReturnMeasure,
  SecurityMarketLineMeasure,
} from "./capm";
import type { RiskFreeRateMeasure } from "./measure-risk-free-rate";
import { monthsPerYear } from "./measure-risk-free-rate";
import { ExpectedReturn, RiskFreeRate } from "./formulas";
import type { Subject } from "./formulas";

/** k = R_f + β(E(Rₘ) − R_f) with the numbers of a line, for a stock or a portfolio with the subscript and the number of its beta, or for the whole line with the symbol of beta. */
function CapmFormula({
  of,
  line,
  beta,
  decimals = "two",
}: {
  of: Subject | undefined;
  line: MarketLine | undefined;
  beta: Beta | undefined;
  decimals?: "two" | "three";
}): ReactNode {
  const right = (
    <>
      <RiskFreeRate />
      <Operator symbol="+" />
      <Variable name="β" index={of} />
      <Parenthesized>
        <ExpectedReturn of="M" />
        <Operator symbol="−" />
        <RiskFreeRate />
      </Parenthesized>
    </>
  );
  const lines: FormulaLine[] = [];
  if (line !== undefined)
    lines.push({
      operator: "=",
      expression: (
        <>
          <MathNumber>{formatPercent(line.riskFreeRate, decimals)}</MathNumber>
          {beta === undefined ? (
            <>
              <Operator symbol="+" />
              <Variable name="β" />
            </>
          ) : (
            <Operand value={beta} text={formatBeta(beta)} operator="+" />
          )}
          <Operator symbol="×" />
          <Parenthesized>
            <MathNumber>
              {formatPercent(line.marketExpectedReturn, decimals)}
            </MathNumber>
            <Operand
              value={line.riskFreeRate}
              text={formatPercent(line.riskFreeRate, decimals)}
              operator="−"
            />
          </Parenthesized>
        </>
      ),
    });
  return (
    <Formula
      left={<Variable name="k" index={of} />}
      right={right}
      followingLines={lines}
    />
  );
}

/** kᵢ = R_f + βᵢ(E(Rₘ) − R_f), with the rate free of risk, the beta, and the expected return of the market. */
export function RequiredReturnFormula({
  of,
  required,
  decimals,
}: {
  of: Subject;
  required: RequiredReturnMeasure | undefined;
  decimals?: "two" | "three" | undefined;
}): ReactNode {
  return (
    <CapmFormula
      of={of}
      line={required?.inputs}
      beta={required?.inputs.beta}
      decimals={decimals ?? "two"}
    />
  );
}

/** k = R_f + β(E(Rₘ) − R_f), the security market line, with the rate free of risk and the expected return of the market. */
export function SecurityMarketLineFormula({
  line,
}: {
  line: MarketLine;
}): ReactNode {
  return <CapmFormula of={undefined} line={line} beta={undefined} />;
}

/** αᵢ = E(Rᵢ) − kᵢ, with the expected return and the required return. */
export function MarketLineFormula({
  of,
  distance,
}: {
  of: Subject;
  distance: SecurityMarketLineMeasure | undefined;
}): ReactNode {
  const lines: FormulaLine[] = [];
  if (distance !== undefined)
    lines.push({
      operator: "=",
      expression: (
        <>
          <MathNumber>
            {formatPercent(distance.inputs.expectedReturn, "two")}
          </MathNumber>
          <Operand
            value={distance.inputs.requiredReturn}
            text={formatPercent(distance.inputs.requiredReturn, "two")}
            operator="−"
          />
        </>
      ),
    });
  return (
    <Formula
      left={<Variable name="α" index={of} />}
      right={
        <>
          <ExpectedReturn of={of} />
          <Operator symbol="−" />
          <Variable name="k" index={of} />
        </>
      }
      followingLines={lines}
    />
  );
}

/** R_f = BI-Rate / 12, with the yearly rate. */
export function RiskFreeFormula({
  rate,
}: {
  rate: RiskFreeRateMeasure | undefined;
}): ReactNode {
  const months = (
    <MathNumber>
      {formatNumber(rate?.inputs.monthsPerYear ?? monthsPerYear)}
    </MathNumber>
  );
  const lines: FormulaLine[] = [];
  if (rate !== undefined)
    lines.push({
      operator: "=",
      expression: (
        <Fraction
          numerator={
            <MathNumber>{formatPercent(rate.inputs.annualRate)}</MathNumber>
          }
          denominator={months}
        />
      ),
    });
  return (
    <Formula
      left={<RiskFreeRate />}
      right={
        <Fraction
          numerator={<MathWord>BI-Rate</MathWord>}
          denominator={months}
        />
      }
      followingLines={lines}
    />
  );
}
