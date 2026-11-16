import { m } from "~/paraglide/messages.js";
import type { PlotPosition } from "./plot";
import type { TimeChartLayout, TimeLine } from "./time-chart-layout";
import { chartName } from "./chart-name";

export function timeEndLabels<Point, Value extends number>(
  lines: readonly TimeLine<Point, Value>[],
  {
    latest,
    layout,
    valueText,
  }: {
    latest: Point | undefined;
    layout: TimeChartLayout;
    valueText: (value: Value) => string;
  },
): { position: PlotPosition; text: string; dy: string }[] {
  const labels: { position: PlotPosition; text: string; dy: string }[] = [];
  if (latest === undefined) return labels;
  for (const [index, line] of lines.entries()) {
    if (line.endName === undefined) continue;
    const position = layout.lines[index]?.positions.at(-1);
    if (position === undefined)
      throw new Error(`The time chart has no last position for ${line.name}.`);
    labels.push({
      position,
      dy: "0.35em",
      text: m.app_map_value_part({
        name: chartName(line.endName),
        value: valueText(line.valueOf(latest)),
      }),
    });
  }
  const [first, second] = labels;
  if (
    first !== undefined &&
    second !== undefined &&
    Math.abs(first.position.y - second.position.y) < 0.05
  ) {
    const upper = first.position.y <= second.position.y ? first : second;
    const lower = upper === first ? second : first;
    upper.dy = "-0.4em";
    lower.dy = "1.1em";
  }
  return labels;
}
