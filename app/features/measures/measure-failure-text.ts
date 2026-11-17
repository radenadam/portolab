import { marketIndex } from "~/features/market-data/tracked-instruments";
import {
  recordsStepForReader,
  textForReader,
} from "~/features/trading/text-for-reader";
import type { RecordsReader } from "~/features/trading/text-for-reader";
import {
  formatBeta,
  formatCalendarDate,
  formatMonth,
  formatNumber,
} from "~/formatting";
import { m } from "~/paraglide/messages.js";
import type { Result } from "~/result";
import { defaultEstimationSettings } from "./estimation-settings";
import { instrumentName } from "./instrument-name";
import type { NoPortfolioVariation } from "./measure-portfolio";
import type { StoredMeasureFailure } from "./measure-stored.server";
import { monthlyReturnCount } from "./monthly-return-count";
import type { BetaNotPositive } from "./performance-ratios";

/** The subject keeps the forecast and the next step specific to the calculation and its reader. */
export type MeasuredSubject =
  | { kind: "stock"; code: string; reader?: RecordsReader }
  | { kind: "portfolio"; reader: Parameters<typeof textForReader>[0] }
  | { kind: "correlation"; reader?: RecordsReader }
  | { kind: "market"; reader?: RecordsReader };

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

// Stored measures wait for orders or history, but a hypothetical allocation can change through its sliders.
export function riskMeasureFailureText(
  failure: NoPortfolioVariation | BetaNotPositive,
  calculation: "portfolio" | "allocation" = "portfolio",
): string {
  switch (failure.kind) {
    case "noPortfolioVariation":
      return calculation === "allocation"
        ? m.measures_no_allocation_variation_notice()
        : m.measures_no_portfolio_variation_notice();
    case "betaNotPositive":
      return calculation === "allocation"
        ? m.measures_allocation_beta_not_positive_notice({
            beta: formatBeta(failure.beta),
          })
        : m.measures_treynor_beta_not_positive_notice({
            beta: formatBeta(failure.beta),
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
    case "market":
      return m.measures_line_too_few_returns_notice(counts);
    case "correlation":
      return m.measures_correlation_too_few_notice(counts);
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
    case "market":
      return m.measures_line_enough_returns_notice(forecastInputs);
    case "correlation":
      return m.measures_correlation_enough_returns_notice(forecastInputs);
  }
}

function noRiskFreeRateText(date: string, subject: MeasuredSubject): string {
  return recordsStepForReader(subject.reader ?? { kind: "owner" }, {
    student: () => m.measures_no_risk_free_rate_notice({ date }),
    lecturer: () => m.measures_lecturer_no_risk_free_rate_notice({ date }),
  });
}
