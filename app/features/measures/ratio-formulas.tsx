import type { ReactNode } from "react";
import { formatBeta, formatPercent } from "~/formatting";
import type { MonthlyReturn } from "~/units/monthly-return";
import { ExpectedReturn, Operand, RiskFree } from "./formulas";
import type {
  SharpeRatioMeasure,
  TreynorRatioMeasure,
} from "./performance-ratios";

// Decision 0020 explains why a formula is markup and not a message, and decision 0031 gives the symbols of these ratios.

/** The numbers of E(Rₚ) − R_f, the return of a portfolio above the rate free of risk. */
function ExcessReturnNumbers({
  expectedReturn,
  riskFreeRate,
}: {
  expectedReturn: MonthlyReturn;
  riskFreeRate: MonthlyReturn;
}): ReactNode {
  return (
    <>
      {formatPercent(expectedReturn, "two")} −{" "}
      {formatPercent(riskFreeRate, "two")}
    </>
  );
}

/** Sₚ = (E(Rₚ) − R_f) / σₚ, with the expected return, the rate free of risk, and the standard deviation of the portfolio. */
export function SharpeRatioFormula({
  inputs,
}: {
  inputs: SharpeRatioMeasure["inputs"];
}): ReactNode {
  return (
    <>
      S<sub>p</sub> = (<ExpectedReturn of="p" /> − <RiskFree />) / σ<sub>p</sub>{" "}
      = (
      <ExcessReturnNumbers
        expectedReturn={inputs.expectedReturn}
        riskFreeRate={inputs.riskFreeRate}
      />
      ) / {formatPercent(inputs.standardDeviation, "two")}
    </>
  );
}

/** Tₚ = (E(Rₚ) − R_f) / βₚ, with the expected return, the rate free of risk, and the beta of the portfolio. */
export function TreynorRatioFormula({
  inputs,
}: {
  inputs: TreynorRatioMeasure["inputs"];
}): ReactNode {
  return (
    <>
      T<sub>p</sub> = (<ExpectedReturn of="p" /> − <RiskFree />) / β<sub>p</sub>{" "}
      = (
      <ExcessReturnNumbers
        expectedReturn={inputs.expectedReturn}
        riskFreeRate={inputs.riskFreeRate}
      />
      ) / <Operand value={inputs.beta} text={formatBeta(inputs.beta)} />
    </>
  );
}
