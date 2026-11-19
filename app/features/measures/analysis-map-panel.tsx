import { NumberText } from "~/number-text";
import { portfolioStudentName } from "~/features/trading/text-for-reader";
import type { PortfolioReader } from "~/features/trading/text-for-reader";
import { analysisAxisDetails } from "./analysis-axis-details";
import { analysisAxes } from "./analysis-axes";
import { AnalysisCaption } from "./analysis-caption";
import type { ReactNode } from "react";
import { useLocation } from "react-router";
import { ConceptCard } from "~/concept-card";
import {
  ConceptLesson,
  useConceptSession,
} from "~/features/learning/concept-lesson";
import { formatPercent, formatNumber } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { LessonLink } from "~/features/learning/lesson-link";
import type { Result } from "~/result";
import { AnalysisMap } from "./analysis-map";
import type { AnalysisAxis } from "./analysis-axes";
import { measureFailureText } from "./measure-failure-text";
import type { MarketSummary, PortfolioSummary } from "./measure-summaries";
import type { StoredMeasureFailure } from "./measure-stored.server";
import type { StudentLine } from "./read-measures.server";
import { ViewLink } from "~/view-link";
import styles from "./analysis.module.css";
import type { AnalysisHolding } from "./analysis-holdings";
import { marketIndex } from "~/features/market-data/tracked-instruments";

export function AnalysisMapPanel({
  market,
  portfolio,
  marketLine,
  axis,
  holdings,
  reader,
}: {
  market: MarketSummary | undefined;
  portfolio: PortfolioSummary | undefined;
  marketLine: Result<StudentLine, StoredMeasureFailure>;
  axis: AnalysisAxis;
  holdings: readonly AnalysisHolding[];
  reader: PortfolioReader;
}): ReactNode {
  const studentName = portfolioStudentName(reader);
  const details = analysisAxisDetails(axis, studentName);
  const session = useConceptSession(details.termId);
  return (
    <section
      className={styles["mapPanel"]}
      aria-labelledby="analysis-map-title"
      data-layout="card"
    >
      <div className={styles["mapHeader"]}>
        <h2>
          <span id="analysis-map-title">{details.title}</span>
          {market !== undefined && (
            <AnalysisMapHelp
              axis={axis}
              studentName={studentName}
              market={market}
              portfolio={portfolio}
            />
          )}
        </h2>
        <AxisLinks axis={axis} />
      </div>
      <div className={styles["mapBody"]}>
        {market !== undefined ? (
          <AnalysisMap
            portfolio={portfolio}
            market={market}
            holdings={holdings}
            axis={axis}
            studentName={studentName}
          />
        ) : (
          !marketLine.ok && (
            <p>
              <NumberText>
                {measureFailureText(marketLine.failure, {
                  kind: "market",
                  reader,
                })}
              </NumberText>
            </p>
          )
        )}
      </div>
      {portfolio !== undefined && (
        <div className={styles["insight"]}>
          <em>
            <NumberText>
              {details.sessionLabel({ session: formatNumber(session) })}
            </NumberText>
          </em>
          <AnalysisCaption
            insight={(name) =>
              analysisAxisDetails(axis, name).insight(portfolio)
            }
            studentName={studentName}
          />
          <LessonLink
            id="analysis-map-lesson"
            session={session}
            className={styles["link"]}
          >
            {m.measures_analysis_learn_label()} <span aria-hidden>→</span>
          </LessonLink>
        </div>
      )}
    </section>
  );
}

function AxisLinks({ axis }: { axis: AnalysisAxis }): ReactNode {
  const location = useLocation();
  return (
    <nav
      className={styles["axis"]}
      aria-label={m.measures_analysis_axis_label()}
    >
      {analysisAxes.map((value) => {
        const query = new URLSearchParams(location.search);
        query.set("axis", value);
        return (
          <ViewLink
            key={value}
            to={`${location.pathname}?${query.toString()}`}
            aria-current={axis === value ? "true" : undefined}
          >
            <span>{analysisAxisDetails(value).label}</span>
          </ViewLink>
        );
      })}
    </nav>
  );
}

function AnalysisMapHelp({
  axis,
  market,
  portfolio,
  studentName,
}: {
  axis: AnalysisAxis;
  market: MarketSummary;
  portfolio: PortfolioSummary | undefined;
  studentName?: string | undefined;
}): ReactNode {
  const details = analysisAxisDetails(axis, studentName);
  return (
    <ConceptCard
      id="analysis-map-help"
      title={details.title}
      meaning={details.meaning}
      example={
        <p>
          <NumberText>
            {(textValue) =>
              portfolio === undefined
                ? m.measures_analysis_market_notice({
                    index: marketIndex.code,
                    value: formatPercent(market.expectedReturn, "two"),
                  })
                : analysisAxisDetails(
                    axis,
                    studentName === undefined
                      ? undefined
                      : textValue(studentName),
                  ).insight(portfolio).text
            }
          </NumberText>
        </p>
      }
      calculation={details.calculation(market)}
      lesson={<ConceptLesson termId={details.termId} />}
    />
  );
}
