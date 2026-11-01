import {
  formatCalendarDate,
  formatMarketClock,
  formatMonth,
  formatNumber,
  formatPercent,
  formatRupiah,
} from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { singularOrPlural } from "~/sentences";
import { basisPointsPerWhole } from "~/units/basis-points";
import { lots } from "~/units/lots";
import type { Lots } from "~/units/lots";
import type { PriceLimit } from "./price-limits";
import type { FillFailure, OrderFailure } from "./order";
import { purchaseCost } from "./trading-costs";

type Failure = OrderFailure | FillFailure;

/** A purchase that the available cash does not pay for. */
type Shortfall = Extract<Failure, { kind: "notEnoughCash" | "priceRose" }>;

type FailureTexts = {
  [Kind in Failure["kind"]]: (
    failure: Extract<Failure, { kind: Kind }>,
  ) => string;
};

type CountMessage = (inputs: { count: string }) => string;

// A count has one form for 1 and another for several, because English changes its grammar between them.
function countText(
  count: number,
  messages: { one: CountMessage; several: CountMessage },
): string {
  const message = singularOrPlural(count, messages.one, messages.several);
  return message({ count: formatNumber(count) });
}

function lotCount(count: Lots): string {
  return countText(count, {
    one: m.trading_one_lot_phrase,
    several: m.trading_several_lots_phrase,
  });
}

function monthlyReturnCount(count: number): string {
  return countText(count, {
    one: m.trading_one_monthly_return_phrase,
    several: m.trading_several_monthly_returns_phrase,
  });
}

function formatLimit(limit: PriceLimit): string {
  switch (limit.kind) {
    case "rate":
      return formatPercent(limit.rate / basisPointsPerWhole);
    case "amount":
      return formatRupiah(limit.amount);
  }
}

/** The amounts of a purchase that the available cash does not pay for, as its texts give them. */
function purchaseAmounts(failure: Shortfall): {
  lots: string;
  code: string;
  price: string;
  cost: string;
  value: string;
  fee: string;
  available: string;
} {
  return {
    lots: lotCount(failure.lots),
    code: failure.code,
    price: formatRupiah(failure.price),
    cost: formatRupiah(purchaseCost(failure)),
    value: formatRupiah(failure.value),
    fee: formatRupiah(failure.fee),
    available: formatRupiah(failure.availableCash),
  };
}

function largestPurchaseText(failure: Shortfall): string {
  return m.trading_largest_purchase_error({
    price: formatRupiah(failure.price),
    lots: lotCount(failure.largestLots),
  });
}

/** The steps that add to the available cash of an account that does not pay for 1 lot, each only in a state of the account where the student can take it. A lower price or another stock helps only with enough cash, so it is the step only when the account has nothing to sell and nothing set aside. */
function stepsWithoutAffordableLot(
  failure: Extract<Failure, { kind: "notEnoughCash" }>,
): string[] {
  const steps: string[] = [];
  if (failure.holdsShares) {
    steps.push(
      m.trading_sell_for_cash_error({
        available: formatRupiah(failure.availableCash),
      }),
    );
  }
  if (failure.setAsideCash > 0) {
    steps.push(
      m.trading_wait_for_cash_error({
        setAside: formatRupiah(failure.setAsideCash),
      }),
    );
  }
  if (steps.length === 0) {
    steps.push(
      m.trading_lower_price_error({ price: formatRupiah(failure.price) }),
    );
  }
  return steps;
}

const failureTexts: FailureTexts = {
  missingRules: () => m.trading_missing_rules_error(),
  noPrice: (failure) => m.trading_no_price_error({ code: failure.code }),
  outsideUniverse: (failure) =>
    m.trading_outside_universe_error({
      code: failure.code,
      date: formatCalendarDate(failure.date),
    }),
  noPriceHistory: (failure) =>
    m.trading_no_price_history_error({
      code: failure.code,
      instrument: failure.instrument,
    }),
  noReferenceClose: (failure) =>
    m.trading_no_reference_close_error({
      code: failure.code,
      date: formatCalendarDate(failure.date),
      time: formatMarketClock(failure.finalAt),
    }),
  tooFewReturns: (failure) =>
    m.trading_too_few_returns_error({
      code: failure.code,
      returns: monthlyReturnCount(failure.count),
      minimum: monthlyReturnCount(failure.minimum),
      month: formatMonth(failure.enoughAfterFirstTradingDayOf),
    }),
  tooManyLots: (failure) =>
    m.trading_too_many_lots_error({
      lots: lotCount(failure.lots),
      maximum: lotCount(failure.maximumLots),
    }),
  outsideLimits: (failure) =>
    m.trading_outside_limits_error({
      price: formatRupiah(failure.price),
      code: failure.code,
      date: formatCalendarDate(failure.date),
      upper: formatLimit(failure.upper),
      lower: formatLimit(failure.lower),
      reference: formatRupiah(failure.reference),
      lowest: formatRupiah(failure.lowest),
      highest: formatRupiah(failure.highest),
    }),
  offTick: (failure) => {
    const prices = {
      from: formatRupiah(failure.bandFrom),
      tick: formatRupiah(failure.tick),
      price: formatRupiah(failure.price),
      below: formatRupiah(failure.below),
      above: formatRupiah(failure.above),
    };
    return failure.nextBandFrom === undefined
      ? m.trading_off_tick_top_error(prices)
      : m.trading_off_tick_error({
          ...prices,
          to: formatRupiah(failure.nextBandFrom),
        });
  },
  notEnoughCash: (failure) => {
    const sentences: string[] = [
      m.trading_purchase_cost_error(purchaseAmounts(failure)),
    ];
    if (failure.setAsideCash > 0) {
      sentences.push(
        m.trading_set_aside_cash_error({
          setAside: formatRupiah(failure.setAsideCash),
          cash: formatRupiah(failure.cash),
        }),
      );
    }
    if (failure.largestLots > 0) {
      sentences.push(largestPurchaseText(failure));
    } else {
      sentences.push(
        m.trading_no_affordable_lot_error({
          price: formatRupiah(failure.price),
        }),
        ...stepsWithoutAffordableLot(failure),
      );
    }
    return sentences.join(" ");
  },
  notEnoughShares: (failure) => {
    const orderLots = lotCount(failure.lots);
    if (failure.heldLots === 0) {
      return m.trading_no_shares_error({
        lots: orderLots,
        code: failure.code,
      });
    }
    const sentences: string[] = [
      m.trading_sale_shares_error({
        lots: orderLots,
        code: failure.code,
        held: lotCount(failure.heldLots),
      }),
    ];
    if (failure.setAsideLots > 0) {
      sentences.push(
        m.trading_set_aside_shares_error({
          setAside: lotCount(failure.setAsideLots),
        }),
      );
    }
    const freeLots = lots(failure.heldLots - failure.setAsideLots);
    sentences.push(
      freeLots === 0
        ? m.trading_no_free_shares_error({ code: failure.code })
        : m.trading_largest_sale_error({ free: lotCount(freeLots) }),
    );
    return sentences.join(" ");
  },
  priceRose: (failure) => {
    const checkedPrice = formatRupiah(failure.checkedPrice);
    // The order set aside the cost of its shares at the price it was checked at, so a limit order at that price is within the cash it could use.
    const sentences: string[] = [
      m.trading_price_rose_error({ ...purchaseAmounts(failure), checkedPrice }),
      m.trading_limit_at_checked_price_error({ checkedPrice }),
    ];
    if (failure.largestLots > 0) {
      sentences.push(largestPurchaseText(failure));
    }
    return sentences.join(" ");
  },
};

/** The text that tells a student why Portolab rejected an order, in the active language, with the numbers of the failure, the rule behind it, and a next step. */
export function orderFailureText(failure: Failure): string {
  return textOf(failure.kind, failure);
}

// Passing the kind on its own lets TypeScript match the text of each kind to the failures of that kind.
function textOf<Kind extends Failure["kind"]>(
  kind: Kind,
  failure: Extract<Failure, { kind: Kind }>,
): string {
  return failureTexts[kind](failure);
}
