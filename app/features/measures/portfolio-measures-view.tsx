import { marketIndex } from "~/features/market-data/tracked-instruments";
import type { ReactNode } from "react";
import type { PriceSourceDescription } from "~/features/market-data/price-source.server";
import { textForReader } from "~/features/trading/text-for-reader";
import { homeTitle } from "~/features/trading/home-title";
import type { PortfolioReader } from "~/features/trading/text-for-reader";
import { formatNumber } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { explainPortfolioMeasures } from "./explain-portfolio-measures";
import {
  BetaFormula,
  CorrelationFormula,
  CovarianceFormula,
  CovarianceWithPortfolioFormula,
  MeanFormula,
  VarianceShareFormula,
} from "./formulas";
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

interface PortfolioMeasuresProps {
  report: PortfolioMeasuresReport;
  reader: PortfolioReader;
  /** The sentences that name the delayed prices of the holdings that the latest attempt of the quote job could not update, or undefined when it updated all of them. */
  quoteFailure: string | undefined;
  source: PriceSourceDescription;
}

/** The measures of the portfolio of a student, each with its formula and its inputs, or why it has none, for the student or for the lecturer of the class. */
export function PortfolioMeasuresView({
  report,
  reader,
  quoteFailure,
  source,
}: PortfolioMeasuresProps): ReactNode {
  const measures = explainPortfolioMeasures(report, reader);
  if (measures.ok) {
    return (
      <MeasuredPortfolio
        portfolio={measures.value}
        reader={reader}
        quoteFailure={quoteFailure}
        source={source}
      />
    );
  }
  return (
    <>
      {/* A holding without a delayed price keeps the measures away, so the prices that the quote job could not update explain it. */}
      {report.kind === "unpriced" && quoteFailure !== undefined && (
        <p className={styles["details"]}>{quoteFailure}</p>
      )}
      <p>{measures.failure}</p>
    </>
  );
}

function MeasuredPortfolio({
  portfolio,
  reader,
  quoteFailure,
  source,
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
        {textForReader(reader, {
          owner: () => m.measures_weights_title(),
          lecturer: () => m.measures_lecturer_weights_title(),
        })}
      </h2>
      <p>
        {textForReader(reader, {
          owner: () =>
            m.measures_weights_notice({ ...delay, page: homeTitle() }),
          lecturer: (name) =>
            m.measures_lecturer_weights_notice({ ...delay, name }),
        })}
      </p>
      {quoteFailure !== undefined && (
        <p className={styles["details"]}>{quoteFailure}</p>
      )}
      <WeightTable portfolio={portfolio} />
      <h2>
        {textForReader(reader, {
          owner: () => m.measures_holdings_title(),
          lecturer: () => m.measures_lecturer_holdings_title(),
        })}
      </h2>
      <p>
        {textForReader(reader, {
          owner: () => m.measures_holdings_notice(),
          lecturer: () => m.measures_lecturer_holdings_notice(),
        })}
      </p>
      <HoldingTable portfolio={portfolio} reader={reader} />
      <p className={styles["details"]}>
        <MeanFormula of="i" count={portfolio.market.returns.length} />
      </p>
      <p className={styles["details"]}>
        <BetaFormula beta={undefined} />
      </p>
      <h2>
        {textForReader(reader, {
          owner: () => m.measures_pairs_title(),
          lecturer: () => m.measures_lecturer_pairs_title(),
        })}
      </h2>
      <p>{m.measures_pairs_notice()}</p>
      <PairTable portfolio={portfolio} />
      <p className={styles["details"]}>
        <CovarianceFormula first="i" second="j" />
      </p>
      <p className={styles["details"]}>
        <CorrelationFormula first="i" second="j" correlation={undefined} />
      </p>
      <h2>
        {textForReader(reader, {
          owner: () => m.measures_risks_title(),
          lecturer: () => m.measures_lecturer_risks_title(),
        })}
      </h2>
      {portfolio.holdingRisks.ok ? (
        <>
          <p>{m.measures_risks_notice()}</p>
          <RiskTable risks={portfolio.holdingRisks.value} />
          <p className={styles["details"]}>
            <CovarianceWithPortfolioFormula />
          </p>
          <p className={styles["details"]}>
            <VarianceShareFormula />
          </p>
          <p className={styles["details"]}>
            <CorrelationFormula first="i" second="p" correlation={undefined} />
          </p>
        </>
      ) : (
        <p>{riskMeasureFailureText(portfolio.holdingRisks.failure)}</p>
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
