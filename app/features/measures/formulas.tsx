import type { ReactNode } from "react";
import { formatNumber, formatPercent, formatVariance } from "~/formatting";
import {
  ConditionSeparator,
  Formula,
  Fraction,
  InlineMath,
  MathNumber,
  Operator,
  Parenthesized,
  SquareRoot,
  Squared,
  Sum,
  Variable,
} from "~/math-notation";
import type { MonthlyVariance } from "~/units/monthly-variance";
import type { StockMeasures } from "./capm";
import type { CorrelationMeasure } from "./return-statistics";

// Decision 0020 explains why a formula is notation and not a message, and what each symbol and subscript stands for. Decision 0070 explains why it is MathML.

/** The subscript that stands for an instrument in a formula. */
export type Subject = "i" | "j" | "p" | "M";

function Return({ of }: { of: Subject }): ReactNode {
  return <Variable name="R" index={of} />;
}

/** E(Rᵢ), the expected return of an instrument, inside a formula. */
export function ExpectedReturn({ of }: { of: Subject }): ReactNode {
  return (
    <>
      <Variable name="E" />
      <Parenthesized>
        <Return of={of} />
      </Parenthesized>
    </>
  );
}

function Deviation({ of }: { of: Subject }): ReactNode {
  return (
    <Parenthesized>
      <Return of={of} />
      <Operator symbol="−" />
      <ExpectedReturn of={of} />
    </Parenthesized>
  );
}

function SampleDenominator(): ReactNode {
  return (
    <>
      <Variable name="n" />
      <Operator symbol="−" />
      <MathNumber>1</MathNumber>
    </>
  );
}

/** R_f, the rate free of risk, inside a formula. */
export function RiskFreeRate(): ReactNode {
  return <Variable name="R" index="f" />;
}

/** R_f, the rate free of risk, in a sentence. */
export function RiskFree(): ReactNode {
  return (
    <InlineMath>
      <RiskFreeRate />
    </InlineMath>
  );
}

/** E(Rᵢ) = ΣRᵢ / n, with the number of returns. */
export function MeanFormula({
  of,
  count,
}: {
  of: Subject;
  count: number;
}): ReactNode {
  return (
    <Formula
      left={<ExpectedReturn of={of} />}
      right={
        <>
          <Fraction
            numerator={
              <>
                <Sum />
                <Return of={of} />
              </>
            }
            denominator={<Variable name="n" />}
          />
          <ConditionSeparator />
          <Variable name="n" />
          <Operator symbol="=" />
          <MathNumber>{formatNumber(count)}</MathNumber>
        </>
      }
      spreadsheetFunction="AVERAGE"
    />
  );
}

/** σ²ᵢ = Σ(Rᵢ − E(Rᵢ))² / (n − 1). */
export function VarianceFormula({ of }: { of: Subject }): ReactNode {
  return (
    <Formula
      left={<Variable name="σ" index={of} power={2} />}
      right={
        <Fraction
          numerator={
            <>
              <Sum />
              <Squared>
                <Deviation of={of} />
              </Squared>
            </>
          }
          denominator={<SampleDenominator />}
        />
      }
      spreadsheetFunction="VAR.S"
    />
  );
}

// A spreadsheet gives the standard deviation of a stock or of the market from its returns, but that of a portfolio only from its variance.
const standardDeviationFunctions: Record<Subject, string | undefined> = {
  i: "STDEV.S",
  j: "STDEV.S",
  M: "STDEV.S",
  p: undefined,
};

/** σᵢ = √σ²ᵢ, with the variance. */
export function StandardDeviationFormula({
  of,
  variance,
}: {
  of: Subject;
  variance: MonthlyVariance;
}): ReactNode {
  return (
    <Formula
      left={<Variable name="σ" index={of} />}
      right={
        <SquareRoot>
          <Variable name="σ" index={of} power={2} />
        </SquareRoot>
      }
      followingLines={[
        {
          operator: "=",
          expression: (
            <SquareRoot>
              <MathNumber>{formatVariance(variance)}</MathNumber>
            </SquareRoot>
          ),
        },
      ]}
      spreadsheetFunction={standardDeviationFunctions[of]}
    />
  );
}

/** σᵢₘ = Σ(Rᵢ − E(Rᵢ))(Rₘ − E(Rₘ)) / (n − 1). */
export function CovarianceFormula({
  first,
  second,
}: {
  first: Subject;
  second: Subject;
}): ReactNode {
  return (
    <Formula
      left={<Variable name="σ" index={`${first}${second}`} />}
      right={
        <Fraction
          numerator={
            <>
              <Sum />
              <Deviation of={first} />
              <Deviation of={second} />
            </>
          }
          denominator={<SampleDenominator />}
        />
      }
      spreadsheetFunction="COVARIANCE.S"
    />
  );
}

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
