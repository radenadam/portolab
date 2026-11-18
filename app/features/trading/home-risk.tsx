import { PortfolioMeasuresNotice } from "~/features/measures/portfolio-measures-notice";
import {
  portfolioStudentName,
  readerWithTextName,
  portfolioKindForReader,
} from "~/features/trading/text-for-reader";
import { ConceptHelp } from "~/concept-card";
import { NumberText } from "~/number-text";
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
  reader,
}: {
  report: PortfolioMeasuresReport;
  classId: ClassId;
  reader: PortfolioReader;
}): ReactNode {
  const result = explainPortfolioMeasures(report, reader);
  return (
    <section className={styles["card"]}>
      <div className={styles["cardHeading"]}>
        <div className={styles["cardLabel"]}>
          <h2 className={styles["cardTitle"]}>{m.trading_home_risk_title()}</h2>
          {result.ok && (
            <ConceptHelp title={m.trading_home_measure_period_label()}>
              <MonthsNotice returns={result.value.market.returns} />
            </ConceptHelp>
          )}
        </div>
        {reader.kind === "owner" && (
          <Link
            to={measuresPath(classId, portfolioKindForReader(reader))}
            className={styles["cardLink"]}
          >
            {m.trading_home_analysis_link()}
            <span aria-hidden="true">›</span>
          </Link>
        )}
      </div>
      {!result.ok && (
        <p className={styles["note"]}>
          <PortfolioMeasuresNotice report={report} reader={reader} />
        </p>
      )}
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
  const rows = [
    {
      row: { ...concepts.beta, label: m.trading_home_beta_label() },
      value: portfolio.beta,
      reference: beta(1),
      note: "beta",
    },
    {
      row: { ...concepts.risk, label: m.trading_home_monthly_risk_label() },
      value: portfolio.standardDeviation,
      reference: portfolio.market.standardDeviation,
      note: "risk",
    },
    {
      row: { ...ratios.sharpe, label: m.trading_home_sharpe_label() },
      value: portfolio.sharpeRatio.ok ? portfolio.sharpeRatio.value : undefined,
      reference: portfolio.market.sharpeRatio,
      note: "sharpe",
    },
  ] as const;
  return (
    <dl className={styles["risks"]}>
      {rows.map(({ row, value, reference, note }) => (
        <div className={styles["risk"]} key={row.label}>
          <dt>
            <MeasureLabel row={row} />
          </dt>
          <dd className={styles["riskValue"]}>
            <NumberText whole>{row.value}</NumberText>
          </dd>
          <dd className={styles["scale"]} aria-hidden="true">
            {value !== undefined && (
              <RiskScale value={value} reference={reference} />
            )}
          </dd>
          <dd className={styles["riskNote"]}>
            <NumberText>
              {(textValue) =>
                homeRiskNotes(
                  portfolio,
                  portfolioStudentName(readerWithTextName(reader, textValue)),
                )[note]
              }
            </NumberText>
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
