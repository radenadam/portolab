import type { ReactNode } from "react";

import { Popover } from "~/popover";
import { CalculationPart } from "./calculation-part";
import type { MeasureRow } from "./measure-list";
import styles from "./analysis.module.css";

export const analysisDataId = "analysis-data";

/** The calculation of one measure of Analisis, which opens in place with the parts of a measure in their order, followed by the inputs and the notes of the calculation. */
export function AnalysisCalculation({
  id,
  title,
  row,
  children,
}: {
  id: string;
  title: string;
  row: MeasureRow;
  children?: ReactNode;
}): ReactNode {
  return (
    <Popover id={id} label={title} placement="belowEnd">
      <div className={styles["calculation"]}>
        <CalculationPart title={title} level={2} row={row} />
        {row.inputs}
        {children}
      </div>
    </Popover>
  );
}
