import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";
import { splitAdjustedRupiah } from "~/units/split-adjusted-rupiah";
import { Sparkline } from "./sparkline";
import styles from "./sparkline.module.css";

function render(closes: readonly number[]): string {
  return renderToStaticMarkup(
    <Sparkline closes={closes.map(splitAdjustedRupiah)} />,
  );
}

function sparkline(direction: string, path: string, dot: string): string {
  return `<svg class="${direction}" style="padding:0.2em" aria-hidden="true"><svg viewBox="0 0 100 100" preserveAspectRatio="none" width="100%" height="100%" overflow="visible"><path d="${path}" class="${styles["line"] ?? ""}" vector-effect="non-scaling-stroke"></path></svg><circle cx="100%" cy="${dot}" r="0.2em" class="${styles["dot"] ?? ""}"></circle></svg>`;
}

test("draws the closes from the lowest at the bottom to the highest at the top, evenly across, in the color of a rise when the latest close is above the first", () => {
  // The closes of BBCA from 26 to 30 October 2026 reach from 4,900 to 5,275, a range of 375, so a close c lies at (5,275 - c) / 375 of the height from the top.
  expect(render([4940, 4900, 5275, 4940, 4980])).toBe(
    sparkline(
      styles["rise"] ?? "",
      "M0 89.33L25 100L50 0L75 89.33L100 78.67",
      "78.67%",
    ),
  );
});

test("draws closes that end below the first in the color of a fall", () => {
  expect(render([5000, 4900, 4950])).toBe(
    sparkline(styles["fall"] ?? "", "M0 0L50 100L100 50", "50%"),
  );
});

test("draws closes that end where they started in the muted color, and closes that never changed through the middle", () => {
  expect(render([5000, 5100, 5000])).toBe(
    sparkline(styles["flat"] ?? "", "M0 100L50 0L100 100", "100%"),
  );
  expect(render([5000, 5000])).toBe(
    sparkline(styles["flat"] ?? "", "M0 50L100 50", "50%"),
  );
});

test("draws nothing for fewer than two closes, which show no change", () => {
  expect(render([5000])).toBe("");
  expect(render([])).toBe("");
});
