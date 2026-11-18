import { expect, test } from "vitest";
import { estimatedLabelWidth } from "./estimated-label-width";

test("gives an Intl nonbreaking space the width of the same visible ordinary space", () => {
  expect(estimatedLabelWidth("Rp\u00a0100.000.000")).toBe(
    estimatedLabelWidth("Rp 100.000.000"),
  );
  expect(estimatedLabelWidth("IDR\u00a0100M")).toBe(
    estimatedLabelWidth("IDR 100M"),
  );
});
