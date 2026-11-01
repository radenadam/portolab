import { successValueForTest } from "~/success-value-for-test";
import { idxRulesOn } from "./idx-rules-on";
import type { IdxRules } from "./idx-rules-on";
import { costRatesOn } from "./trading-costs";
import type { CostRates } from "./trading-costs";

/** The rules of IDX of a date that the rules cover. */
export function idxRulesForTest(date: string): IdxRules {
  return successValueForTest(
    idxRulesOn(date),
    `The rules of ${date} are recorded`,
  );
}

/** The rates of the costs of a date that the fees and the tax cover. */
export function costRatesForTest(date: string): CostRates {
  return successValueForTest(
    costRatesOn(date),
    `The rates of ${date} are recorded`,
  );
}
