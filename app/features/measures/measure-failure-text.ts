import { marketIndex } from "~/features/market-data/tracked-instruments";
import { formatCalendarDate, formatMonth, formatNumber } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import type { Result } from "~/result";
import { defaultEstimationSettings } from "./estimation-settings";
import { instrumentName } from "./instrument-name";
import type { StoredMeasureFailure } from "./measure-stored.server";
import { monthlyReturnCount } from "./monthly-return-count";

/** What a set of measures belongs to: one stock, or the portfolio of the reader. */
export type MeasuredSubject =
  { kind: "stock"; code: string } | { kind: "portfolio" };

type TooFewReturns = Extract<StoredMeasureFailure, { kind: "tooFewReturns" }>;

/** The text that tells a student why a stock or the portfolio of the student has no measures, with the numbers of the failure, the rule behind it, and when the stored closes give the measures. */
export function measureFailureText(
  failure: StoredMeasureFailure,
  subject: MeasuredSubject,
): string {
  switch (failure.kind) {
    case "tooFewReturns":
      return [
        tooFewReturnsText(failure, subject),
        forecastText(failure.enoughAfterFirstTradingDayOf, subject),
      ].join(" ");
    case "noVariation":
      return m.measures_no_variation_notice({
        code: instrumentName(failure.code),
      });
    case "noRiskFreeRate":
      return m.measures_no_risk_free_rate_notice({
        date: formatCalendarDate(failure.date),
      });
  }
}

/** Why a stock has no measures, in the few words of a cell of a table whose row leads to the page of the stock, which gives the whole text. */
export function shortMeasureFailureText(failure: StoredMeasureFailure): string {
  switch (failure.kind) {
    case "tooFewReturns":
      return m.measures_short_too_few_returns_notice({
        count: formatNumber(failure.count),
        minimum: formatNumber(failure.minimum),
      });
    case "noVariation":
      return m.measures_short_no_variation_notice({
        code: instrumentName(failure.code),
      });
    case "noRiskFreeRate":
      return m.measures_short_no_risk_free_rate_notice({
        date: formatCalendarDate(failure.date),
      });
  }
}

function tooFewReturnsText(
  failure: TooFewReturns,
  subject: MeasuredSubject,
): string {
  const counts = {
    index: marketIndex.code,
    returns: monthlyReturnCount(failure.count),
    window: formatNumber(defaultEstimationSettings.returnCount),
    minimum: monthlyReturnCount(failure.minimum),
  };
  switch (subject.kind) {
    case "stock":
      return m.measures_stock_too_few_returns_notice({
        ...counts,
        code: subject.code,
      });
    case "portfolio":
      return m.measures_portfolio_too_few_returns_notice({
        ...counts,
        code: instrumentName(failure.code),
      });
  }
}

function forecastText(
  forecast: Result<string, { code: string }>,
  subject: MeasuredSubject,
): string {
  if (!forecast.ok) {
    return m.measures_no_price_history_notice({
      instrument: instrumentName(forecast.failure.code),
    });
  }
  const month = formatMonth(forecast.value);
  switch (subject.kind) {
    case "stock":
      return m.measures_stock_enough_returns_notice({
        code: subject.code,
        index: marketIndex.code,
        month,
      });
    case "portfolio":
      return m.measures_portfolio_enough_returns_notice({
        index: marketIndex.code,
        month,
      });
  }
}
