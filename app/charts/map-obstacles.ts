import { plotFraction } from "~/units/plot-fraction";
import type { LabelledLine } from "./label-box";
import type { RiskMapLayout } from "./layout-risk-map";
import { arrowHeadReach } from "./map-arrow";
import { markReach } from "./map-drawing";
import type { DrawnPoint } from "./map-drawing";
import type { LabelledMark } from "./map-labels";

/** The marks and the lines of data of the drawing of a map, which every label keeps clear of. The head of an arrow stands beside the mark that it points at, so labels also keep clear of a circle around that mark that holds the head. */
export function mapObstacles(
  layout: RiskMapLayout<unknown>,
  drawn: readonly DrawnPoint[],
  hasLevel: boolean,
): { marks: LabelledMark[]; lines: LabelledLine[] } {
  const marks: LabelledMark[] = [];
  for (const { point, placed } of drawn) {
    marks.push({
      key: point.key,
      position: placed.position,
      outerRadius: placed.outerRadius,
      selectionRadius: placed.outerRadius + markReach,
    });
    const target = drawn.find(
      (candidate) => candidate.point.key === point.arrowTo,
    );
    if (target !== undefined)
      marks.push({
        key: `${point.key}-arrow`,
        position: target.placed.position,
        outerRadius: target.placed.outerRadius + arrowHeadReach,
      });
  }
  return { marks, lines: mapDrawingLines(layout, drawn, hasLevel) };
}

/** The lines of data that the drawing of a map draws over its grid, which every label keeps clear of: the line of the return of the IHSG, the line of the map, the median, the stem of each point, and each arrow. The lines of the grid lie under the labels, also the strong lines at zero and at the risk of the IHSG. */
function mapDrawingLines(
  layout: RiskMapLayout<unknown>,
  drawn: readonly DrawnPoint[],
  hasLevel: boolean,
): LabelledLine[] {
  const across = (height: number): LabelledLine => ({
    start: { x: plotFraction(0), y: plotFraction(height) },
    end: { x: plotFraction(1), y: plotFraction(height) },
  });
  const lines: LabelledLine[] = [];
  if (hasLevel) lines.push(across(layout.market.position.y));
  if (layout.line !== undefined) lines.push(layout.line);
  if (layout.median !== undefined) lines.push(across(layout.median));
  for (const { point, placed } of drawn) {
    if (placed.stem !== undefined)
      lines.push({
        start: { x: placed.position.x, y: placed.stem },
        end: placed.position,
      });
    const target = drawn.find(
      (candidate) => candidate.point.key === point.arrowTo,
    );
    if (target !== undefined)
      lines.push({ start: placed.position, end: target.placed.position });
  }
  return lines;
}
