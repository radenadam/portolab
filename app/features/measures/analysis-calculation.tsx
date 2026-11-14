import type { ReactNode } from "react";
import { m } from "~/paraglide/messages.js";
import { Popover, PopoverButton } from "~/popover";
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
        <strong className={styles["number"]}>{row.value}</strong>
        <p>{row.formula}</p>
        {row.inputs}
        {children}
        <PopoverButton popover={analysisDataId} className={styles["link"]}>
          {m.measures_analysis_data_label()}
        </PopoverButton>
      </div>
    </Popover>
  );
}

export function AnalysisCalculationButton({ id }: { id: string }): ReactNode {
  return (
    <PopoverButton popover={id} className={styles["link"]}>
      {m.app_concept_calculation_label()} <span aria-hidden>›</span>
    </PopoverButton>
  );
}
