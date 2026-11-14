import { NumberText } from "~/number-text";
import type { ReactNode } from "react";
import { formatNumber, formatPercent, formatVariance } from "~/formatting";
import type { MonthlyVariance } from "~/units/monthly-variance";
import type { StockMeasures } from "./capm";
import type { CorrelationMeasure } from "./return-statistics";

// Decision 0020 explains why a formula is markup and not a message, and what each symbol and subscript stands for.

/** The subscript that stands for an instrument in a formula. */
export type Subject = "i" | "j" | "p" | "M";

function Return({ of }: { of: Subject }): ReactNode {
  return (
    <>
      R
      <sub>
        <NumberText>{of}</NumberText>
      </sub>
    </>
  );
}

/** E(Rᵢ), the expected return of an instrument. */
export function ExpectedReturn({ of }: { of: Subject }): ReactNode {
  return (
    <>
      E(
      <Return of={of} />)
    </>
  );
}

function Deviation({ of }: { of: Subject }): ReactNode {
  return (
    <>
      (<Return of={of} /> − <ExpectedReturn of={of} />)
    </>
  );
}

/** A number after an operator, as decision 0020 writes it. */
export function Operand({
  value,
  text,
}: {
  value: number;
  text: string;
}): ReactNode {
  return <NumberText>{value < 0 ? `(${text})` : text}</NumberText>;
}

/** The symbol of the rate free of risk, R with the subscript f, which a chart writes as well. */
export const riskFreeSymbol = { letter: "R", subscript: "f" } as const;

/** R_f, the rate free of risk. */
export function RiskFree(): ReactNode {
  return (
    <>
      <NumberText>{riskFreeSymbol.letter}</NumberText>
      <sub>
        <NumberText>{riskFreeSymbol.subscript}</NumberText>
      </sub>
    </>
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
    <>
      <ExpectedReturn of={of} /> = Σ<Return of={of} /> / n, n ={" "}
      <NumberText>{formatNumber(count)}</NumberText> (AVERAGE)
    </>
  );
}

/** σ²ᵢ = Σ(Rᵢ − E(Rᵢ))² / (n − 1). */
export function VarianceFormula({ of }: { of: Subject }): ReactNode {
  return (
    <>
      σ²
      <sub>
        <NumberText>{of}</NumberText>
      </sub>{" "}
      = Σ<Deviation of={of} />² / (n − 1) (VAR.S)
    </>
  );
}

// A spreadsheet gives the standard deviation of a stock or of the market from its returns, but that of a portfolio only from its variance.
const standardDeviationFunctions: Record<Subject, string> = {
  i: " (STDEV.S)",
  j: " (STDEV.S)",
  M: " (STDEV.S)",
  p: "",
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
    <>
      σ
      <sub>
        <NumberText>{of}</NumberText>
      </sub>{" "}
      = √σ²
      <sub>
        <NumberText>{of}</NumberText>
      </sub>{" "}
      = √<NumberText>{formatVariance(variance)}</NumberText>
      <NumberText>{standardDeviationFunctions[of]}</NumberText>
    </>
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
    <>
      σ
      <sub>
        <NumberText>{first}</NumberText>
        <NumberText>{second}</NumberText>
      </sub>{" "}
      = Σ<Deviation of={first} />
      <Deviation of={second} /> / (n − 1) (COVARIANCE.S)
    </>
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
  return (
    <>
      ρ
      <sub>
        <NumberText>{pair}</NumberText>
      </sub>{" "}
      = σ
      <sub>
        <NumberText>{pair}</NumberText>
      </sub>{" "}
      / (σ
      <sub>
        <NumberText>{first}</NumberText>
      </sub>{" "}
      σ
      <sub>
        <NumberText>{second}</NumberText>
      </sub>
      )
      {correlation !== undefined && (
        <>
          {" "}
          ={" "}
          <NumberText>
            {formatVariance(correlation.inputs.covariance)}
          </NumberText>{" "}
          / (
          <NumberText>
            {formatPercent(correlation.inputs.firstStandardDeviation, "two")}
          </NumberText>{" "}
          ×{" "}
          <NumberText>
            {formatPercent(correlation.inputs.secondStandardDeviation, "two")}
          </NumberText>
          )
        </>
      )}{" "}
      (CORREL)
    </>
  );
}

/** βᵢ = σᵢₘ / σ²ₘ, with the covariance and the variance of the market. */
export function BetaFormula({
  beta,
}: {
  beta: StockMeasures["beta"] | undefined;
}): ReactNode {
  return (
    <>
      β<sub>i</sub> = σ<sub>iM</sub> / σ²<sub>M</sub>
      {beta !== undefined && (
        <>
          {" "}
          ={" "}
          <NumberText>
            {formatVariance(beta.inputs.covarianceWithMarket)}
          </NumberText>{" "}
          /{" "}
          <NumberText>{formatVariance(beta.inputs.marketVariance)}</NumberText>
        </>
      )}{" "}
      (SLOPE)
    </>
  );
}

/** E(Rₚ) = Σ wᵢ E(Rᵢ) or βₚ = Σ wᵢ βᵢ, the sum of the measures of the stocks of a portfolio, each times its weight. */
export function WeightedSumFormula({
  measure,
}: {
  measure: "expectedReturn" | "beta";
}): ReactNode {
  const terms: Record<typeof measure, ReactNode> = {
    expectedReturn: (
      <>
        <ExpectedReturn of="p" /> = Σ w<sub>i</sub> <ExpectedReturn of="i" />
      </>
    ),
    beta: (
      <>
        β<sub>p</sub> = Σ w<sub>i</sub> β<sub>i</sub>
      </>
    ),
  };
  return (
    <>
      <NumberText>{terms[measure]}</NumberText> (SUMPRODUCT)
    </>
  );
}

/** σ²ₚ = Σᵢ Σⱼ wᵢ wⱼ σᵢⱼ, the weights times the covariance matrix times the weights. */
export function PortfolioVarianceFormula(): ReactNode {
  return (
    <>
      σ²<sub>p</sub> = Σ<sub>i</sub> Σ<sub>j</sub> w<sub>i</sub> w<sub>j</sub> σ
      <sub>ij</sub> (MMULT)
    </>
  );
}

/** σᵢₚ = Σⱼ wⱼ σᵢⱼ, the covariance of a stock with its portfolio from the weights and the covariances of the stocks. */
export function CovarianceWithPortfolioFormula(): ReactNode {
  return (
    <>
      σ<sub>ip</sub> = Σ<sub>j</sub> w<sub>j</sub> σ<sub>ij</sub> (SUMPRODUCT)
    </>
  );
}

/** cᵢ = wᵢ σᵢₚ / σ²ₚ, the share of the variance of a portfolio that one stock adds. */
export function VarianceShareFormula(): ReactNode {
  return (
    <>
      c<sub>i</sub> = w<sub>i</sub> σ<sub>ip</sub> / σ²<sub>p</sub>
    </>
  );
}
