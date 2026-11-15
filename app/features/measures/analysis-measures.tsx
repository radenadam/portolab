import { NumberText } from "~/number-text";
import { beta, marketBeta } from "~/units/beta";
import { sharpeRatio } from "~/units/sharpe-ratio";
import type { MonthlyReturn } from "~/units/monthly-return";
import type { ReactNode } from "react";
import { ChangeText } from "~/change-text";
import {
  formatBeta,
  formatPercent,
  formatSharpeRatio,
  formatSignedPercent,
} from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { percentOf } from "~/charts/plot";
import { fractionOf, paddedRange } from "~/charts/scale";
import { plotFraction } from "~/units/plot-fraction";
import { monthlyReturn } from "~/units/monthly-return";
import type { PortfolioReader } from "~/features/trading/text-for-reader";
import {
  AnalysisCalculation,
  AnalysisCalculationButton,
} from "./analysis-calculation";
import { MeasureLabel } from "./measure-list";
import type { MeasureRow } from "./measure-list";
import type { PortfolioSummary } from "./measure-summaries";
import { portfolioMeasureRows } from "./portfolio-measure-rows";
import { marketIndex } from "~/features/market-data/tracked-instruments";
import styles from "./analysis.module.css";

export interface AnalysisMeasure {
  key: string;
  row: MeasureRow;
  reference: string;
  scale: ReactNode;
}

/** The comparison uses the same market months and risk-free rate as each portfolio measure. */
export function analysisMeasures(
  portfolio: PortfolioSummary,
  reader: PortfolioReader,
): AnalysisMeasure[] {
  const excess = {
    expectedReturn: portfolio.market.expectedReturn,
    riskFreeRate: portfolio.market.riskFreeRate.value,
  };
  const marketTreynor = monthlyReturn(
    excess.expectedReturn - excess.riskFreeRate,
  );
  const percentText = (value: MonthlyReturn): string =>
    formatPercent(value, "two");
  const comparisons = {
    expectedReturn: comparisonOf({
      value: portfolio.expectedReturn,
      reference: portfolio.market.expectedReturn,
      unit: monthlyReturn,
      format: percentText,
    }),
    risk: comparisonOf({
      value: portfolio.standardDeviation,
      reference: portfolio.market.standardDeviation,
      unit: monthlyReturn,
      format: percentText,
    }),
    beta: comparisonOf({
      value: portfolio.beta,
      reference: marketBeta,
      unit: beta,
      format: formatBeta,
    }),
    sharpe: comparisonOf({
      value: portfolio.sharpeRatio.ok ? portfolio.sharpeRatio.value : undefined,
      reference: portfolio.market.sharpeRatio,
      unit: sharpeRatio,
      format: formatSharpeRatio,
    }),
    treynor: comparisonOf({
      value: portfolio.treynorRatio.ok
        ? portfolio.treynorRatio.value
        : undefined,
      reference: marketTreynor,
      unit: monthlyReturn,
      format: percentText,
    }),
    alpha: comparisonOf({
      value: portfolio.securityMarketLine.value,
      reference: monthlyReturn(0),
      unit: monthlyReturn,
      format: percentText,
    }),
  };
  const measures: AnalysisMeasure[] = [];
  for (const row of portfolioMeasureRows(portfolio, reader)) {
    if (
      row.concept === undefined ||
      row.concept === "riskFree" ||
      row.concept === "market"
    )
      continue;
    const comparison = comparisons[row.concept];
    const label =
      row.concept === "beta" ? m.measures_analysis_beta_label() : row.label;
    measures.push({
      key: row.concept,
      row: {
        ...row,
        label,
        ...(row.concept === "alpha"
          ? {
              value: (
                <ChangeText
                  colored
                  change={formatSignedPercent(
                    portfolio.securityMarketLine.value,
                  )}
                />
              ),
            }
          : {}),
      },
      reference:
        row.concept === "alpha"
          ? m.measures_analysis_market_alpha_notice({
              index: marketIndex.code,
              value: comparison.text,
            })
          : m.measures_analysis_market_notice({
              index: marketIndex.code,
              value: comparison.text,
            }),
      scale: comparison.scale,
    });
  }
  return measures;
}

function comparisonOf<Value extends number>({
  value,
  reference,
  unit,
  format,
}: {
  value: Value | undefined;
  reference: NoInfer<Value>;
  unit: (number: number) => Value;
  format: (number: Value) => string;
}): { text: string; scale: ReactNode } {
  const values = [unit(0), reference];
  if (value !== undefined) values.push(value);
  const range = paddedRange(values, unit, {
    paddingShare: 0.25,
    minimum: Math.min(...values) >= 0 ? unit(0) : undefined,
  });
  return {
    text: format(reference),
    scale: (
      <span className={styles["scale"]} aria-hidden>
        <i
          className={styles["reference"]}
          style={{
            left: percentOf(plotFraction(fractionOf(range, reference))),
          }}
        />
        {value !== undefined && (
          <i
            className={styles["dot"]}
            style={{ left: percentOf(plotFraction(fractionOf(range, value))) }}
          />
        )}
      </span>
    ),
  };
}

export function AnalysisMeasures({
  measures,
  studentName,
}: {
  measures: readonly AnalysisMeasure[];
  studentName?: string | undefined;
}): ReactNode {
  return (
    <section
      className={styles["measures"]}
      aria-labelledby="analysis-measures-title"
      data-layout="card"
    >
      <h2 id="analysis-measures-title">
        {analysisPortfolioTitle(studentName)}
      </h2>
      <dl>
        {measures.map(({ key, row, reference, scale }) => (
          <div className={styles["measure"]} key={key}>
            <dt>
              <MeasureLabel row={row} />
            </dt>
            <dd className={styles["value"]}>
              <NumberText whole>{row.value}</NumberText>
            </dd>
            <dd>{scale}</dd>
            <dd className={styles["comparison"]}>
              <NumberText>{reference}</NumberText>{" "}
              <AnalysisCalculationButton id={`analysis-${key}`} />
            </dd>
          </div>
        ))}
      </dl>
      {measures.map(({ key, row }) => (
        <AnalysisCalculation
          key={key}
          id={`analysis-${key}`}
          title={row.label}
          row={row}
        />
      ))}
    </section>
  );
}

export function analysisPortfolioTitle(
  studentName: string | undefined,
): string {
  return studentName === undefined
    ? m.measures_analysis_measures_title()
    : m.measures_analysis_student_measures_title({ name: studentName });
}
