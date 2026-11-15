import { medianOf } from "./median-of";
import { wibDateOf } from "~/wib";
import { marketIndex } from "~/features/market-data/tracked-instruments";
import {
  formatBeta,
  formatNumber,
  formatPercent,
  formatSignedPercent,
} from "~/formatting";
import { measureRiskFreeRate } from "~/features/measures/measure-risk-free-rate";
import { portfolioWeight } from "~/units/portfolio-weight";
import { cumulativeReturn } from "~/units/cumulative-return";
import { beta } from "~/units/beta";
import { m } from "~/paraglide/messages.js";
import type { TeachingStudent } from "./class-teaching";
import type { classSummary } from "./class-summary";
import { extremeOf } from "./extreme-of";

export function futuresQuestions(
  students: readonly TeachingStudent[],
  summary: ReturnType<typeof classSummary>,
): string[] {
  return [
    summary.marketReturn === undefined
      ? m.classes_futures_market_pending_notice()
      : m.classes_futures_market_notice({
          change: formatSignedPercent(summary.marketReturn).text,
          index: marketIndex.code,
        }),
    students.some((student) => student.risk !== undefined)
      ? m.classes_futures_beta_notice({
          beta: summary.medianBeta,
          zero: formatBeta(beta(0)),
        })
      : m.classes_futures_beta_pending_notice({ zero: formatBeta(beta(0)) }),
  ];
}

export function bondQuestions(
  students: readonly TeachingStudent[],
  now: Date,
): string[] {
  const rate = measureRiskFreeRate(wibDateOf(now));
  let cashShares = 0;
  let complete = students.length > 0;
  for (const student of students) {
    if (student.value === undefined || student.value === 0) complete = false;
    else cashShares += student.cash / student.value;
  }
  return [
    complete && rate.ok
      ? m.classes_bonds_cash_notice({
          cash: formatPercent(
            portfolioWeight(cashShares / students.length),
            "integer",
          ),
          rate: formatPercent(rate.value.inputs.annualRate),
        })
      : m.classes_bonds_cash_pending_notice(),
    rate.ok
      ? m.classes_bonds_rate_notice({
          rate: formatPercent(rate.value.value, "three"),
        })
      : m.classes_bonds_rate_pending_notice(),
  ];
}

export function fundQuestions(students: readonly TeachingStudent[]): string[] {
  if (students.length === 0)
    return [
      m.classes_fund_empty_notice(),
      m.classes_fund_holdings_empty_notice(),
    ];
  let totalReturn = 0;
  let holdings = 0;
  for (const student of students) {
    totalReturn += student.return ?? 0;
    holdings += student.holdingCount;
  }
  const complete = students.every((student) => student.return !== undefined);
  const pooled = cumulativeReturn(totalReturn / students.length);
  const median = medianOf(
    students.flatMap((student) =>
      student.return === undefined ? [] : [student.return],
    ),
    cumulativeReturn,
  );
  const inputs = {
    count: formatNumber(students.length),
    pooled: formatSignedPercent(pooled).text,
    median: median === undefined ? "" : formatSignedPercent(median).text,
  };
  const first =
    !complete || median === undefined
      ? m.classes_fund_pending_notice()
      : students.length === 1
        ? m.classes_one_fund_portfolio_notice(inputs)
        : formatSignedPercent(pooled).text === formatSignedPercent(median).text
          ? m.classes_several_equal_fund_portfolios_notice(inputs)
          : m.classes_several_different_fund_portfolios_notice(inputs);
  return [
    first,
    formatNumber(holdings / students.length, 1) === formatNumber(1, 1)
      ? m.classes_one_fund_holding_notice({
          count: formatNumber(holdings / students.length, 1),
        })
      : m.classes_several_fund_holdings_notice({
          count: formatNumber(holdings / students.length, 1),
        }),
  ];
}

export function optionQuestions(
  students: readonly TeachingStudent[],
): string[] {
  const low = extremeOf(
    students,
    (student) => student.risk?.standardDeviation,
    false,
  );
  const high = extremeOf(
    students,
    (student) => student.risk?.standardDeviation,
    true,
  );
  const measuredCount = students.filter(
    (student) => student.risk !== undefined,
  ).length;
  const first =
    low?.risk === undefined || high?.risk === undefined
      ? m.classes_options_risk_empty_notice()
      : measuredCount === 1
        ? m.classes_one_options_portfolio_notice({
            risk: formatPercent(low.risk.standardDeviation),
          })
        : m.classes_several_options_portfolios_notice({
            low: formatPercent(low.risk.standardDeviation),
            high: formatPercent(high.risk.standardDeviation),
          });
  const known = students.filter((student) => student.return !== undefined);
  const losses = known.filter(
    (student) =>
      student.return !== undefined &&
      formatSignedPercent(student.return).direction === "fall",
  ).length;
  const inputs = {
    losses: formatNumber(losses),
    count: formatNumber(known.length),
  };
  const second =
    known.length === 0
      ? m.classes_options_return_empty_notice()
      : losses === 0
        ? m.classes_options_no_loss_notice()
        : known.length === 1
          ? m.classes_one_options_student_notice()
          : losses === known.length
            ? m.classes_several_losing_students_notice(inputs)
            : losses === 1
              ? m.classes_one_options_loss_notice(inputs)
              : m.classes_several_options_losses_notice(inputs);
  return [first, second];
}
