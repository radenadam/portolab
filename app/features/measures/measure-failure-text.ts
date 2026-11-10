import { marketIndex } from "~/features/market-data/tracked-instruments";
import { textForReader } from "~/features/trading/text-for-reader";
import type { PortfolioReader } from "~/features/trading/text-for-reader";
import { formatCalendarDate, formatMonth, formatNumber } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import type { Result } from "~/result";
import { defaultEstimationSettings } from "./estimation-settings";
import { instrumentName } from "./instrument-name";
import type { StoredMeasureFailure } from "./measure-stored.server";
import { monthlyReturnCount } from "./monthly-return-count";

/** What a set of measures belongs to: one stock, which a student reads, or a portfolio, which its owner or the lecturer of the class reads. */
export type MeasuredSubject =
  | { kind: "stock"; code: string }
  | { kind: "portfolio"; reader: PortfolioReader };

type TooFewReturns = Extract<StoredMeasureFailure, { kind: "tooFewReturns" }>;

/** The text that tells its reader why a stock or a portfolio has no measures, with the numbers of the failure, the rule behind it, and when the stored closes give the measures. */
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
      return noRiskFreeRateText(formatCalendarDate(failure.date), subject);
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
    case "portfolio": {
      const code = instrumentName(failure.code);
      return textForReader(subject.reader, {
        owner: () =>
          m.measures_portfolio_too_few_returns_notice({ ...counts, code }),
        lecturer: (name) =>
          m.measures_lecturer_too_few_returns_notice({
            ...counts,
            code,
            name,
          }),
      });
    }
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
  const forecastInputs = {
    index: marketIndex.code,
    month: formatMonth(forecast.value),
  };
  switch (subject.kind) {
    case "stock":
      return m.measures_stock_enough_returns_notice({
        ...forecastInputs,
        code: subject.code,
      });
    case "portfolio":
      return textForReader(subject.reader, {
        owner: () => m.measures_portfolio_enough_returns_notice(forecastInputs),
        lecturer: (name) =>
          m.measures_lecturer_enough_returns_notice({
            ...forecastInputs,
            name,
          }),
      });
  }
}

function noRiskFreeRateText(date: string, subject: MeasuredSubject): string {
  switch (subject.kind) {
    case "stock":
      return m.measures_no_risk_free_rate_notice({ date });
    case "portfolio":
      return textForReader(subject.reader, {
        owner: () => m.measures_no_risk_free_rate_notice({ date }),
        lecturer: () => m.measures_lecturer_no_risk_free_rate_notice({ date }),
      });
  }
}
