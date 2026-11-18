import {
  formatCalendarDate,
  formatPercent,
  formatRupiah,
  formatSignedPercent,
  formatSignedRupiah,
} from "~/formatting";
import { rupiah } from "~/units/rupiah";
import { m } from "~/paraglide/messages.js";
import { basisPointsPerWhole } from "~/units/basis-points";
import type { PriceLimit } from "./price-limits";
import type { FillFailure, OrderFailure } from "./order";
type Failure = OrderFailure | FillFailure;
/** A failure of the price of a limit order, which concerns the value that the reader typed in the field of the price. */
export type LimitPriceFailure = Extract<
  Failure,
  { kind: "outsideLimits" | "offTick" }
>;

export interface PriceField {
  label: string;
  written: string;
}

/** The side of the reference price that a limit bounds. */
type PriceLimitSide = "upper" | "lower";

const sideSigns: Record<PriceLimitSide, 1 | -1> = { upper: 1, lower: -1 };

/** A limit as its rate or amount, and with the sign of its side when it names that side, such as +25% above the reference price. */
export function formatLimit(limit: PriceLimit, side?: PriceLimitSide): string {
  const sign = side === undefined ? undefined : sideSigns[side];
  switch (limit.kind) {
    case "rate": {
      const rate = limit.rate / basisPointsPerWhole;
      return sign === undefined
        ? formatPercent(rate)
        : formatSignedPercent(sign * rate, "upToTwo").text;
    }
    case "amount":
      return sign === undefined
        ? formatRupiah(limit.amount)
        : formatSignedRupiah(rupiah(sign * limit.amount)).text;
  }
}

/** The text that tells an owner why IDX rejects the price of a limit order, in the active language. It names the field of the price by its label and quotes what the field holds, gives the rule with its numbers, and offers the prices that IDX accepts. */
export function limitPriceFailureText(
  failure: LimitPriceFailure,
  field: PriceField,
): string {
  const typed = { field: field.label, value: field.written };
  switch (failure.kind) {
    case "outsideLimits":
      return m.trading_outside_limits_error({
        ...typed,
        code: failure.code,
        date: formatCalendarDate(failure.date),
        upper: formatLimit(failure.upper),
        lower: formatLimit(failure.lower),
        reference: formatRupiah(failure.reference),
        lowest: formatRupiah(failure.lowest),
        highest: formatRupiah(failure.highest),
      });
    case "offTick": {
      const prices = {
        ...typed,
        from: formatRupiah(failure.bandFrom),
        tick: formatRupiah(failure.tick),
        below: formatRupiah(failure.below),
        above: formatRupiah(failure.above),
      };
      return failure.nextBandFrom === undefined
        ? m.trading_off_tick_top_error(prices)
        : m.trading_off_tick_error({
            ...prices,
            to: formatRupiah(failure.nextBandFrom),
          });
    }
  }
}
