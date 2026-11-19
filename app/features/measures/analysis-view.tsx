import { PortfolioMeasuresNotice } from "./portfolio-measures-notice";
import { AnalysisAllocation } from "./analysis-allocation";
import { AnalysisCorrelations } from "./analysis-correlations";
import { AnalysisRiskSources } from "./analysis-risk-sources";
import extrasStyles from "./analysis-extras.module.css";
import { portfolioStudentName } from "~/features/trading/text-for-reader";
import type { PortfolioReader } from "~/features/trading/text-for-reader";
import { NumberText } from "~/number-text";
import type { ReactNode } from "react";
import { Link } from "react-router";
import type { ClassId } from "~/features/classes/classes.schema";
import { ConceptCard } from "~/concept-card";
import { ConceptLesson } from "~/features/learning/concept-lesson";
import type { PriceSourceDescription } from "~/features/market-data/price-source.server";
import { marketPath } from "~/features/market-data/market-path";
import { holdingQuoteFailureText } from "~/features/trading/holding-quote-failure-text";
import type { PortfolioReport } from "~/features/trading/read-portfolio-report.server";
import { formatPercent } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { Popover } from "~/popover";
import type { Result } from "~/result";
import { analysisDataId } from "./analysis-calculation";
import { DiversificationCalculation } from "./diversification-calculation";
import { AnalysisMapPanel } from "./analysis-map-panel";
import type { AnalysisAxis } from "./analysis-axes";
import {
  AnalysisMeasures,
  analysisMeasures,
  analysisPortfolioTitle,
} from "./analysis-measures";
import { AnalysisPerformance } from "./analysis-performance";
import { AnalysisPointCalculations } from "./analysis-point-calculations";
import { explainPortfolioMeasures } from "./explain-portfolio-measures";
import { RiskFree } from "./formulas";
import { RiskFreeFormula } from "./capm-formulas";
import { measureConcept } from "./measure-concept";
import type { MarketSummary } from "./measure-summaries";
import type { StoredMeasureFailure } from "./measure-stored.server";
import { MethodNotice } from "./method-notice";
import { monthSpanInputs, monthSpanOf } from "./month-span";
import { PortfolioMeasuresView } from "./portfolio-measures-view";
import type {
  PortfolioMeasuresReport,
  StockRow,
  StudentLine,
} from "./read-measures.server";
import { StudentMarketLine } from "./student-market-line";
import { StockTable } from "./stock-table";
import styles from "./analysis.module.css";
import { analysisHoldings } from "./analysis-holdings";
import { MarketSection } from "./market-section";
import { marketIndex } from "~/features/market-data/tracked-instruments";
import { attemptForCodes } from "~/features/market-data/quote-failure-text";
import { OtherQuoteTimes } from "~/features/market-data/other-quote-times";
import { holdingQuoteTimes } from "~/features/trading/value-portfolio";
import { sharedQuoteTime } from "~/features/market-data/shared-quote-time";
import { SharedQuoteTimeNotice } from "~/features/market-data/shared-quote-time-notice";

export function AnalysisView({
  classId,
  report,
  measures,
  marketLine,
  market: latestMarket,
  stocks,
  axis,
  now,
  source,
  firstSessionDate,
  reader,
  showData,
  showTitle,
}: {
  classId: ClassId;
  report: PortfolioReport;
  measures: PortfolioMeasuresReport;
  marketLine: Result<StudentLine, StoredMeasureFailure>;
  market: MarketSummary | undefined;
  stocks: StockRow[];
  axis: AnalysisAxis;
  now: Date;
  source: PriceSourceDescription;
  firstSessionDate: string | null;
  reader: PortfolioReader;
  showData: boolean;
  showTitle?: boolean;
}): ReactNode {
  const studentName = portfolioStudentName(reader);
  const explained = explainPortfolioMeasures(measures, reader);
  const portfolio = explained.ok ? explained.value : undefined;
  const market = portfolio?.market ?? latestMarket;
  const holdings = analysisHoldings(
    portfolio,
    marketLine.ok ? marketLine.value : undefined,
    stocks,
  );
  const quoteFailure = holdingQuoteFailureText(
    [
      {
        valuation: report.valuation,
        quoteAttempt: attemptForCodes(
          report.quoteAttempt,
          report.valuation.holdings.map((holding) => holding.code),
        ),
      },
    ],
    {
      now,
      delayMinutes: source.delayMinutes,
    },
  );
  const rows =
    portfolio === undefined ? [] : analysisMeasures(portfolio, reader);
  return (
    <div className={styles["page"]}>
      <AnalysisHeader
        market={market}
        quotes={holdingQuoteTimes(report.valuation.holdings)}
        showTitle={showTitle}
        reader={reader}
      />
      <div
        className={styles["top"]}
        data-layout="columns"
        data-layout-ratio="2.4:1"
      >
        <AnalysisMapPanel
          holdings={holdings}
          market={market}
          portfolio={portfolio}
          marketLine={marketLine}
          axis={axis}
          reader={reader}
        />
        {portfolio !== undefined ? (
          <AnalysisMeasures measures={rows} studentName={studentName} />
        ) : (
          <section
            className={styles["measures"]}
            data-layout="card"
            aria-labelledby="analysis-measures-title"
          >
            <h2 id="analysis-measures-title">
              <NumberText verbatim>
                {analysisPortfolioTitle(studentName)}
              </NumberText>
            </h2>
            <p>
              <PortfolioMeasuresNotice report={measures} reader={reader} />
            </p>
            {reader.kind === "owner" && (
              <Link to={marketPath(classId)} className={styles["link"]}>
                {m.measures_analysis_market_link()}
              </Link>
            )}
            <a href={`#${analysisDataId}`} className={styles["link"]}>
              {m.measures_analysis_data_label()}
            </a>
          </section>
        )}
      </div>
      {quoteFailure !== undefined && (
        <p className={styles["notice"]}>
          <NumberText>{quoteFailure}</NumberText>
        </p>
      )}
      <div
        className={extrasStyles["panels"]}
        data-layout="columns"
        data-layout-ratio="1:1:1"
      >
        <AnalysisAllocation valuation={report.valuation} reader={reader} />
        <AnalysisCorrelations portfolio={portfolio} />
        <AnalysisRiskSources
          portfolio={portfolio}
          holdingCount={report.valuation.holdings.length}
        />
      </div>
      <AnalysisPerformance
        history={report.history}
        firstSessionDate={firstSessionDate}
        reader={reader}
      />
      {/* The data and the method behind every measure close the page as a part that opens, because they are a reference for checking a number, not something to read first. A link to the part opens it. */}
      <details className={styles["dataSection"]} open={showData}>
        <summary>{m.measures_analysis_data_label()}</summary>
        <div id={analysisDataId} className={styles["data"]}>
          <MethodNotice />
          <PortfolioMeasuresView
            report={measures}
            reader={reader}
            quoteFailure={quoteFailure}
            source={source}
          />
          <StudentMarketLine marketLine={marketLine} reader={reader} />
          <h2>{m.measures_stocks_title()}</h2>
          <StockTable classId={classId} stocks={stocks} />
        </div>
      </details>
      {portfolio !== undefined && (
        <DiversificationCalculation portfolio={portfolio} />
      )}
      <AnalysisPointCalculations holdings={holdings} />
      {market !== undefined && (
        <Popover
          id="analysis-market"
          label={marketIndex.code}
          placement="belowEnd"
        >
          <div className={styles["calculation"]}>
            <MarketSection market={market} />
          </div>
        </Popover>
      )}
    </div>
  );
}

function AnalysisHeader({
  market,
  quotes,
  showTitle,
  reader,
}: {
  market: MarketSummary | undefined;
  quotes: readonly { code: string; quotedAt: Date }[];
  showTitle: boolean | undefined;
  reader: PortfolioReader;
}): ReactNode {
  const riskFreeConcept = measureConcept("riskFree");
  const sharedTime = sharedQuoteTime(quotes);
  return (
    <header className={styles["header"]}>
      {(showTitle ?? reader.kind === "owner") && (
        <h1>{m.measures_analysis_title()}</h1>
      )}
      {market !== undefined && (
        <div className={styles["period"]}>
          <NumberText>
            {m.measures_analysis_period_notice({
              ...monthSpanInputs(monthSpanOf(market.returns)),
            })}
          </NumberText>{" "}
          <RiskFree />{" "}
          <NumberText>
            {m.measures_analysis_rate_notice({
              monthly: formatPercent(market.riskFreeRate.value, "three"),
              annual: formatPercent(market.riskFreeRate.inputs.annualRate),
            })}
          </NumberText>{" "}
          <ConceptCard
            title={m.measures_risk_free_rate_label()}
            meaning={riskFreeConcept.meaning}
            example={
              <strong>
                <NumberText>
                  {formatPercent(market.riskFreeRate.value, "two")}
                </NumberText>
              </strong>
            }
            calculation={<RiskFreeFormula rate={market.riskFreeRate} />}
            lesson={<ConceptLesson termId={riskFreeConcept.termId} />}
          />
        </div>
      )}
      {sharedTime !== undefined && (
        <div className={styles["prices"]}>
          <SharedQuoteTimeNotice moment={sharedTime} />
          <OtherQuoteTimes
            quotes={quotes}
            sharedTime={sharedTime}
            className={styles["otherPrices"]}
          />
        </div>
      )}
    </header>
  );
}
