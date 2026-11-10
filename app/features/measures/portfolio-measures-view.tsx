import type { ReactNode } from "react";
import { countedText } from "~/counted-text";
import type { ClassId } from "~/features/classes/classes.schema";
import type { PriceSourceDescription } from "~/features/market-data/price-source.server";
import { marketIndex } from "~/features/market-data/tracked-instruments";
import {
  formatBeta,
  formatList,
  formatNumber,
  formatPercent,
  formatVariance,
} from "~/formatting";
import { m } from "~/paraglide/messages.js";
import {
  BetaFormula,
  CorrelationFormula,
  CovarianceFormula,
  MeanFormula,
  PortfolioVarianceFormula,
  StandardDeviationFormula,
  WeightedSumFormula,
} from "./formulas";
import { MarketSection } from "./market-section";
import { measureFailureText } from "./measure-failure-text";
import {
  capmRows,
  MarketLinePosition,
  MeasureList,
  MonthsNotice,
} from "./measure-list";
import type { PortfolioSummary } from "./measure-summaries";
import styles from "./measures.module.css";
import { HoldingTable, PairTable, WeightTable } from "./portfolio-tables";
import type { PortfolioMeasuresReport } from "./read-measures.server";
import { ReturnTables } from "./return-tables";

interface PortfolioMeasuresProps {
  classId: ClassId;
  report: PortfolioMeasuresReport;
  /** The sentences that name the delayed prices of the holdings that the latest attempt of the quote job could not update, or undefined when it updated all of them. */
  quoteFailure: string | undefined;
  source: PriceSourceDescription;
}

/** The measures of the portfolio of a student, each with its formula and its inputs, or why it has none. */
export function PortfolioMeasuresView({
  classId,
  report,
  quoteFailure,
  source,
}: PortfolioMeasuresProps): ReactNode {
  switch (report.kind) {
    case "noHoldings":
      return <p>{m.measures_no_holdings_notice()}</p>;
    case "unpriced":
      return (
        <>
          {quoteFailure !== undefined && (
            <p className={styles["details"]}>{quoteFailure}</p>
          )}
          <p>
            {countedText(
              report.codes.length,
              {
                one: m.measures_one_unpriced_holding_notice,
                several: m.measures_several_unpriced_holdings_notice,
              },
              { codes: formatList(report.codes, "conjunction") },
            )}
          </p>
        </>
      );
    case "measured":
      return report.measures.ok ? (
        <MeasuredPortfolio
          classId={classId}
          portfolio={report.measures.value}
          quoteFailure={quoteFailure}
          source={source}
        />
      ) : (
        <p>
          {measureFailureText(report.measures.failure, { kind: "portfolio" })}
        </p>
      );
  }
}

function MeasuredPortfolio({
  classId,
  portfolio,
  quoteFailure,
  source,
}: Omit<PortfolioMeasuresProps, "report"> & {
  portfolio: PortfolioSummary;
}): ReactNode {
  const index = marketIndex.code;
  return (
    <>
      <MonthsNotice returns={portfolio.market.returns} />
      <MeasureList
        rows={[
          {
            label: m.measures_expected_return_label(),
            value: formatPercent(portfolio.expectedReturn, "two"),
            formula: <WeightedSumFormula measure="expectedReturn" />,
          },
          {
            label: m.measures_variance_label(),
            value: formatVariance(portfolio.variance),
            formula: <PortfolioVarianceFormula />,
          },
          {
            label: m.measures_standard_deviation_label(),
            value: formatPercent(portfolio.standardDeviation, "two"),
            formula: (
              <StandardDeviationFormula of="p" variance={portfolio.variance} />
            ),
          },
          {
            label: m.measures_beta_label({ index }),
            value: formatBeta(portfolio.beta),
            formula: <WeightedSumFormula measure="beta" />,
          },
          ...capmRows("p", portfolio),
        ]}
      />
      <MarketLinePosition distance={portfolio.securityMarketLine.value} />
      <h2>{m.measures_weights_title()}</h2>
      <p>
        {m.measures_weights_notice({
          source: source.name,
          minutes: formatNumber(source.delayMinutes),
        })}
      </p>
      {quoteFailure !== undefined && (
        <p className={styles["details"]}>{quoteFailure}</p>
      )}
      <WeightTable portfolio={portfolio} />
      <h2>{m.measures_holdings_title()}</h2>
      <p>{m.measures_holdings_notice()}</p>
      <HoldingTable classId={classId} portfolio={portfolio} />
      <p className={styles["details"]}>
        <MeanFormula of="i" count={portfolio.market.returns.length} />
      </p>
      <p className={styles["details"]}>
        <BetaFormula beta={undefined} />
      </p>
      <h2>{m.measures_pairs_title()}</h2>
      <p>{m.measures_pairs_notice()}</p>
      <PairTable portfolio={portfolio} />
      <p className={styles["details"]}>
        <CovarianceFormula first="i" second="j" />
      </p>
      <p className={styles["details"]}>
        <CorrelationFormula first="i" second="j" correlation={undefined} />
      </p>
      <MarketSection market={portfolio.market} />
      <ReturnTables
        instruments={[
          { code: index, returns: portfolio.market.returns },
          ...portfolio.holdings,
        ]}
      />
    </>
  );
}
