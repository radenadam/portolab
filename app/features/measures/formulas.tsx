import type { ReactNode } from "react";
import { formatNumber, formatPercent, formatVariance } from "~/formatting";
import { formatDeviationProductSum } from "~/format-deviation-product-sum";
import type { FormulaLine } from "~/math-notation";
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
import type { DeviationProductSum, ReturnSum } from "~/units/return-sums";

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

/** The sum of the products of the deviations over n - 1 with their numbers, which a variance and a covariance show below their notation. */
function sampleLines(
  numbers: { sum: DeviationProductSum; count: number } | undefined,
): FormulaLine[] {
  if (numbers === undefined) return [];
  return [
    {
      operator: "=",
      expression: (
        <Fraction
          numerator={
            <MathNumber>{formatDeviationProductSum(numbers.sum)}</MathNumber>
          }
          denominator={
            <>
              <MathNumber>{formatNumber(numbers.count)}</MathNumber>
              <Operator symbol="−" />
              <MathNumber>1</MathNumber>
            </>
          }
        />
      ),
    },
  ];
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

/** E(Rᵢ) = ΣRᵢ / n, with the sum and the number of the returns of one instrument below it, or with the number of returns alone where the formula stands for every stock. */
export function MeanFormula({
  of,
  count,
  sum,
}: {
  of: Subject;
  count: number;
  sum?: ReturnSum | undefined;
}): ReactNode {
  const notation = (
    <Fraction
      numerator={
        <>
          <Sum />
          <Return of={of} />
        </>
      }
      denominator={<Variable name="n" />}
    />
  );
  return (
    <Formula
      left={<ExpectedReturn of={of} />}
      right={
        sum === undefined ? (
          <>
            {notation}
            <ConditionSeparator />
            <Variable name="n" />
            <Operator symbol="=" />
            <MathNumber>{formatNumber(count)}</MathNumber>
          </>
        ) : (
          notation
        )
      }
      followingLines={
        sum === undefined
          ? []
          : [
              {
                operator: "=",
                expression: (
                  <Fraction
                    numerator={
                      <MathNumber>{formatPercent(sum, "two")}</MathNumber>
                    }
                    denominator={<MathNumber>{formatNumber(count)}</MathNumber>}
                  />
                ),
              },
            ]
      }
      spreadsheetFunction="AVERAGE"
    />
  );
}

/** σ²ᵢ = Σ(Rᵢ − E(Rᵢ))² / (n − 1), with the sum of the squared deviations and the number of returns below it where the formula stands for one instrument. */
export function VarianceFormula({
  of,
  numbers,
}: {
  of: Subject;
  numbers?: { sum: DeviationProductSum; count: number } | undefined;
}): ReactNode {
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
      followingLines={sampleLines(numbers)}
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

/** σᵢₘ = Σ(Rᵢ − E(Rᵢ))(Rₘ − E(Rₘ)) / (n − 1), with the sum of the products of the deviations and the number of returns below it where the formula stands for one pair. */
export function CovarianceFormula({
  first,
  second,
  numbers,
}: {
  first: Subject;
  second: Subject;
  numbers?: { sum: DeviationProductSum; count: number } | undefined;
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
      followingLines={sampleLines(numbers)}
      spreadsheetFunction="COVARIANCE.S"
    />
  );
}
