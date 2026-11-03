import {
  currentOrNextSessionStart,
  pricesFinalAt,
  tradingDayBefore,
} from "~/features/market-data/idx-calendar";
import { fail, failuresOf, succeed } from "~/result";
import type { Result } from "~/result";
import { wibDateOf } from "~/wib";
import { idxRulesOn } from "./idx-rules-on";
import type { IdxRules } from "./idx-rules-on";
import type { OrderFailure } from "./order";
import { costRatesOn } from "./trading-costs";
import type { CostRates } from "./trading-costs";

/** The trading day of an order and the rules and costs of that day. */
export interface OrderTradingDay {
  date: string;
  tradesFrom: Date;
  expiresAt: Date;
  /** The trading day before it. Before the first quote of the trading day, the stored close of this day is the reference price. */
  previousDate: string;
  rules: IdxRules;
  rates: CostRates;
}

/** Why Portolab cannot check an order placed at a moment against its trading day, which is a record of that day that Portolab lacks. */
export type TradingDayFailure = Extract<
  OrderFailure,
  { kind: "missingRules" | "missingCosts" }
>;

/** The trading day of an order placed at a moment, which is the day of the session of continuous trading that is open then or opens next, with the rules of IDX and the costs of that day. It fails when a record that the day needs is missing. The order form reads the largest order from its rules before it parses the lots, and placeOrder checks the order against the same day. */
export function orderTradingDay(
  placedAt: Date,
  delayMinutes: number,
): Result<OrderTradingDay, TradingDayFailure> {
  const tradesFrom = currentOrNextSessionStart(placedAt);
  if (!tradesFrom.ok) {
    return fail({ kind: "missingRules", reason: tradesFrom.failure });
  }
  const date = wibDateOf(tradesFrom.value);
  const expiresAt = pricesFinalAt(date, delayMinutes);
  const previousDate = tradingDayBefore(date);
  const rules = idxRulesOn(date);
  const rates = costRatesOn(date);
  // A failure has one text, and the texts of missing rules and missing costs offer the same step, so when both lack a record the student reads about the rules, and the reason for the log names both.
  if (!expiresAt.ok || !previousDate.ok || !rules.ok) {
    return fail({
      kind: "missingRules",
      reason: failuresOf([expiresAt, previousDate, rules, rates]).join(" "),
    });
  }
  if (!rates.ok) {
    return fail({ kind: "missingCosts", reason: rates.failure });
  }
  return succeed({
    date,
    tradesFrom: tradesFrom.value,
    expiresAt: expiresAt.value,
    previousDate: previousDate.value,
    rules: rules.value,
    rates: rates.value,
  });
}
