import { expect, test } from "vitest";
import { priceChartStart } from "./price-chart-range";

test("keeps chart ranges on the same day and clamps them at the end of a shorter month", () => {
  expect(priceChartStart("2026-11-14", "3m")).toBe("2026-08-14");
  expect(priceChartStart("2025-03-31", "1m")).toBe("2025-02-28");
  expect(priceChartStart("2024-03-31", "1m")).toBe("2024-02-29");
  expect(priceChartStart("2026-12-31", "1y")).toBe("2025-12-31");
});
