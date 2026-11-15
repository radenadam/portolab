import { rupiah } from "~/units/rupiah";
import type { Rupiah } from "~/units/rupiah";
import type { IdxRules } from "./idx-rules-on";
import { tickOfPrice } from "./accepted-prices";

/** Looking at the price just below a boundary uses the lower band's tick. */
export function ticketPriceStep(
  price: Rupiah,
  direction: -1 | 1,
  rules: IdxRules,
): Rupiah {
  const at = rupiah(
    Math.max(rules.minimumPrice, direction < 0 ? price - 1 : price),
  );
  const tick = tickOfPrice(at, rules.tickBands);
  const next =
    direction < 0
      ? Math.ceil(price / tick) * tick - tick
      : Math.floor(price / tick) * tick + tick;
  return rupiah(
    Math.max(
      rules.minimumPrice,
      Number.isSafeInteger(next) ? next : Math.floor(price / tick) * tick,
    ),
  );
}
