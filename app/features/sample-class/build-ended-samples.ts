import {
  buildSampleTrade,
  checkSampleTrade,
} from "~/features/trading/sample-trades";
import type { SampleTrade } from "~/features/trading/sample-trades";
import type { AccountState } from "~/features/trading/place-order";
import type { OrderRequest } from "~/features/trading/order";
import { acceptedPriceRange } from "~/features/trading/accepted-prices";

import { orderTradingDay } from "~/features/trading/order-trading-day";
import { isOrderLots } from "~/units/lots";

import { minuteMilliseconds } from "~/time-units";
import { wibDateOf, wibMoment } from "~/wib";
import { fail, succeed } from "~/result";
import type { Result } from "~/result";

import { stockAt, sizeFor, tradeAtClose } from "./sample-trade-context";
import type { SampleRecipe } from "./sample-trade-context";
export function buildEndedSamples(
  recipe: SampleRecipe,
  account: AccountState,
): Result<SampleTrade[], string> {
  const rejected = rejectedSample(recipe, account);
  if (!rejected.ok) return rejected;
  const stock = recipe.stocks.find(
    (candidate) => candidate.history.code === rejected.value.accepted.code,
  );
  const quote = stock?.quotes.at(-1);
  if (stock === undefined || quote === undefined)
    throw new Error("The rejected sample order has no stock.");
  const day = orderTradingDay(quote.quotedAt, recipe.delayMinutes);
  if (!day.ok) return fail(JSON.stringify(day.failure));
  const limit = acceptedPriceRange(quote.previousClose, day.value.rules).lowest;
  if (limit >= quote.price)
    return fail("The stored closes have no unreached sample purchase limit.");
  const count = 1;
  if (!isOrderLots(count)) throw new Error("One is not an order lot.");
  const request: Omit<OrderRequest, "code" | "placedAt"> = {
    side: "buy",
    lots: count,
    price: { kind: "limit", limit },
    reason:
      "Saya memasang batas harga dan mengamati order yang tidak mencapai batas itu.",
  };
  const cancellation = tradeAtClose(recipe, account, {
    stock,
    quote,
    ...request,
    minutesBeforeQuote: 3,
  });
  if (!cancellation.ok) return cancellation;
  const cancelled: SampleTrade = {
    ...cancellation.value,
    state: {
      kind: "cancelled",
      cancelledAt: new Date(quote.quotedAt.getTime() - 2 * minuteMilliseconds),
    },
  };
  const placed = tradeAtClose(recipe, account, { stock, quote, ...request });
  if (!placed.ok) return placed;
  const resting = placed.value;
  if (resting.state.kind !== "resting")
    return fail(
      `The sample limit order of ${quote.code} did not rest at its limit.`,
    );
  const expired = checkSampleTrade(
    {
      ...resting,
      accepted: { ...resting.accepted, state: resting.state },
    },
    account,
    { quote, now: day.value.expiresAt },
  );
  return succeed([rejected.value, cancelled, expired]);
}

function rejectedSample(
  recipe: SampleRecipe,
  account: AccountState,
): Result<SampleTrade, string> {
  for (const stock of recipe.stocks) {
    for (const [index, quote] of stock.quotes.entries()) {
      // The maximum purchase must have released its cash before the later limit orders are placed.
      if (index === stock.quotes.length - 1) continue;
      const previous = stock.quotes[index - 1];
      if (previous === undefined || previous.price >= quote.price) continue;
      const lastOrder = account.orders.at(-1);
      if (lastOrder !== undefined && previous.quotedAt <= lastOrder.placedAt)
        continue;
      const placedAt = wibMoment(wibDateOf(previous.quotedAt), 18 * 60);
      const lots = sizeFor(
        account.cash,
        { price: previous.price, placedAt },
        recipe,
      );
      if (!lots.ok) continue;
      const placed = buildSampleTrade(
        {
          code: quote.code,
          side: "buy",
          lots: lots.value,
          price: { kind: "market" },
          reason:
            "Saya menggunakan kas yang tersedia dan mengamati risiko kenaikan harga sebelum order terisi.",
          placedAt,
        },
        account,
        stockAt(stock, previous, recipe),
      );
      if (!placed.ok) continue;
      const checked = checkSampleTrade(placed.value, account, {
        quote,
        now: new Date(
          quote.quotedAt.getTime() + recipe.delayMinutes * minuteMilliseconds,
        ),
      });
      if (checked.state.kind === "rejected") return succeed(checked);
    }
  }
  return fail(
    "The sample needs consecutive closes that reject a maximum purchase, followed by another stored trading day for its limit orders. Update price history and run the command again.",
  );
}
