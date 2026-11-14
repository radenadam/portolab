import { ConceptHelp } from "~/concept-card";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { percentOf } from "~/charts/plot";
import { fractionOf, paddedRange } from "~/charts/scale";
import type { ClassId } from "~/features/classes/classes.schema";
import { explainPortfolioMeasures } from "~/features/measures/explain-portfolio-measures";
import { MeasureLabel, MonthsNotice } from "~/features/measures/measure-list";
import { portfolioRatioRows } from "~/features/measures/portfolio-measure-rows";
import { portfolioConceptRows } from "~/features/measures/portfolio-concept-rows";
import type { PortfolioSummary } from "~/features/measures/measure-summaries";
import type { PortfolioReader } from "./text-for-reader";
import { measuresPath } from "~/features/measures/measures-path";
import type { PortfolioMeasuresReport } from "~/features/measures/read-measures.server";
import { m } from "~/paraglide/messages.js";
import { plotFraction } from "~/units/plot-fraction";
import { beta } from "~/units/beta";
import styles from "./home-portfolio.module.css";
import { homeRiskNotes } from "./home-risk-notes";

/** Negative beta and Sharpe still need room on the scale, so each range includes both values and zero. */
export function HomeRisk({
  report,
  classId,
}: {
  report: PortfolioMeasuresReport;
  classId: ClassId;
}): ReactNode {
  const reader = { kind: "owner", classId } as const;
  const result = explainPortfolioMeasures(report, reader);
  return (
    <section className={styles["card"]}>
      <div className={styles["cardHeading"]}>
        <div className={styles["valueLabel"]}>
          <h2 className={styles["cardTitle"]}>{m.trading_home_risk_title()}</h2>
          {result.ok && (
            <ConceptHelp title={m.trading_home_measure_period_label()}>
              <MonthsNotice returns={result.value.market.returns} />
            </ConceptHelp>
          )}
        </div>
        <Link to={measuresPath(classId)}>{m.trading_home_analysis_link()}</Link>
      </div>
      {!result.ok && <p className={styles["note"]}>{result.failure}</p>}
      {result.ok && <RiskRows portfolio={result.value} reader={reader} />}
    </section>
  );
}

function RiskRows({
  portfolio,
  reader,
}: {
  portfolio: PortfolioSummary;
  reader: PortfolioReader;
}): ReactNode {
  const concepts = portfolioConceptRows(portfolio, reader);
  const ratios = portfolioRatioRows(portfolio);
  const notes = homeRiskNotes(portfolio);
  const rows = [
    {
      row: { ...concepts.beta, label: m.trading_home_beta_label() },
      value: portfolio.beta,
      reference: beta(1),
      text: notes.beta,
    },
    {
      row: { ...concepts.risk, label: m.trading_home_monthly_risk_label() },
      value: portfolio.standardDeviation,
      reference: portfolio.market.standardDeviation,
      text: notes.risk,
    },
    {
      row: { ...ratios.sharpe, label: m.trading_home_sharpe_label() },
      value: portfolio.sharpeRatio.ok ? portfolio.sharpeRatio.value : undefined,
      reference: portfolio.market.sharpeRatio,
      text: notes.sharpe,
    },
  ];
  return (
    <dl className={styles["risks"]}>
      {rows.map(({ row, value, reference, text }) => (
        <div className={styles["risk"]} key={row.label}>
          <dt>
            <MeasureLabel row={row} />
          </dt>
          <dd className={styles["riskValue"]}>{row.value}</dd>
          <dd className={styles["scale"]} aria-hidden="true">
            {value !== undefined && (
              <RiskScale value={value} reference={reference} />
            )}
          </dd>
          <dd className={styles["riskNote"]}>
            {text}
            {value === undefined && row.example}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function RiskScale({
  value,
  reference,
}: {
  value: number;
  reference: number;
}): ReactNode {
  const range = paddedRange([0, value, reference], (number) => number);
  return (
    <svg className={styles["scaleDrawing"]}>
      <line
        x1="0"
        x2="100%"
        y1="50%"
        y2="50%"
        className={styles["scaleLine"]}
      />
      <line
        x1={percentOf(plotFraction(fractionOf(range, reference)))}
        x2={percentOf(plotFraction(fractionOf(range, reference)))}
        y1="20%"
        y2="80%"
        className={styles["reference"]}
      />
      <circle
        cx={percentOf(plotFraction(fractionOf(range, value)))}
        cy="50%"
        r="0.35em"
        className={styles["own"]}
      />
    </svg>
  );
}
