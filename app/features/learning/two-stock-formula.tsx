import type { ReactNode } from "react";
import { NumberText } from "~/number-text";
import { formatNumber, formatPercent, formatVariance } from "~/formatting";
import { PortfolioVarianceFormula } from "~/features/measures/formulas";
import type { twoStockAllocation } from "./two-stock-allocation";

export function TwoStockFormula({
  measured,
}: {
  measured: ReturnType<typeof twoStockAllocation>;
}): ReactNode {
  const { weights, covariances } = measured.variance.inputs;
  return (
    <>
      <p>
        <PortfolioVarianceFormula />
      </p>
      <p>
        σ<sub>p</sub> = √(
        {covariances.flatMap((row, rowIndex) =>
          row.map((covariance, columnIndex) => {
            const firstWeight = weights[rowIndex];
            const secondWeight = weights[columnIndex];
            if (firstWeight === undefined || secondWeight === undefined)
              throw new Error("The variance inputs lack a weight.");
            return (
              <span key={`${String(rowIndex)}-${String(columnIndex)}`}>
                {rowIndex === 0 && columnIndex === 0 ? "" : " + "}
                <NumberText whole>
                  {formatNumber(firstWeight, 2)}
                </NumberText> ×{" "}
                <NumberText whole>{formatNumber(secondWeight, 2)}</NumberText> ×
                (<NumberText whole>{formatVariance(covariance)}</NumberText>)
              </span>
            );
          }),
        )}
        ) ={" "}
        <NumberText whole>
          {formatPercent(measured.standardDeviation.value, "three")}
        </NumberText>
      </p>
    </>
  );
}
