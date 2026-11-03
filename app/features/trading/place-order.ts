import type { StockQuote } from "~/features/market-data/price-source.server";
import { fail, succeed } from "~/result";
import type { Result } from "~/result";
import { lots, smallestOrderLots } from "~/units/lots";
import type { OrderLots } from "~/units/lots";
import { rupiah } from "~/units/rupiah";
import type { Rupiah } from "~/units/rupiah";
import { shares } from "~/units/shares";
import type { Shares } from "~/units/shares";
import { acceptedPriceRange, checkLimitPrice } from "./accepted-prices";
import { checkBuyable } from "./check-buyable";
import type { StockHistories } from "./check-buyable";
import { checkCashForPurchase } from "./check-cash-for-purchase";
import { referencePrice } from "./reference-price";
import type { Holding } from "./holding-after-fill";
import type { IdxRules } from "./idx-rules-on";
import { largestAffordableCount } from "./largest-affordable-count";
import { orderTradingDay } from "./order-trading-day";
import type { OrderTradingDay } from "./order-trading-day";
import type {
  OpenOrder,
  Order,
  OrderFailure,
  OrderRequest,
  OrderSide,
} from "./order";
import {
  cashSetAside,
  holdsFreeShares,
  openSales,
  sharesInLots,
  sharesOfStock,
} from "./open-orders";
import { purchaseCost } from "./trading-costs";

/** What an account holds when a student places an order. */
export interface AccountState {
  cash: Rupiah;
  holdings: readonly Holding[];
  /** The orders of the account. The open ones set aside cash and shares. */
  orders: readonly Order[];
}

/** What Portolab knows of the stock of an order and of the market. */
export interface StockState extends StockHistories {
  /** The latest delayed quote of the stock, or undefined while Portolab has none, such as before the first update of prices after the stock joins the stocks that Portolab tracks. */
  quote: StockQuote | undefined;
  /** How many minutes the quotes lag behind the exchange, which sets when the prices of a day are final. */
  delayMinutes: number;
}

/** An order with the shares of its lots. */
interface SizedOrder {
  code: string;
  side: OrderSide;
  lots: OrderLots;
  shares: Shares;
}

/** An order with its shares and the price at which Portolab checks it. */
interface CheckedOrder extends SizedOrder {
  price: Rupiah;
}

/** An account at the moment when the student places an order. */
type AccountAtMoment = AccountState & { moment: Date };

/** Checks an order against the rules of IDX of its trading day and against the account, by the rules of decisions 0015 and 0016, and accepts it as waiting. Its lots come from parseOrderLots with the largest order of the same trading day, which orderTradingDay gives. The caller then checks it against the latest quote with checkOrder, as after every new quote, so an order placed during a session can fill at once. */
export function placeOrder(
  request: OrderRequest,
  account: AccountState,
  stock: StockState,
): Result<OpenOrder, OrderFailure> {
  const day = orderTradingDay(request.placedAt, stock.delayMinutes);
  if (!day.ok) {
    return day;
  }
  const { rules } = day.value;
  const sized: SizedOrder = {
    code: request.code,
    side: request.side,
    lots: request.lots,
    shares: shares(request.lots * rules.lotShares),
  };
  const atMoment: AccountAtMoment = { ...account, moment: request.placedAt };
  const tradable = checkBeforePrice(
    sized,
    { account: atMoment, stock },
    day.value,
  );
  if (!tradable.ok) {
    return tradable;
  }
  const { quote } = stock;
  if (quote === undefined) {
    return fail({ kind: "noPrice", code: request.code });
  }
  const price = checkedPrice(request, { ...stock, quote }, day.value);
  if (!price.ok) {
    return price;
  }
  const order: CheckedOrder = { ...sized, price: price.value };
  const setAside = cashToSetAside(order, atMoment, day.value);
  if (!setAside.ok) {
    return setAside;
  }
  return succeed({
    ...request,
    shares: order.shares,
    tradingDay: day.value.date,
    tradesFrom: day.value.tradesFrom,
    expiresAt: day.value.expiresAt,
    checkedPrice: order.price,
    setAsideCash: setAside.value,
    state: { kind: "waiting" },
  });
}

/** What Portolab knows of the account and of the stock when it checks an order. */
interface OrderContext {
  account: AccountAtMoment;
  stock: StockState;
}

/** Checks what an order needs before its price. A purchase needs a stock that can be bought on its trading day. A sale needs shares that no other open sell order sets aside, which a holding keeps even after its stock leaves the universe. Portolab fetches quotes only for the stocks that it tracks, so these checks come before the quote, and a stock without a quote that fails them gets their text instead of a wait for a price that never comes. */
function checkBeforePrice(
  order: SizedOrder,
  context: OrderContext,
  day: OrderTradingDay,
): Result<undefined, OrderFailure> {
  switch (order.side) {
    case "buy":
      return checkBuyable(order.code, day.date, context.stock);
    case "sell":
      return checkShares(order, context.account, day.rules);
  }
}

/** Checks that the account holds the shares of a sale beyond what its other open sell orders set aside. */
function checkShares(
  order: SizedOrder,
  account: AccountAtMoment,
  rules: IdxRules,
): Result<undefined, OrderFailure> {
  const stock = sharesOfStock(account, order.code, account.moment);
  if (order.shares <= stock.held - stock.setAside.amount) {
    return succeed(undefined);
  }
  return fail({
    kind: "notEnoughShares",
    code: order.code,
    lots: order.lots,
    ...sharesInLots(stock, rules.lotShares),
  });
}

function checkedPrice(
  request: OrderRequest,
  stock: StockState & { quote: StockQuote },
  day: OrderTradingDay,
): Result<Rupiah, OrderFailure> {
  switch (request.price.kind) {
    case "market":
      return succeed(stock.quote.price);
    case "limit": {
      const reference = referencePrice(request.code, stock, day);
      if (!reference.ok) {
        return reference;
      }
      const range = acceptedPriceRange(reference.value, day.rules);
      const price = checkLimitPrice(request.price.limit, range, day.rules);
      if (price.ok) {
        return price;
      }
      // The limits come from the close of the stock before the trading day, so their text names both, but the tick size of a price is the same for every stock.
      switch (price.failure.kind) {
        case "outsideLimits":
          return fail({ ...price.failure, code: request.code, date: day.date });
        case "offTick":
          return fail(price.failure);
      }
    }
  }
}

/** The cash that an order sets aside: none for a sale, and the cost of a purchase at its checked price, which the cash that other open orders leave must pay for. */
function cashToSetAside(
  order: CheckedOrder,
  account: AccountAtMoment,
  day: OrderTradingDay,
): Result<Rupiah, OrderFailure> {
  switch (order.side) {
    case "buy":
      return checkCash(order, account, day);
    case "sell":
      return succeed(rupiah(0));
  }
}

function checkCash(
  order: CheckedOrder,
  account: AccountAtMoment,
  day: OrderTradingDay,
): Result<Rupiah, OrderFailure> {
  const setAside = cashSetAside(account.orders, account.moment);
  const availableCash = rupiah(account.cash - setAside.amount);
  const paid = checkCashForPurchase(order, availableCash, day.rates);
  if (paid.ok) {
    return succeed(purchaseCost(paid.value));
  }
  const { lotShares, minimumPrice } = day.rules;
  return fail({
    kind: "notEnoughCash",
    cash: account.cash,
    setAside,
    largestLots: lots(
      largestAffordableCount(
        availableCash,
        rupiah(order.price * lotShares),
        day.rates,
      ),
    ),
    // Each rupiah of the price of the smallest order adds its shares to its value, so the count of such rupiah that the cash pays for is the highest price of that order.
    highestLotPrice: rupiah(
      largestAffordableCount(
        availableCash,
        rupiah(smallestOrderLots * lotShares),
        day.rates,
      ),
    ),
    minimumPrice,
    holdsFreeShares: holdsFreeShares(account, account.moment),
    sales: openSales(account.orders, account.moment),
    ...paid.failure,
  });
}
