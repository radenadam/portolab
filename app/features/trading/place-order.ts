import { startOfMonth } from "~/calendar-dates";
import {
  currentOrNextSessionStart,
  pricesFinalAt,
  tradingDayBefore,
} from "~/features/market-data/idx-calendar";
import type { StockQuote } from "~/features/market-data/price-source.server";
import { universeOn } from "~/features/market-data/tracked-instruments";
import { countReturns } from "~/features/measures/aligned-returns";
import type { InstrumentCloses } from "~/features/measures/aligned-returns";
import { defaultEstimationSettings } from "~/features/measures/estimation-settings";
import { fail, failuresOf, succeed } from "~/result";
import type { Result } from "~/result";
import { lots } from "~/units/lots";
import type { OrderLots } from "~/units/lots";
import { rupiah } from "~/units/rupiah";
import type { Rupiah } from "~/units/rupiah";
import { shares } from "~/units/shares";
import type { Shares } from "~/units/shares";
import { wibDateOf } from "~/wib";
import { acceptedPriceRange, checkLimitPrice } from "./accepted-prices";
import { checkCashForPurchase } from "./check-cash-for-purchase";
import type { Holding } from "./holding-after-fill";
import { idxRulesOn } from "./idx-rules-on";
import type { IdxRules } from "./idx-rules-on";
import type {
  OpenOrder,
  Order,
  OrderFailure,
  OrderRequest,
  OrderSide,
} from "./order";
import { cashSetAside, sharesSetAside } from "./open-orders";
import { costRatesOn, purchaseCost } from "./trading-costs";
import type { CostRates } from "./trading-costs";

/** What an account holds when a student places an order. */
export interface AccountState {
  cash: Rupiah;
  holdings: readonly Holding[];
  /** The orders of the account. The open ones set aside cash and shares. */
  orders: readonly Order[];
}

/** What Portolab knows of the stock of an order and of the market. */
export interface StockState {
  /** The latest delayed quote of the stock, or undefined while Portolab has none. */
  quote: StockQuote | undefined;
  /** How many minutes the quotes lag behind the exchange, which sets when the prices of a day are final. */
  delayMinutes: number;
  /** The stored final daily closes of the stock and of the market. They give the monthly returns that the measures can use and the reference price of the auto rejection limits. */
  closes: InstrumentCloses;
  marketCloses: InstrumentCloses;
}

/** The trading day of an order and its rules. */
interface TradingDay {
  date: string;
  tradesFrom: Date;
  expiresAt: Date;
  /** The trading day before it, whose close is the reference price, and when the prices of that day are final. */
  previousDate: string;
  previousFinalAt: Date;
  rules: IdxRules;
  rates: CostRates;
}

/** An order with its shares and the price at which Portolab checks it. */
interface CheckedOrder {
  code: string;
  side: OrderSide;
  lots: OrderLots;
  shares: Shares;
  price: Rupiah;
}

/** Checks an order against the rules of IDX of its trading day and against the account, by the rules of decisions 0015 and 0016, and accepts it as waiting. The caller then checks it against the latest quote with checkOrder, as after every new quote, so an order placed during a session can fill at once. */
export function placeOrder(
  request: OrderRequest,
  account: AccountState,
  stock: StockState,
): Result<OpenOrder, OrderFailure> {
  const day = tradingDayOf(request.placedAt, stock.delayMinutes);
  if (!day.ok) {
    return day;
  }
  const { quote } = stock;
  if (quote === undefined) {
    return fail({ kind: "noPrice", code: request.code });
  }
  const tradable = checkStock(request, day.value.date, stock);
  if (!tradable.ok) {
    return tradable;
  }
  const { rules } = day.value;
  if (request.lots > rules.maximumLots) {
    return fail({
      kind: "tooManyLots",
      lots: request.lots,
      maximumLots: rules.maximumLots,
    });
  }
  const price = checkedPrice(
    request,
    { quote, closes: stock.closes },
    day.value,
  );
  if (!price.ok) {
    return price;
  }
  const order: CheckedOrder = {
    code: request.code,
    side: request.side,
    lots: request.lots,
    shares: shares(request.lots * rules.lotShares),
    price: price.value,
  };
  const setAside = checkFunds(
    order,
    { ...account, moment: request.placedAt },
    day.value,
  );
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

function tradingDayOf(
  placedAt: Date,
  delayMinutes: number,
): Result<TradingDay, OrderFailure> {
  const tradesFrom = currentOrNextSessionStart(placedAt);
  if (!tradesFrom.ok) {
    return fail({ kind: "missingRules", reason: tradesFrom.failure });
  }
  const date = wibDateOf(tradesFrom.value);
  const expiresAt = pricesFinalAt(date, delayMinutes);
  const previousDate = tradingDayBefore(date);
  const rules = idxRulesOn(date);
  const rates = costRatesOn(date);
  if (!expiresAt.ok || !previousDate.ok || !rules.ok || !rates.ok) {
    return fail({
      kind: "missingRules",
      reason: failuresOf([expiresAt, previousDate, rules, rates]).join(" "),
    });
  }
  // The search for the previous trading day found its calendar, so the calendar covers it.
  const previousFinalAt = pricesFinalAt(previousDate.value, delayMinutes);
  if (!previousFinalAt.ok) {
    throw new Error(
      `tradingDayBefore found ${previousDate.value} in the calendar, but ${previousFinalAt.failure}`,
    );
  }
  return succeed({
    date,
    tradesFrom: tradesFrom.value,
    expiresAt: expiresAt.value,
    previousDate: previousDate.value,
    previousFinalAt: previousFinalAt.value,
    rules: rules.value,
    rates: rates.value,
  });
}

/** Checks that the stock of a purchase can be bought on its trading day. A sale needs only the shares, which a holding keeps even after its stock leaves the universe. */
function checkStock(
  request: OrderRequest,
  date: string,
  stock: StockState,
): Result<undefined, OrderFailure> {
  switch (request.side) {
    case "buy":
      return checkBuyable(request.code, date, stock);
    case "sell":
      return succeed(undefined);
  }
}

function checkBuyable(
  code: string,
  date: string,
  stock: StockState,
): Result<undefined, OrderFailure> {
  const universe = universeOn(date);
  if (!universe.ok) {
    return fail({ kind: "missingRules", reason: universe.failure });
  }
  if (!universe.value.includes(code)) {
    return fail({ kind: "outsideUniverse", code, date });
  }
  const returns = countReturns(
    stock.closes,
    stock.marketCloses,
    defaultEstimationSettings,
  );
  if (returns.windowEnd === undefined) {
    return fail({
      kind: "noPriceHistory",
      code,
      instrument: stock.marketCloses.code,
    });
  }
  if (stock.closes.closes.length === 0) {
    return fail({ kind: "noPriceHistory", code, instrument: code });
  }
  if (returns.count < returns.minimum) {
    // The return of a month counts once the market has a close in the next month, so the last missing return arrives when the first trading day after its month closes.
    const missing = returns.minimum - returns.count;
    return fail({
      kind: "tooFewReturns",
      code,
      count: returns.count,
      minimum: returns.minimum,
      enoughAfterFirstTradingDayOf: startOfMonth(
        returns.windowEnd,
        missing + 1,
      ),
    });
  }
  return succeed(undefined);
}

/** The reference price of the auto rejection limits of a trading day, which is the stored close of the stock on the trading day before it. */
function referencePrice(
  code: string,
  closes: InstrumentCloses,
  day: TradingDay,
): Result<Rupiah, OrderFailure> {
  const close = closes.closes.find(
    (candidate) => candidate.date === day.previousDate,
  );
  if (close === undefined) {
    return fail({
      kind: "noReferenceClose",
      code,
      date: day.previousDate,
      finalAt: day.previousFinalAt,
    });
  }
  // A close that a later split adjusted can hold a fraction of a rupiah, but a reference price is whole.
  return succeed(rupiah(Math.round(close.close)));
}

function checkedPrice(
  request: OrderRequest,
  stock: { quote: StockQuote; closes: InstrumentCloses },
  day: TradingDay,
): Result<Rupiah, OrderFailure> {
  switch (request.price.kind) {
    case "market":
      return succeed(stock.quote.price);
    case "limit": {
      const reference = referencePrice(request.code, stock.closes, day);
      if (!reference.ok) {
        return reference;
      }
      const range = acceptedPriceRange(reference.value, day.rules);
      const price = checkLimitPrice(request.price.limit, range, day.rules);
      if (!price.ok) {
        return fail({ ...price.failure, code: request.code, date: day.date });
      }
      return price;
    }
  }
}

/** Checks that the account can pay for a purchase, or holds the shares of a sale, beyond what its other orders set aside, and gives the cash that the order sets aside. */
function checkFunds(
  order: CheckedOrder,
  account: AccountState & { moment: Date },
  day: TradingDay,
): Result<Rupiah, OrderFailure> {
  switch (order.side) {
    case "buy": {
      const setAside = cashSetAside(account.orders, account.moment);
      const paid = checkCashForPurchase(
        order,
        rupiah(account.cash - setAside),
        day.rates,
      );
      if (!paid.ok) {
        return fail({
          kind: "notEnoughCash",
          cash: account.cash,
          setAsideCash: setAside,
          holdsShares: account.holdings.some((holding) => holding.shares > 0),
          ...paid.failure,
        });
      }
      return succeed(purchaseCost(paid.value));
    }
    case "sell": {
      const held =
        account.holdings.find((holding) => holding.code === order.code)
          ?.shares ?? 0;
      const setAside = sharesSetAside(
        account.orders,
        order.code,
        account.moment,
      );
      if (order.shares <= held - setAside) {
        return succeed(rupiah(0));
      }
      const { lotShares } = day.rules;
      return fail({
        kind: "notEnoughShares",
        code: order.code,
        lots: order.lots,
        heldLots: lots(Math.floor(held / lotShares)),
        setAsideLots: lots(Math.floor(setAside / lotShares)),
      });
    }
  }
}
