import { NumberText } from "~/number-text";
import type { ReactNode } from "react";

import { Popover } from "~/popover";
import type { MeasureRow } from "./measure-list";
import styles from "./analysis.module.css";

export const analysisDataId = "analysis-data";

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
        <h2>{title}</h2>
        <strong>
          <NumberText whole>{row.value}</NumberText>
        </strong>
        <p>{row.formula}</p>
        {row.inputs}
        {children}
      </div>
    </Popover>
  );
}
