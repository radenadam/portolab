import { idxRulesOn } from "./idx-rules-on";
import type { IdxRules } from "./idx-rules-on";
import { costRatesOn } from "./trading-costs";
import type { CostRates } from "./trading-costs";

/** The rules of IDX of a date that the rules cover. */
export function idxRulesForTest(date: string): IdxRules {
  const rules = idxRulesOn(date);
  if (!rules.ok) {
    throw new Error(
      `The rules of ${date} are recorded, but idxRulesOn failed with ${JSON.stringify(rules.failure)}.`,
    );
  }
  return rules.value;
}

/** The rates of the costs of a date that the fees and the tax cover. */
export function costRatesForTest(date: string): CostRates {
  const rates = costRatesOn(date);
  if (!rates.ok) {
    throw new Error(
      `The rates of ${date} are recorded, but costRatesOn failed with ${JSON.stringify(rates.failure)}.`,
    );
  }
  return rates.value;
}
