import {
  buildSampleTrade,
  placeAndCheckSampleTrade,
  applySampleFill,
} from "~/features/trading/sample-trades";
import type { SampleTrade } from "~/features/trading/sample-trades";
import type { AccountState } from "~/features/trading/place-order";

import { orderTradingDay } from "~/features/trading/order-trading-day";
import { isOrderLots } from "~/units/lots";
import { rupiah } from "~/units/rupiah";

import { minuteMilliseconds } from "~/time-units";

import { fail, succeed } from "~/result";
import type { Result } from "~/result";
import type { SampleStock } from "./read-sample-market.server";

import { stockAt, sizeFor, tradeAtClose } from "./sample-trade-context";
import type { SampleRecipe } from "./sample-trade-context";
import { buildEndedSamples } from "./build-ended-samples";
import {
  sampleCoreStocks,
  sampleConcentratedSectors,
} from "./sample-portfolio-recipes";
const purchaseReasons = [
  "Saya menguji portofolio yang berfokus pada satu sektor dan membandingkan risikonya dengan IHSG.",
  "Saya membagi modal ke beberapa sektor untuk mengamati perubahan risiko portofolio.",
  "Saya menambah posisi secara bertahap dan akan memeriksa beta serta biaya transaksinya.",
];

function buyStocks(recipe: SampleRecipe, index: number): SampleStock[] {
  if (index === 0)
    return sampleCoreStocks.flatMap((code) => {
      const stock = recipe.stocks.find(
        (candidate) => candidate.history.code === code,
      );
      return stock === undefined ? [] : [stock];
    });
  const sector =
    sampleConcentratedSectors[index % (sampleConcentratedSectors.length + 2)];
  const group =
    sector === undefined
      ? [...recipe.stocks]
      : recipe.stocks.filter((stock) => stock.sector === sector);
  const rotated = [
    ...group.slice(index % group.length),
    ...group.slice(0, index % group.length),
  ];
  return rotated.slice(
    0,
    sector === undefined ? 3 + (index % 3) : 1 + (index % 3),
  );
}

/** Sharing the recipe keeps the demonstration under the same order checks as the students. */
export function buildSamplePortfolio(
  recipe: SampleRecipe,
  index: number,
): Result<SampleTrade[], string> {
  const selected = buyStocks(recipe, index);
  if (selected.length === 0)
    return fail(
      "The stored closes must include measured bank, mining, and energy stocks for the sample portfolios.",
    );
  const trades: SampleTrade[] = [];
  let account: AccountState = {
    cash: recipe.startingCash,
    holdings: [],
    orders: [],
  };
  const purchases = selected
    .map((stock, position) => {
      const quote =
        stock.quotes[
          (index + position) % Math.max(1, Math.floor(stock.quotes.length / 2))
        ];
      if (quote === undefined)
        throw new Error("A sample stock has no replayable close.");
      return { stock, quote, position };
    })
    .toSorted(
      (first, second) =>
        first.quote.quotedAt.getTime() - second.quote.quotedAt.getTime(),
    );
  for (const { stock, quote, position } of purchases) {
    const budget = rupiah(
      Math.floor(
        (recipe.startingCash * (0.65 + (index % 5) * 0.06)) / selected.length,
      ),
    );
    const sized = sizeFor(
      budget,
      { price: quote.price, placedAt: quote.quotedAt },
      recipe,
    );
    if (!sized.ok)
      return fail(
        `The sample purchase of ${quote.code} has no affordable lot.`,
      );
    const placed = tradeAtClose(recipe, account, {
      stock,
      quote,
      side: "buy",
      lots: sized.value,
      price: { kind: "market" },
      reason: purchaseReasons[(index + position) % purchaseReasons.length],
    });
    if (!placed.ok) return placed;
    const trade = placed.value;
    if (trade.state.kind !== "filled")
      return fail(
        `The stored close did not fill the sample purchase of ${quote.code}.`,
      );
    trades.push(trade);
    account = applySampleFill(account, trade);
  }
  const extras = sampleExtras(recipe, { selected, account, index });
  return extras.ok ? succeed([...trades, ...extras.value]) : extras;
}

function sampleExtras(
  recipe: SampleRecipe,
  {
    selected,
    account: initial,
    index,
  }: { selected: SampleStock[]; account: AccountState; index: number },
): Result<SampleTrade[], string> {
  const stock = selected[0];
  if (stock === undefined)
    throw new Error("A sample portfolio has no selected stock.");
  const quote = stock.quotes.at(-1);
  if (quote === undefined)
    throw new Error("A sample stock has no replayable close.");
  let account = initial;
  const trades: SampleTrade[] = [];
  if (index % 2 === 0 && index !== 0) {
    const sale = sampleSale(recipe, account, { stock, quote });
    if (!sale.ok) return sale;
    const filled = sale.value;
    trades.push(filled);
    account = applySampleFill(account, filled);
  }
  if (index === 0) {
    const ended = buildEndedSamples(recipe, account);
    if (!ended.ok) return ended;
    trades.push(...ended.value);
    for (const trade of ended.value) account = applySampleFill(account, trade);
  }
  if (index % 4 === 0) {
    const placed = sampleWaitingOrder(recipe, account, stock);
    if (!placed.ok) return placed;
    trades.push(placed.value);
  }
  return succeed(trades);
}

function sampleWaitingOrder(
  recipe: SampleRecipe,
  account: AccountState,
  preferred: SampleStock,
): Result<SampleTrade, string> {
  // A past holding may have left the LQ45 before today's purchase.
  const candidates = [
    preferred,
    ...recipe.stocks.filter(
      (stock) => stock.history.code !== preferred.history.code,
    ),
  ];
  let failure = `The sample portfolio has ${String(account.cash)} rupiah but no affordable current purchase.`;
  for (const stock of candidates) {
    const current = recipe.currentQuotes.get(stock.history.code);
    if (current === undefined)
      throw new Error(
        `The sample recipe has no current quote of ${stock.history.code}.`,
      );
    const lots = sizeFor(
      account.cash,
      { price: current.price, placedAt: recipe.now },
      recipe,
    );
    if (!lots.ok) {
      failure =
        lots.failure.kind === "noAffordableLots"
          ? `The sample portfolio has ${String(account.cash)} rupiah, which pays for no whole lot of ${current.code} at ${String(current.price)} rupiah.`
          : JSON.stringify(lots.failure);
      continue;
    }
    const count = Math.min(2, lots.value);
    if (!isOrderLots(count))
      throw new Error("The sample open order has no whole lot.");
    const placed = buildSampleTrade(
      {
        code: current.code,
        side: "buy",
        lots: count,
        price: { kind: "market" },
        reason:
          "Saya menambah posisi kecil untuk mengamati pelaksanaan order pada harga tertunda berikutnya.",
        placedAt: recipe.now,
      },
      account,
      {
        ...stockAt(stock, current, recipe),
        closes: stock.history,
        marketCloses: recipe.marketCloses,
      },
    );
    if (placed.ok) return placed;
    failure = placed.failure;
  }
  return fail(failure);
}

function sampleSale(
  recipe: SampleRecipe,
  account: AccountState,
  {
    stock,
    quote,
  }: { stock: SampleStock; quote: SampleStock["quotes"][number] },
): Result<SampleTrade, string> {
  const day = orderTradingDay(quote.quotedAt, recipe.delayMinutes);
  if (!day.ok) return fail(JSON.stringify(day.failure));
  const held = account.holdings.find((holding) => holding.code === quote.code);
  const count = Math.max(
    1,
    Math.floor(
      (held === undefined ? 0 : held.shares) / day.value.rules.lotShares / 3,
    ),
  );
  if (!isOrderLots(count)) throw new Error("A sample sale has no whole lot.");
  const sale = placeAndCheckSampleTrade(
    {
      code: quote.code,
      side: "sell",
      lots: count,
      price: { kind: "market" },
      reason:
        "Saya mengurangi bobot posisi ini untuk melihat perubahan risiko dan biaya penjualan.",
      placedAt: new Date(quote.quotedAt.getTime() - minuteMilliseconds),
    },
    account,
    stockAt(stock, quote, recipe),
  );
  if (!sale.ok) return sale;
  const filled = sale.value;
  return succeed(filled);
}
