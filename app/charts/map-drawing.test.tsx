import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { beta } from "~/units/beta";
import { monthlyReturn } from "~/units/monthly-return";
import { layoutRiskMap } from "./layout-risk-map";
import { MapDrawing } from "./map-drawing";
import type { DrawnPoint } from "./map-drawing";
import { markedPointsForTest, marketPointForTest } from "./map-points-for-test";
import { percentOf } from "./plot";

const layout = layoutRiskMap({
  market: marketPointForTest,
  points: markedPointsForTest,
  across: { style: "decimal", toValue: beta },
  up: { style: "percent", toValue: monthlyReturn },
});

/** A point of the map with its mark, as the risk map hands it to the drawing. */
function drawnPoint(key: string): DrawnPoint {
  if (key === marketPointForTest.key) {
    return { point: marketPointForTest, kind: "market", placed: layout.market };
  }
  const found = layout.points.find(({ point }) => point.key === key);
  if (found === undefined) throw new Error(`The map lays out no point ${key}.`);
  return {
    point: found.point,
    kind: found.point.mark.kind,
    placed: found.placed,
  };
}

/** The circles that the drawing centers on a point while the pointer marks one point. */
function circlesAround(key: string, active: DrawnPoint): number {
  const html = renderToStaticMarkup(
    <MapDrawing
      layout={layout}
      drawn={[marketPointForTest, ...markedPointsForTest].map(({ key: each }) =>
        drawnPoint(each),
      )}
      placed={{
        points: new Map(),
        lines: new Map(),
        wideLines: new Set(),
        values: new Set(),
      }}
      texts={{ title: "Beta", level: undefined, line: undefined }}
      active={active}
      spread={null}
      drawingRef={null}
      measureRef={null}
    />,
  );
  const { position } = drawnPoint(key).placed;
  const center = `cx="${percentOf(position.x)}" cy="${percentOf(position.y)}"`;
  return html.split(center).length - 1;
}

test("draws one ring around the mark of the reader when the pointer marks it, where its own ring stands", () => {
  // The mark of the reader is a dot inside its ring.
  expect(circlesAround("Portofolio Anda", drawnPoint("BBCA"))).toBe(2);
  expect(circlesAround("Portofolio Anda", drawnPoint("Portofolio Anda"))).toBe(
    2,
  );
});

test("draws a ring around another mark when the pointer marks it", () => {
  expect(circlesAround("BBCA", drawnPoint("Portofolio Anda"))).toBe(1);
  expect(circlesAround("BBCA", drawnPoint("BBCA"))).toBe(2);
});
