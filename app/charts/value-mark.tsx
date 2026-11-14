import type { ReactNode } from "react";
import type { PlotFraction } from "~/units/plot-fraction";
import { percentOf } from "./plot";

/** The gap between the text of a value mark and the edge of the plot, in sizes of the text of the marks. The plot leaves it beside the room for the texts. */
export const valueMarkGap = 0.75;

export type ValueAxisSide = "left" | "right";

const sideAttributes: Record<
  ValueAxisSide,
  { x: string; gap: number; anchor: "end" | "start" }
> = {
  left: { x: "0", gap: -valueMarkGap, anchor: "end" },
  right: { x: "100%", gap: valueMarkGap, anchor: "start" },
};

/** The label stays outside its chosen edge of the plot so it does not cover the data. */
export function ValueMark({
  at,
  text,
  lineClassName,
  textClassName,
  textShift,
  side = "left",
}: {
  at: PlotFraction;
  text: string;
  lineClassName: string | undefined;
  textClassName: string | undefined;
  textShift?: string;
  side?: ValueAxisSide;
}): ReactNode {
  const attributes = sideAttributes[side];
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
        x={attributes.x}
        y={percentOf(at)}
        dx={`${String(attributes.gap)}em`}
        dy="0.35em"
        textAnchor={attributes.anchor}
        style={{ translate: textShift }}
        className={textClassName}
      >
        {text}
      </text>
    </g>
  );
}
