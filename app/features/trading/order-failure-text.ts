import type { LimitPriceFailure } from "./limit-price-failure-text";
import { portfolioTitle } from "./portfolio-home";
import type { PortfolioKind } from "./portfolio-store.server";
import { countedText } from "~/counted-text";
import { monthlyReturnCount } from "~/features/measures/monthly-return-count";
import {
  formatCalendarDate,
  formatList,
  formatMonth,
  formatRupiah,
} from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { smallestOrderLots } from "~/units/lots";
import { rupiah } from "~/units/rupiah";
import { lotCount } from "./count-parts";
import { freeLotsOf } from "./lots-step";
import type { FillFailure, OrderFailure } from "./order";
import { purchaseCost } from "./trading-costs";

type Failure = OrderFailure | FillFailure;

type OtherFailure = Exclude<Failure, LimitPriceFailure>;

type Shortfall = Extract<Failure, { kind: "notEnoughCash" | "priceRose" }>;

type NotEnoughCash = Extract<Failure, { kind: "notEnoughCash" }>;

type FailureTexts = {
  [Kind in OtherFailure["kind"]]: (
    failure: Extract<OtherFailure, { kind: Kind }>,
    portfolioKind: PortfolioKind,
  ) => string;
};

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
  missingRules: (_failure, kind) =>
    ({
      membership: m.trading_missing_rules_error,
      demonstration: m.trading_lecturer_missing_rules_error,
    })[kind](),
  missingCosts: (_failure, kind) =>
    ({
      membership: m.trading_missing_costs_error,
      demonstration: m.trading_lecturer_missing_costs_error,
    })[kind](),
  missingUniverse: (_failure, kind) =>
    ({
      membership: m.trading_missing_universe_error,
      demonstration: m.trading_lecturer_missing_universe_error,
    })[kind](),
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
  sharesGone: (failure, kind) => {
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
    sentences.push(
      m.trading_check_holdings_error({ page: portfolioTitle(kind) }),
    );
    return sentences.join(" ");
  },
};

/** The text that tells an owner why Portolab rejected an order, in the active language, with the numbers of the failure, the rule behind it, and a next step. A failure of the price of a limit order takes limitPriceFailureText instead, because it names the field of the price. */
export function orderFailureText(
  failure: OtherFailure,
  portfolioKind: PortfolioKind = "membership",
): string {
  return textOf(failure.kind, failure, portfolioKind);
}

// Passing the kind on its own lets TypeScript match the text of each kind to the failures of that kind.
function textOf<Kind extends OtherFailure["kind"]>(
  kind: Kind,
  failure: Extract<OtherFailure, { kind: Kind }>,
  portfolioKind: PortfolioKind,
): string {
  return failureTexts[kind](failure, portfolioKind);
}
