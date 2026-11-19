import type { ReactNode } from "react";
import { ConceptHelp } from "~/concept-card";
import {
  CovarianceFormula,
  VarianceFormula,
} from "~/features/measures/formulas";
import {
  BetaFormula,
  CorrelationFormula,
} from "~/features/measures/comovement-formulas";
import {
  PortfolioVarianceFormula,
  VarianceShareFormula,
  WeightedSumFormula,
} from "~/features/measures/portfolio-formulas";
import {
  MarketLineFormula,
  RequiredReturnFormula,
  RiskFreeFormula,
} from "~/features/measures/capm-formulas";
import {
  measureRequiredReturn,
  measureSecurityMarketLineDistance,
} from "~/features/measures/capm";
import { MethodNotice } from "~/features/measures/method-notice";
import {
  SharpeRatioFormula,
  TreynorRatioFormula,
} from "~/features/measures/ratio-formulas";
import { monthSpanInputs, monthSpanOf } from "~/features/measures/month-span";
import { formatCalendarDate, formatBeta, formatPercent } from "~/formatting";
import { NumberText } from "~/number-text";
import { m } from "~/paraglide/messages.js";
import { marketBeta } from "~/units/beta";
import type { ContentBlock, SessionContent } from "./content";
import { ContentParagraphs } from "./content-paragraphs";
import type { PortfolioSummary } from "~/features/measures/measure-summaries";
import type { LessonPracticeData } from "./lesson-practice-data";
import type { MeasuredLessonActivity } from "./lesson-practice-sessions";
import styles from "./lesson-practice.module.css";

export function LessonExplanation({
  lesson,
  activity,
  practice,
  portfolio,
}: {
  lesson: SessionContent;
  activity: MeasuredLessonActivity;
  practice: LessonPracticeData;
  portfolio: PortfolioSummary | undefined;
}): ReactNode {
  const market = portfolio?.market ?? practice.market;
  const body = lesson.sections.flatMap((section) =>
    section.id === "body" ? section.blocks : [],
  );
  const estimation = (
    <>
      <MethodNotice />
      {market !== undefined && (
        <p>
          <NumberText>
            {m.learning_analysis_period_notice(
              monthSpanInputs(monthSpanOf(market.returns)),
            )}
          </NumberText>
        </p>
      )}
    </>
  );
  const reference = (
    block: Exclude<ContentBlock, { kind: "paragraph" }>,
  ): ReactNode => {
    if (block.kind === "table") {
      if (block.id !== "estimation-settings") return null;
      return (
        <>
          {estimation}
          {market !== undefined && (
            <>
              <p>
                <RiskFreeFormula rate={market.riskFreeRate} />
              </p>
              <a
                className={styles["link"]}
                href={market.riskFreeRate.inputs.source}
              >
                {formatCalendarDate(market.riskFreeRate.inputs.announcedOn)}
              </a>
            </>
          )}
        </>
      );
    }
    return <p>{lessonFormulas(practice, portfolio)[block.id]}</p>;
  };
  return (
    <ConceptHelp title={lesson.title}>
      {activity === "diversification" && estimation}
      <ContentParagraphs blocks={body} reference={reference} />
      {portfolio !== undefined && (
        <dl>
          {portfolio.holdings.map((holding) => (
            <div key={holding.code}>
              <dt className={styles["code"]}>{holding.code}</dt>
              <dd>
                <NumberText>
                  {lessonHoldingInputs(holding, activity)}
                </NumberText>
              </dd>
            </div>
          ))}
        </dl>
      )}
    </ConceptHelp>
  );
}

function lessonHoldingInputs(
  holding: PortfolioSummary["holdings"][number],
  activity: MeasuredLessonActivity,
): string {
  const expected = formatPercent(holding.expectedReturn, "two");
  switch (activity) {
    case "diversification":
      return m.learning_pair_holding_inputs_notice({
        expected,
        risk: formatPercent(holding.standardDeviation, "two"),
      });
    case "capm":
    case "allocation":
      return m.learning_holding_inputs_notice({
        expected,
        beta: formatBeta(holding.beta),
      });
  }
}

function lessonFormulas(
  practice: LessonPracticeData,
  portfolio: PortfolioSummary | undefined,
) {
  const market = portfolio?.market ?? practice.market;
  const required =
    portfolio?.requiredReturn ??
    (market === undefined
      ? undefined
      : measureRequiredReturn(marketBeta, {
          expectedReturn: { value: market.expectedReturn },
          riskFreeRate: market.riskFreeRate,
        }));
  const formulas: Record<
    Extract<ContentBlock, { kind: "formula" }>["id"],
    ReactNode
  > = {
    beta: <BetaFormula beta={undefined} />,
    "weighted-return": <WeightedSumFormula measure="expectedReturn" />,
    "portfolio-variance": <PortfolioVarianceFormula />,
    variance: <VarianceFormula of="i" />,
    covariance: <CovarianceFormula first="i" second="j" />,
    correlation: (
      <CorrelationFormula first="i" second="j" correlation={undefined} />
    ),
    "variance-share": <VarianceShareFormula />,
    "required-return": <RequiredReturnFormula of="p" required={required} />,
    "risk-free-rate": <RiskFreeFormula rate={market?.riskFreeRate} />,
    "jensens-alpha": (
      <MarketLineFormula
        of="p"
        distance={
          required === undefined || market === undefined
            ? undefined
            : measureSecurityMarketLineDistance(
                portfolio?.expectedReturn ?? market.expectedReturn,
                required,
              )
        }
      />
    ),
    ...ratioFormulas(portfolio),
  };
  return formulas;
}

function ratioFormulas(
  portfolio: PortfolioSummary | undefined,
): Record<"sharpe" | "treynor", ReactNode> {
  if (portfolio === undefined)
    return {
      sharpe: <SharpeRatioFormula inputs={undefined} />,
      treynor: <TreynorRatioFormula inputs={undefined} />,
    };
  const excess = {
    expectedReturn: portfolio.expectedReturn,
    riskFreeRate: portfolio.market.riskFreeRate.value,
  };
  return {
    sharpe: (
      <SharpeRatioFormula
        inputs={{ ...excess, standardDeviation: portfolio.standardDeviation }}
      />
    ),
    treynor: (
      <TreynorRatioFormula inputs={{ ...excess, beta: portfolio.beta }} />
    ),
  };
}
