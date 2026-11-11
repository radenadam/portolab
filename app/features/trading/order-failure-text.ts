import { countedText } from "~/counted-text";
import { monthlyReturnCount } from "~/features/measures/monthly-return-count";
import {
  formatCalendarDate,
  formatList,
  formatMonth,
  formatPercent,
  formatRupiah,
} from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { basisPointsPerWhole } from "~/units/basis-points";
import { smallestOrderLots } from "~/units/lots";
import { rupiah } from "~/units/rupiah";
import { lotCount } from "./count-parts";
import { freeLotsOf } from "./lots-step";
import type { PriceLimit } from "./price-limits";
import type { FillFailure, OrderFailure } from "./order";
import { purchaseCost } from "./trading-costs";

type Failure = OrderFailure | FillFailure;

/** A failure of the price of a limit order, which concerns the value that the student typed in the field of the price. */
type LimitPriceFailure = Extract<
  Failure,
  { kind: "outsideLimits" | "offTick" }
>;

/** A failure that concerns the order as a whole, or a fill that a check rejected. */
type OtherFailure = Exclude<Failure, LimitPriceFailure>;

/** A purchase that the available cash does not pay for. */
type Shortfall = Extract<Failure, { kind: "notEnoughCash" | "priceRose" }>;

type NotEnoughCash = Extract<Failure, { kind: "notEnoughCash" }>;

type FailureTexts = {
  [Kind in OtherFailure["kind"]]: (
    failure: Extract<OtherFailure, { kind: Kind }>,
  ) => string;
};

/** The field of the price of a limit order as the order form shows it: the label that the reader sees, and what the field holds, without the spaces around it. */
export interface PriceField {
  label: string;
  written: string;
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

function largestPurchaseText(failure: NotEnoughCash): string {
  return m.trading_largest_purchase_error({
    price: formatRupiah(failure.price),
    lots: lotCount(failure.largestLots),
  });
}

function setAsideCashText(failure: NotEnoughCash): string {
  return countedText(
    failure.setAside.orders,
    {
      one: m.trading_one_purchase_sets_aside_cash_error,
      several: m.trading_several_purchases_set_aside_cash_error,
    },
    {
      setAside: formatRupiah(failure.setAside.amount),
      cash: formatRupiah(failure.cash),
    },
  );
}

/** The highest price at which the available cash pays for the smallest order, which tells the student which prices are within reach, or the lowest price of IDX when even that is beyond the cash. */
function lotPriceText(failure: NotEnoughCash): string {
  const smallestOrder = lotCount(smallestOrderLots);
  return failure.highestLotPrice >= failure.minimumPrice
    ? m.trading_highest_lot_price_error({
        smallestOrder,
        highest: formatRupiah(failure.highestLotPrice),
      })
    : m.trading_below_minimum_price_error({
        smallestOrder,
        minimum: formatRupiah(failure.minimumPrice),
      });
}

/** The steps that add to the available cash of an account that does not pay for the smallest order, each only in a state of the account where the student can take it or wait for it. The text about open buy orders already says when their cash comes back. */
function stepsWithoutAffordableLot(failure: NotEnoughCash): string[] {
  const steps: string[] = [];
  if (failure.holdsFreeShares) {
    steps.push(
      m.trading_sell_for_cash_error({
        shortfall: formatRupiah(
          rupiah(purchaseCost(failure) - failure.availableCash),
        ),
      }),
    );
  }
  const { sales } = failure;
  if (sales.orders > 0) {
    steps.push(
      countedText(
        sales.orders,
        {
          one: m.trading_one_sale_adds_cash_error,
          several: m.trading_several_sales_add_cash_error,
        },
        { codes: formatList(sales.codes, "conjunction") },
      ),
    );
  }
  return steps;
}

const failureTexts: FailureTexts = {
  missingRules: () => m.trading_missing_rules_error(),
  missingCosts: () => m.trading_missing_costs_error(),
  missingUniverse: () => m.trading_missing_universe_error(),
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
    }),
  tooFewReturns: (failure) =>
    m.trading_too_few_returns_error({
      code: failure.code,
      returns: monthlyReturnCount(failure.count),
      minimum: monthlyReturnCount(failure.minimum),
      month: formatMonth(failure.enoughAfterFirstTradingDayOf),
    }),
  notEnoughCash: (failure) => {
    const sentences: string[] = [
      m.trading_purchase_cost_error(purchaseAmounts(failure)),
    ];
    if (failure.setAside.orders > 0) {
      sentences.push(setAsideCashText(failure));
    }
    if (failure.largestLots > 0) {
      sentences.push(largestPurchaseText(failure));
    } else {
      sentences.push(
        lotPriceText(failure),
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
    if (failure.setAside.orders > 0) {
      sentences.push(
        countedText(
          failure.setAside.orders,
          {
            one: m.trading_one_sale_sets_aside_shares_error,
            several: m.trading_several_sales_set_aside_shares_error,
          },
          { setAside: lotCount(failure.setAside.amount), code: failure.code },
        ),
      );
    }
    const freeLots = freeLotsOf(failure);
    sentences.push(
      freeLots === 0
        ? countedText(
            failure.setAside.orders,
            {
              one: m.trading_one_sale_frees_shares_error,
              several: m.trading_several_sales_free_shares_error,
            },
            { code: failure.code },
          )
        : m.trading_largest_sale_error({ free: lotCount(freeLots) }),
    );
    return sentences.join(" ");
  },
  // A check records these rejections while nobody watches, and the student may read them days later, so their steps hold whenever they are read.
  priceRose: (failure) =>
    [
      m.trading_price_rose_error({
        ...purchaseAmounts(failure),
        checkedPrice: formatRupiah(failure.checkedPrice),
      }),
      m.trading_new_order_error({ code: failure.code }),
    ].join(" "),
  sharesGone: (failure) => {
    const sentences: string[] = [
      m.trading_shares_gone_error({
        lots: lotCount(failure.lots),
        code: failure.code,
        held: lotCount(failure.heldLots),
      }),
    ];
    if (failure.setAside.orders > 0) {
      sentences.push(
        countedText(
          failure.setAside.orders,
          {
            one: m.trading_one_other_sale_set_aside_error,
            several: m.trading_several_other_sales_set_aside_error,
          },
          { setAside: lotCount(failure.setAside.amount), code: failure.code },
        ),
      );
    }
    sentences.push(m.trading_check_holdings_error());
    return sentences.join(" ");
  },
};

/** The text that tells a student why Portolab rejected an order, in the active language, with the numbers of the failure, the rule behind it, and a next step. A failure of the price of a limit order takes limitPriceFailureText instead, because it names the field of the price. */
export function orderFailureText(failure: OtherFailure): string {
  return textOf(failure.kind, failure);
}

// Passing the kind on its own lets TypeScript match the text of each kind to the failures of that kind.
function textOf<Kind extends OtherFailure["kind"]>(
  kind: Kind,
  failure: Extract<OtherFailure, { kind: Kind }>,
): string {
  return failureTexts[kind](failure);
}

/** The text that tells a student why IDX rejects the price of a limit order, in the active language. It names the field of the price by its label and quotes what the field holds, gives the rule with its numbers, and offers the prices that IDX accepts. */
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
