import type { ReactNode } from "react";
import { ConceptCard } from "~/concept-card";
import { ConceptLesson } from "~/features/learning/concept-lesson";
import { percentOf } from "~/charts/plot";
import { fractionOf } from "~/charts/scale";
import { NumberText } from "~/number-text";
import { formatPercent, formatVariance } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { PopoverButton } from "~/popover";
import { plotFraction } from "~/units/plot-fraction";
import { AnalysisCalculation } from "./analysis-calculation";
import { UnavailableMeasures } from "./analysis-correlations";
import {
  CovarianceWithPortfolioFormula,
  VarianceShareFormula,
} from "./formulas";
import { riskMeasureFailureText } from "./measure-failure-text";
import type { PortfolioSummary } from "./measure-summaries";
import { RiskTable } from "./portfolio-tables";
import styles from "./analysis-extras.module.css";

export function AnalysisRiskSources({
  portfolio,
  holdingCount,
}: {
  portfolio: PortfolioSummary | undefined;
  holdingCount: number;
}): ReactNode {
  const risks = portfolio?.holdingRisks;
  const title =
    holdingCount === 1
      ? m.measures_one_risk_source_title()
      : m.measures_several_risk_sources_title();
  const rows = risks?.ok
    ? risks.value.toSorted(
        (first, second) => second.varianceShare - first.varianceShare,
      )
    : [];
  const range = {
    min: Math.min(0, ...rows.map((risk) => risk.varianceShare)),
    max: Math.max(
      0,
      ...rows.flatMap((risk) => [risk.varianceShare, risk.weight]),
    ),
  };
  const position = (value: number) => fractionOf(range, value);
  return (
    <section
      className={styles["card"]}
      data-layout="card"
      aria-labelledby="analysis-risk-sources-title"
    >
      <div className={styles["header"]}>
        <h2>
          <span id="analysis-risk-sources-title">{title}</span>
          <ConceptCard
            title={m.measures_analysis_risk_share_label()}
            meaning={m.measures_analysis_risk_sources_body()}
            example={
              risks === undefined ? (
                <UnavailableMeasures />
              ) : risks.ok ? (
                <RiskTable risks={risks.value} />
              ) : (
                riskMeasureFailureText(risks.failure)
              )
            }
            calculation={
              <>
                <CovarianceWithPortfolioFormula />
                <p>
                  <VarianceShareFormula />
                </p>
              </>
            }
            lesson={<ConceptLesson termId="kontribusi-risiko" />}
          />
        </h2>
      </div>
      {portfolio === undefined || risks === undefined ? (
        <UnavailableMeasures />
      ) : !risks.ok ? (
        <p className={styles["notice"]}>
          <NumberText>{riskMeasureFailureText(risks.failure)}</NumberText>
        </p>
      ) : (
        <>
          <div className={styles["legend"]}>
            <span>
              <i />
              {m.measures_analysis_risk_share_label()}
            </span>
            <span>
              <i className={styles["weightKey"]} />
              {m.measures_weight_label()}
            </span>
          </div>
          <div className={styles["riskRows"]} data-layout="rows">
            {rows.map((risk) => (
              <PopoverButton
                key={risk.code}
                popover={`analysis-risk-${risk.code}`}
                label={m.measures_analysis_risk_row_label({
                  code: risk.code,
                  share: formatPercent(risk.varianceShare, "one"),
                  weight: formatPercent(risk.weight, "one"),
                })}
                className={styles["riskRow"]}
              >
                <b>{risk.code} </b>
                <svg
                  width="100%"
                  height="100%"
                  className={styles["riskBar"]}
                  aria-hidden="true"
                >
                  <rect
                    x={percentOf(
                      plotFraction(
                        Math.min(position(0), position(risk.varianceShare)),
                      ),
                    )}
                    y="25%"
                    width={percentOf(
                      plotFraction(
                        Math.abs(position(risk.varianceShare) - position(0)),
                      ),
                    )}
                    height="50%"
                    rx="0.25em"
                  />
                  <line
                    x1={percentOf(plotFraction(position(risk.weight)))}
                    x2={percentOf(plotFraction(position(risk.weight)))}
                    y1="0"
                    y2="100%"
                  />
                </svg>
                <span>
                  <NumberText whole>
                    {formatPercent(risk.varianceShare, "one")}{" "}
                    <span className={styles["muted"]}>
                      / {formatPercent(risk.weight, "one")}
                    </span>
                  </NumberText>
                </span>
              </PopoverButton>
            ))}
          </div>
          <p className={styles["notice"]}>
            <NumberText>
              {m.measures_analysis_cash_risk_notice({
                weight: formatPercent(portfolio.cash.weight, "one"),
              })}
            </NumberText>
          </p>
          {rows.map((risk) => (
            <AnalysisCalculation
              key={risk.code}
              id={`analysis-risk-${risk.code}`}
              title={m.measures_analysis_holding_risk_title({
                code: risk.code,
              })}
              row={{
                label: title,
                value: formatPercent(risk.varianceShare, "two"),
                formula: (
                  <>
                    <VarianceShareFormula /> ≈{" "}
                    <NumberText whole>
                      {formatPercent(risk.weight, "two")}
                    </NumberText>{" "}
                    ×{" "}
                    <NumberText whole>
                      {formatVariance(risk.covarianceWithPortfolio)}
                    </NumberText>{" "}
                    /{" "}
                    <NumberText whole>
                      {formatVariance(portfolio.variance)}
                    </NumberText>
                  </>
                ),
                inputs: (
                  <>
                    <RiskTable risks={[risk]} />
                    <p>
                      <CovarianceWithPortfolioFormula />
                    </p>
                  </>
                ),
              }}
            />
          ))}
        </>
      )}
    </section>
  );
}
