import { isContinuousTradingTime } from "~/features/market-data/idx-calendar";
import type { StockQuote } from "~/features/market-data/price-source.server";
import { rupiah } from "~/units/rupiah";
import type { Rupiah } from "~/units/rupiah";
import { wibDateOf } from "~/wib";
import { checkCashForPurchase } from "./check-cash-for-purchase";
import type { Fill, OpenOrder, Order, OrderSide, OrderState } from "./order";
import { cashChange, costRatesOn, tradeCosts } from "./trading-costs";

/** What Portolab knows when it checks an order. */
export interface OrderCheck {
  /** An open order, which isOpenOrder finds among the orders of an account. */
  order: OpenOrder;
  /** The latest delayed quote of the stock of the order. */
  quote: StockQuote;
  moment: Date;
  /** For a purchase, the cash of the account less what its other open orders set aside. */
  availableCash: Rupiah;
}

/** The state of an open order after Portolab checked it against the latest delayed quote of its stock at a moment, by the rules of decision 0016. */
export function checkOrder(check: OrderCheck): OrderState {
  const { order, quote, moment } = check;
  // An order that a check reaches only after its expiry no longer sets aside cash or shares, which other orders may have used since, so it can no longer fill.
  if (moment >= order.expiresAt) {
    return { kind: "expired", expiredAt: moment };
  }
  if (!isPriceOfOrder(order, quote.quotedAt)) {
    return order.state;
  }
  const price = fillPrice(order, quote.price);
  if (price !== undefined) {
    return fillAt(price, check);
  }
  switch (order.state.kind) {
    case "waiting":
      return { kind: "resting" };
    case "resting":
      return order.state;
  }
}

function isPriceOfOrder(order: Order, quotedAt: Date): boolean {
  if (quotedAt < order.tradesFrom || wibDateOf(quotedAt) !== order.tradingDay) {
    return false;
  }
  const isContinuous = isContinuousTradingTime(quotedAt);
  if (!isContinuous.ok) {
    throw new Error(
      `placeOrder found the trading day ${order.tradingDay} in the calendar, so the calendar covers it, but ${isContinuous.failure}`,
    );
  }
  return isContinuous.value;
}

/** The price at which a delayed price fills an order, or undefined when it does not reach the limit of the order. */
function fillPrice(order: OpenOrder, price: Rupiah): Rupiah | undefined {
  switch (order.price.kind) {
    case "market":
      return price;
    case "limit": {
      const { limit } = order.price;
      if (!reachesLimit(order.side, price, limit)) {
        return undefined;
      }
      // An order that arrives at a price that reaches its limit trades at that price. An order that already waits at its limit trades at its limit when the price moves through it, as an order in the book of the exchange does.
      switch (order.state.kind) {
        case "waiting":
          return price;
        case "resting":
          return limit;
      }
    }
  }
}

function reachesLimit(side: OrderSide, price: Rupiah, limit: Rupiah): boolean {
  switch (side) {
    case "buy":
      return price <= limit;
    case "sell":
      return price >= limit;
  }
}

function fillAt(price: Rupiah, check: OrderCheck): OrderState {
  const { order } = check;
  const rates = costRatesOn(order.tradingDay);
  if (!rates.ok) {
    throw new Error(
      `placeOrder found the costs of the trading day ${order.tradingDay}, so they are recorded, but ${rates.failure}`,
    );
  }
  switch (order.side) {
    case "buy": {
      const paid = checkCashForPurchase(
        { ...order, price },
        check.availableCash,
        rates.value,
      );
      if (!paid.ok) {
        return {
          kind: "rejected",
          rejectedAt: check.moment,
          failure: {
            kind: "priceRose",
            checkedPrice: order.checkedPrice,
            ...paid.failure,
          },
        };
      }
      return filled(check, { price, ...paid.value, tax: rupiah(0) });
    }
    case "sell": {
      const value = rupiah(price * order.shares);
      return filled(check, {
        price,
        value,
        ...tradeCosts("sell", value, rates.value),
      });
    }
  }
}

function filled(
  check: OrderCheck,
  amounts: Pick<Fill, "price" | "value" | "fee" | "tax">,
): OrderState {
  return {
    kind: "filled",
    fill: {
      ...amounts,
      cashChange: cashChange(check.order.side, amounts),
      quotedAt: check.quote.quotedAt,
      filledAt: check.moment,
    },
  };
}
