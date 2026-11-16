import type { StockQuote } from "~/features/market-data/price-source.server";
import type { StockState, AccountState } from "./place-order";
import { placeOrder } from "./place-order";
import { checkOrder } from "./check-order";
import type { OpenOrder, OrderRequest, OrderState } from "./order";
import { holdingAfterFill } from "./holding-after-fill";
import { cashSetAside, sharesOfStock } from "./open-orders";
import { rupiah } from "~/units/rupiah";
import { fail, succeed } from "~/result";
import type { Result } from "~/result";
import { minuteMilliseconds } from "~/time-units";

export interface SampleTrade {
  accepted: OpenOrder;
  state: OrderState;
}

/** The recipe and its persistence replay the same fills, so cash and average costs use the engine in both places. */
export function applySampleFill(
  account: AccountState,
  trade: SampleTrade,
): AccountState {
  const { accepted, state } = trade;
  if (state.kind !== "filled")
    return { ...account, orders: [...account.orders, { ...accepted, state }] };
  const holding = holdingAfterFill(
    account.holdings.find((held) => held.code === accepted.code),
    accepted,
    state.fill,
  );
  return {
    cash: rupiah(account.cash + state.fill.cashChange),
    holdings: [
      ...account.holdings.filter((held) => held.code !== holding.code),
      ...(holding.shares === 0 ? [] : [holding]),
    ],
    orders: [...account.orders, { ...accepted, state }],
  };
}

export function buildSampleTrade(
  request: OrderRequest,
  account: AccountState,
  stock: StockState & { quote: StockQuote },
): Result<SampleTrade, string> {
  const accepted = placeOrder(request, account, stock);
  if (!accepted.ok)
    return fail(
      `The sample order of ${request.code} at ${request.placedAt.toISOString()} failed the engine check: ${JSON.stringify(accepted.failure)}.`,
    );
  return succeed({ accepted: accepted.value, state: accepted.value.state });
}

export function placeAndCheckSampleTrade(
  request: OrderRequest,
  account: AccountState,
  stock: StockState & { quote: StockQuote },
): Result<SampleTrade, string> {
  const placed = buildSampleTrade(request, account, stock);
  if (!placed.ok) return placed;
  return succeed(
    checkSampleTrade(placed.value, account, {
      quote: stock.quote,
      now: new Date(
        stock.quote.quotedAt.getTime() +
          stock.delayMinutes * minuteMilliseconds,
      ),
    }),
  );
}

export function checkSampleTrade(
  trade: SampleTrade,
  account: AccountState,
  check: { quote: StockQuote | undefined; now: Date },
): SampleTrade {
  return {
    ...trade,
    state: checkOrder({
      order: trade.accepted,
      quote: check.quote,
      moment: check.now,
      availableCash: rupiah(
        account.cash - cashSetAside(account.orders, check.now).amount,
      ),
      sharesOfStock: sharesOfStock(account, trade.accepted.code, check.now),
    }),
  };
}
