import type { PriceSourceDescription } from "~/features/market-data/price-source.server";
import { countedText } from "~/counted-text";
import { m } from "~/paraglide/messages.js";

export function learningPriceSourceText(
  source: PriceSourceDescription,
): string {
  return countedText(
    source.delayMinutes,
    {
      one: m.learning_one_delay_notice,
      several: m.learning_several_delays_notice,
    },
    { source: source.name },
  );
}
