import { QuoteNotice } from "~/features/market-data/quote-notice";
import { NumberText } from "~/number-text";
import { marketIndex } from "~/features/market-data/tracked-instruments";
import type { ReactNode } from "react";
import type { PriceSourceDescription } from "~/features/market-data/price-source.server";
import { textForReader } from "~/features/trading/text-for-reader";
import { portfolioTitle } from "~/features/trading/portfolio-title";
import type { PortfolioReader } from "~/features/trading/text-for-reader";
import { formatNumber } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { PortfolioMeasuresNotice } from "./portfolio-measures-notice";
import { CovarianceFormula, MeanFormula } from "./formulas";
import { BetaFormula, CorrelationFormula } from "./comovement-formulas";
import {
  CovarianceWithPortfolioFormula,
  VarianceShareFormula,
} from "./portfolio-formulas";
import { MarketSection } from "./market-section";
import { riskMeasureFailureText } from "./measure-failure-text";
import { MarketLinePosition, MeasureList, MonthsNotice } from "./measure-list";
import type { PortfolioSummary } from "./measure-summaries";
import styles from "./measures.module.css";
import {
  HoldingTable,
  PairTable,
  RiskTable,
  WeightTable,
} from "./portfolio-tables";
import type { PortfolioMeasuresReport } from "./read-measures.server";
import { portfolioMeasureRows } from "./portfolio-measure-rows";
import { ReturnTables } from "./return-tables";
import { betaFormulaText, correlationFormulaText } from "./formula-texts";
import { ExplainedFormula } from "~/math-notation";

interface PortfolioMeasuresProps {
  report: PortfolioMeasuresReport;
  reader: PortfolioReader;
  /** The sentences that name the delayed prices of the holdings that the latest attempt of the quote job could not update, or undefined when it updated all of them. */
  quoteFailure: string | undefined;
  source: PriceSourceDescription;
  /** The codes and the times of the prices behind the weights, whose times stand beside the weights where they differ from the time that the screen states once. */
  quoteTimes: readonly { code: string; quotedAt: Date }[];
}

/** An owner and a lecturer reading a student need different names for the same measures and inputs. */
export function PortfolioMeasuresView({
  report,
  reader,
  quoteFailure,
  source,
  quoteTimes,
}: PortfolioMeasuresProps): ReactNode {
  if (report.kind === "measured" && report.measures.ok) {
    return (
      <MeasuredPortfolio
        portfolio={report.measures.value}
        reader={reader}
        quoteFailure={quoteFailure}
        source={source}
        quoteTimes={quoteTimes}
      />
    );
  }
  return (
    <>
      {/* A holding without a delayed price keeps the measures away, so the prices that the quote job could not update explain it. */}
      {report.kind === "unpriced" && (
        <QuoteNotice text={quoteFailure} className={styles["details"]} />
      )}
      <p>
        <PortfolioMeasuresNotice report={report} reader={reader} />
      </p>
    </>
  );
}

function MeasuredPortfolio({
  portfolio,
  reader,
  quoteFailure,
  source,
  quoteTimes,
}: Omit<PortfolioMeasuresProps, "report"> & {
  portfolio: PortfolioSummary;
}): ReactNode {
  const delay = {
    source: source.name,
    minutes: formatNumber(source.delayMinutes),
  };
  return (
    <>
      <MonthsNotice returns={portfolio.market.returns} />
      <MeasureList rows={portfolioMeasureRows(portfolio, reader)} />
      <MarketLinePosition distance={portfolio.securityMarketLine.value} />
      <h2>
        <NumberText>
          {textForReader(reader, {
            owner: () => m.measures_weights_title(),
            lecturer: () => m.measures_lecturer_weights_title(),
          })}
        </NumberText>
      </h2>
      <p>
        <NumberText>
          {(textValue) =>
            textForReader(reader, {
              owner: (kind) =>
                m.measures_weights_notice({
                  ...delay,
                  page: portfolioTitle(kind),
                }),
              lecturer: (name) =>
                m.measures_lecturer_weights_notice({
                  ...delay,
                  name: textValue(name),
                }),
            })
          }
        </NumberText>
      </p>
      <QuoteNotice text={quoteFailure} className={styles["details"]} />
      <WeightTable portfolio={portfolio} quoteTimes={quoteTimes} />
      <h2>
        <NumberText>
          {textForReader(reader, {
            owner: () => m.measures_holdings_title(),
            lecturer: () => m.measures_lecturer_holdings_title(),
          })}
        </NumberText>
      </h2>
      <p>
        <NumberText>
          {textForReader(reader, {
            owner: () => m.measures_holdings_notice(),
            lecturer: () => m.measures_lecturer_holdings_notice(),
          })}
        </NumberText>
      </p>
      <HoldingTable
        portfolio={portfolio}
        reader={reader}
        quoteTimes={quoteTimes}
      />
      <TableFormulas text={m.measures_holdings_formulas_notice()}>
        <ExplainedFormula text={m.measures_mean_formula_notice()}>
          <MeanFormula of="i" count={portfolio.market.returns.length} />
        </ExplainedFormula>
        <ExplainedFormula text={betaFormulaText()}>
          <BetaFormula beta={undefined} />
        </ExplainedFormula>
      </TableFormulas>
      <h2>
        <NumberText>
          {textForReader(reader, {
            owner: () => m.measures_pairs_title(),
            lecturer: () => m.measures_lecturer_pairs_title(),
          })}
        </NumberText>
      </h2>
      <p>{m.measures_pairs_notice()}</p>
      <PairTable portfolio={portfolio} />
      <TableFormulas text={m.measures_pairs_formulas_notice()}>
        <ExplainedFormula text={m.measures_covariance_formula_notice()}>
          <CovarianceFormula first="i" second="j" />
        </ExplainedFormula>
        <ExplainedFormula text={correlationFormulaText()}>
          <CorrelationFormula first="i" second="j" correlation={undefined} />
        </ExplainedFormula>
      </TableFormulas>
      <h2>
        <NumberText>
          {textForReader(reader, {
            owner: () => m.measures_risks_title(),
            lecturer: () => m.measures_lecturer_risks_title(),
          })}
        </NumberText>
      </h2>
      {portfolio.holdingRisks.ok ? (
        <>
          <p>{m.measures_risks_notice()}</p>
          <RiskTable risks={portfolio.holdingRisks.value} />
          <TableFormulas text={m.measures_risks_formulas_notice()}>
            <ExplainedFormula
              text={m.measures_covariance_with_portfolio_formula_notice()}
            >
              <CovarianceWithPortfolioFormula />
            </ExplainedFormula>
            <ExplainedFormula text={m.measures_variance_share_formula_notice()}>
              <VarianceShareFormula />
            </ExplainedFormula>
            <ExplainedFormula text={correlationFormulaText()}>
              <CorrelationFormula
                first="i"
                second="p"
                correlation={undefined}
              />
            </ExplainedFormula>
          </TableFormulas>
        </>
      ) : (
        <p>
          <NumberText>
            {riskMeasureFailureText(portfolio.holdingRisks.failure)}
          </NumberText>
        </p>
      )}
      <MarketSection market={portfolio.market} />
      <ReturnTables
        instruments={[
          { code: marketIndex.code, returns: portfolio.market.returns },
          ...portfolio.holdings,
        ]}
      />
    </>
  );
}

/** The formulas from which the columns of the table above them come, after the sentence that says so, each with its own sentence. */
function TableFormulas({
  text,
  children,
}: {
  text: string;
  children: ReactNode;
}): ReactNode {
  return (
    <div className={styles["tableFormulas"]}>
      <p>
        <NumberText>{text}</NumberText>
      </p>
      {children}
    </div>
  );
}
