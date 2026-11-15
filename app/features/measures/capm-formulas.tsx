import type { ReactNode } from "react";
import { NumberText } from "~/number-text";
import { formatBeta, formatNumber, formatPercent } from "~/formatting";
import type { Beta } from "~/units/beta";
import type {
  MarketLine,
  RequiredReturnMeasure,
  SecurityMarketLineMeasure,
} from "./capm";
import type { RiskFreeRateMeasure } from "./measure-risk-free-rate";
import { ExpectedReturn, Operand, RiskFree } from "./formulas";
import type { Subject } from "./formulas";

/** k = R_f + β(E(Rₘ) − R_f) with the numbers of a line, for a stock or a portfolio with the subscript and the number of its beta, or for the whole line with the symbol of beta. */
function CapmFormula({
  of,
  line,
  beta,
}: {
  of: Subject | undefined;
  line: MarketLine;
  beta: Beta | undefined;
}): ReactNode {
  const riskFree = formatPercent(line.riskFreeRate, "two");
  const subscript = of === undefined ? null : <sub>{of}</sub>;
  return (
    <>
      k{subscript} = <RiskFree /> + β{subscript}(
      <ExpectedReturn of="M" /> − <RiskFree />) ={" "}
      <NumberText>{riskFree}</NumberText> +{" "}
      {beta === undefined ? (
        "β"
      ) : (
        <Operand value={beta} text={formatBeta(beta)} />
      )}{" "}
      × (
      <NumberText>{formatPercent(line.marketExpectedReturn, "two")}</NumberText>{" "}
      − <NumberText>{riskFree}</NumberText>)
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
  return (
    <CapmFormula of={of} line={required.inputs} beta={required.inputs.beta} />
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
  distance: SecurityMarketLineMeasure;
}): ReactNode {
  return (
    <>
      α<sub>{of}</sub> = <ExpectedReturn of={of} /> − k<sub>{of}</sub> ={" "}
      <NumberText>
        {formatPercent(distance.inputs.expectedReturn, "two")}
      </NumberText>{" "}
      −{" "}
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
      <RiskFree /> = BI-Rate / <NumberText>{months}</NumberText> ={" "}
      <NumberText>{formatPercent(rate.inputs.annualRate)}</NumberText> /{" "}
      <NumberText>{months}</NumberText>
    </>
  );
}
