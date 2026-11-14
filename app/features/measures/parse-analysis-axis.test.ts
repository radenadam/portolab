import { expect, test } from "vitest";
import { parseAnalysisAxis } from "./parse-analysis-axis";

test("defaults an absent axis to beta and accepts both risk measures", () => {
  expect(parseAnalysisAxis(null, "axis")).toEqual({ ok: true, value: "beta" });
  for (const value of ["beta", "risk"])
    expect(parseAnalysisAxis(value, "axis")).toEqual({ ok: true, value });
});

test("rejects other risk axes and input that is not text", () => {
  for (const value of [
    "",
    "standard-deviation",
    "BETA",
    ["beta"],
    1,
    "x".repeat(100_000),
  ])
    expect(parseAnalysisAxis(value, "axis").ok).toBe(false);
});
