import { expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { plotFraction } from "~/units/plot-fraction";
import { MapArrow } from "./map-arrow";

test("keeps a leftward arrowhead beyond the portfolio ring", () => {
  const html = renderToStaticMarkup(
    <svg>
      <MapArrow
        from={{
          position: { x: plotFraction(0.7), y: plotFraction(0.4) },
          radius: 0.5,
          outerRadius: 0.5,
        }}
        to={{
          position: { x: plotFraction(0.3), y: plotFraction(0.4) },
          radius: 0.67,
          outerRadius: 1.04,
        }}
      />
    </svg>,
  );
  expect(html).toContain('x="30%"');
  expect(html).toContain('x="0.69em"');
  expect(html).toContain('width="1.5em"');
  expect(html).toContain('vector-effect="non-scaling-stroke"');
});

test("draws no arrow when diversification leaves the point in place", () => {
  const mark = {
    position: { x: plotFraction(0.3), y: plotFraction(0.4) },
    radius: 0.67,
    outerRadius: 1.04,
  };
  expect(renderToStaticMarkup(<MapArrow from={mark} to={mark} />)).toBe("");
});
