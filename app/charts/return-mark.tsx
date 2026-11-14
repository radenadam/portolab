import type { ReactNode } from "react";
import type { PlotFraction } from "~/units/plot-fraction";
import { percentOf } from "./plot";

/** The gap between the text of a mark of the axis of returns and the left edge of the plot, in sizes of the text of the marks. The plot leaves it beside the room for the texts. */
export const returnMarkGap = 0.75;

/** A mark of the axis of returns: a line across the plot at the height of a value, and the text of the value, which ends before the left edge of the plot with its middle at that height. */
export function ReturnMark({
  at,
  text,
  lineClassName,
  textClassName,
  textShift,
}: {
  at: PlotFraction;
  text: string;
  lineClassName: string | undefined;
  textClassName: string | undefined;
  textShift?: string;
}): ReactNode {
  return (
    <g>
      <line
        x1="0"
        x2="100%"
        y1={percentOf(at)}
        y2={percentOf(at)}
        className={lineClassName}
      />
      <text
        x="0"
        y={percentOf(at)}
        dx={`${String(-returnMarkGap)}em`}
        dy="0.35em"
        textAnchor="end"
        style={{ translate: textShift }}
        className={textClassName}
      >
        {text}
      </text>
    </g>
  );
}
