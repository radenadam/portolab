import { expect, test } from "vitest";
import { idxRulesOn } from "./idx-rules-on";
import { idxRulesForTest } from "./rules-for-test";

test("fails for a date that some rule has no record for, and names every such rule", () => {
  expect(idxRulesOn("2027-01-04")).toEqual({
    ok: false,
    failure:
      "No recorded IDX rule for the auto rejection limits covers 2027-01-04, so add the rules that IDX set for that day to idx-rules-on.ts.",
  });
  expect(idxRulesOn("2026-09-27")).toEqual({
    ok: false,
    failure:
      "No recorded IDX rule for the minimum price and the auto rejection limits covers 2026-09-27, so add the rules that IDX set for that day to idx-rules-on.ts.",
  });
  expect(idxRulesOn("2014-01-05")).toEqual({
    ok: false,
    failure:
      "No recorded IDX rule for the order sizes, the tick sizes, the minimum price, and the auto rejection limits covers 2014-01-05, so add the rules that IDX set for that day to idx-rules-on.ts.",
  });
});

test("gives lots of 100 shares and orders of at most 50,000 lots", () => {
  const rules = idxRulesForTest("2026-11-02");
  expect(rules.lotShares).toBe(100);
  expect(rules.maximumLots).toBe(50_000);
});
