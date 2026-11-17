import { defaultEstimationSettings } from "~/features/measures/estimation-settings";
import { measureTrade } from "~/features/measures/measure-trade";
import type { TradeImpact } from "~/features/measures/measure-trade";
import { forecastEnoughReturns } from "~/features/measures/forecast-enough-returns";
import { measureValuedPortfolio } from "~/features/measures/measure-valued-portfolio";
import { monthSpanOf } from "~/features/measures/month-span";
import type { MonthSpan } from "~/features/measures/month-span";
import type { StoredMeasureFailure } from "~/features/measures/measure-stored.server";
import { fail, succeed } from "~/result";
import type { Result } from "~/result";
import { rupiah } from "~/units/rupiah";
import type { readTradePortfolio } from "./read-trade-portfolio.server";
import type { OrderFailure, OrderRequest } from "./order";
import type { OrderTradingDay } from "./order-trading-day";
import { placeOrderOnDay } from "./place-order-on-day";

export type TradePortfolio = Extract<
  ReturnType<typeof readTradePortfolio>,
  { ok: true }
>["value"];
export type TradePreview = Result<
  {
    impact: TradeImpact;
    originalMonths: MonthSpan | undefined;
  },
  | { kind: "order"; failure: OrderFailure }
  | { kind: "measures"; failure: StoredMeasureFailure }
>;

/** A preview shares every placement check with placeOrder, but saves nothing and never fills an order. */
export function previewTrade(
  portfolio: TradePortfolio,
  request: OrderRequest,
  {
    day,
    quote,
  }: {
    day: OrderTradingDay;
    quote: Parameters<typeof placeOrderOnDay>[2]["stock"]["quote"];
  },
): TradePreview {
  const traded = portfolio.stocks.find((stock) => stock.code === request.code);
  if (traded === undefined)
    throw new Error(`The trade portfolio lacks ${request.code}.`);
  const order = placeOrderOnDay(request, portfolio.account, {
    stock: {
      quote,
      closes: { kind: "stock", code: traded.code, closes: traded.closes },
      buyable: traded.buyable,
    },
    day,
  });
  if (!order.ok) return fail({ kind: "order", failure: order.failure });
  const against = {
    market: portfolio.market,
    settings: defaultEstimationSettings,
  };
  const measured = measureTrade(
    { stocks: portfolio.stocks, cash: portfolio.account.cash },
    { order: order.value, rates: day.rates },
    against,
  );
  if (!measured.ok) {
    const failure = measured.failure;
    return fail({
      kind: "measures",
      failure:
        failure.kind === "tooFewReturns"
          ? {
              ...failure,
              enoughAfterFirstTradingDayOf: forecastEnoughReturns(
                portfolio.stocks,
                portfolio.market,
                defaultEstimationSettings,
              ),
            }
          : failure,
    });
  }
  const original = measureValuedPortfolio(
    {
      cash: portfolio.account.cash,
      holdings: portfolio.stocks
        .filter((stock) => stock.shares > 0)
        .map((stock) => ({
          ...stock,
          value: rupiah(stock.price * stock.shares),
        })),
    },
    portfolio.market,
    defaultEstimationSettings,
  );
  return succeed({
    impact: measured.value,
    originalMonths:
      original.ok && portfolio.account.holdings.length > 0
        ? monthSpanOf(original.value.market.returns)
        : undefined,
  });
}
