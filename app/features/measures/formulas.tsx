import type { ReactNode } from "react";
import {
  formatBeta,
  formatNumber,
  formatPercent,
  formatVariance,
} from "~/formatting";
import type { MonthlyVariance } from "~/units/monthly-variance";
import type {
  RequiredReturnMeasure,
  SecurityMarketLineMeasure,
  StockMeasures,
} from "./capm";
import type { RiskFreeRateMeasure } from "./measure-risk-free-rate";
import type { CorrelationMeasure } from "./return-statistics";

// Decision 0020 explains why a formula is markup and not a message, and what each symbol and subscript stands for.

/** The subscript that stands for an instrument in a formula. */
export type Subject = "i" | "j" | "p" | "M";

function Return({ of }: { of: Subject }): ReactNode {
  return (
    <>
      R<sub>{of}</sub>
    </>
  );
}

function ExpectedReturn({ of }: { of: Subject }): ReactNode {
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
function Operand({ value, text }: { value: number; text: string }): ReactNode {
  return value < 0 ? `(${text})` : text;
}

function RiskFree(): ReactNode {
  return (
    <>
      R<sub>f</sub>
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
      {formatNumber(count)} (AVERAGE)
    </>
  );
}

/** σ²ᵢ = Σ(Rᵢ − E(Rᵢ))² / (n − 1). */
export function VarianceFormula({ of }: { of: Subject }): ReactNode {
  return (
    <>
      σ²<sub>{of}</sub> = Σ<Deviation of={of} />² / (n − 1) (VAR.S)
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
      σ<sub>{of}</sub> = √σ²<sub>{of}</sub> = √{formatVariance(variance)}
      {standardDeviationFunctions[of]}
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
        {first}
        {second}
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
      ρ<sub>{pair}</sub> = σ<sub>{pair}</sub> / (σ<sub>{first}</sub> σ
      <sub>{second}</sub>)
      {correlation !== undefined && (
        <>
          {" "}
          = {formatVariance(correlation.inputs.covariance)} / (
          {formatPercent(correlation.inputs.firstStandardDeviation, "two")} ×{" "}
          {formatPercent(correlation.inputs.secondStandardDeviation, "two")})
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
          = {formatVariance(beta.inputs.covarianceWithMarket)} /{" "}
          {formatVariance(beta.inputs.marketVariance)}
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
  return <>{terms[measure]} (SUMPRODUCT)</>;
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

/** kᵢ = R_f + βᵢ(E(Rₘ) − R_f), with the rate free of risk, the beta, and the expected return of the market. */
export function RequiredReturnFormula({
  of,
  required,
}: {
  of: Subject;
  required: RequiredReturnMeasure;
}): ReactNode {
  const riskFree = formatPercent(required.inputs.riskFreeRate, "two");
  return (
    <>
      k<sub>{of}</sub> = <RiskFree /> + β<sub>{of}</sub>(
      <ExpectedReturn of="M" /> − <RiskFree />) = {riskFree} +{" "}
      <Operand
        value={required.inputs.beta}
        text={formatBeta(required.inputs.beta)}
      />{" "}
      × ({formatPercent(required.inputs.marketExpectedReturn, "two")} −{" "}
      {riskFree})
    </>
  );
}

/** αᵢ = E(Rᵢ) − kᵢ, with the expected return and the required return. */
export function MarketLineFormula({
  of,
  distance,
}: {
  of: Subject;
  distance: SecurityMarketLineMeasure;
}): ReactNode {
  return (
    <>
      α<sub>{of}</sub> = <ExpectedReturn of={of} /> − k<sub>{of}</sub> ={" "}
      {formatPercent(distance.inputs.expectedReturn, "two")} −{" "}
      <Operand
        value={distance.inputs.requiredReturn}
        text={formatPercent(distance.inputs.requiredReturn, "two")}
      />
    </>
  );
}

/** R_f = BI-Rate / 12, with the yearly rate. */
export function RiskFreeFormula({
  rate,
}: {
  rate: RiskFreeRateMeasure;
}): ReactNode {
  const months = formatNumber(rate.inputs.monthsPerYear);
  return (
    <>
      <RiskFree /> = BI-Rate / {months} ={" "}
      {formatPercent(rate.inputs.annualRate)} / {months}
    </>
  );
}
