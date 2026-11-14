import type { ReactNode } from "react";
import { marketIndex } from "~/features/market-data/tracked-instruments";
import {
  formatBeta,
  formatCorrelation,
  formatPercent,
  formatVariance,
} from "~/formatting";
import { m } from "~/paraglide/messages.js";
import type { Result } from "~/result";
import {
  BetaFormula,
  CorrelationFormula,
  CovarianceFormula,
  MeanFormula,
  StandardDeviationFormula,
  VarianceFormula,
} from "./formulas";
import { MarketSection } from "./market-section";
import { measureFailureText } from "./measure-failure-text";
import {
  capmRows,
  MarketLinePosition,
  MeasureList,
  MonthsNotice,
} from "./measure-list";
import type { StoredMeasureFailure } from "./measure-stored.server";
import type { StockSummary } from "./measure-summaries";
import { ReturnTables } from "./return-tables";

/** The measures of one stock against the IHSG, each with its formula and its inputs, and the closes and the returns that they use, or why the stock has none. */
export function StockMeasuresView({
  code,
  measures,
}: {
  code: string;
  measures: Result<StockSummary, StoredMeasureFailure>;
}): ReactNode {
  if (!measures.ok) {
    return (
      <p>{measureFailureText(measures.failure, { kind: "stock", code })}</p>
    );
  }
  const stock = measures.value;
  const index = marketIndex.code;
  return (
    <>
      <MonthsNotice returns={stock.returns} />
      <MeasureList
        rows={[
          {
            label: m.measures_expected_return_label(),
            concept: "expectedReturn",
            inputs: (
              <ReturnTables
                showHeading={false}
                instruments={[{ code, returns: stock.returns }]}
              />
            ),
            value: formatPercent(stock.expectedReturn, "two"),
            formula: <MeanFormula of="i" count={stock.returns.length} />,
          },
          {
            label: m.measures_variance_label(),
            value: formatVariance(stock.variance),
            formula: <VarianceFormula of="i" />,
          },
          {
            label: m.measures_standard_deviation_label(),
            concept: "risk",
            value: formatPercent(stock.standardDeviation, "two"),
            formula: (
              <StandardDeviationFormula of="i" variance={stock.variance} />
            ),
          },
          {
            label: m.measures_covariance_label({ index }),
            value: formatVariance(stock.covarianceWithMarket),
            formula: <CovarianceFormula first="i" second="M" />,
          },
          {
            label: m.measures_correlation_label({ index }),
            value: formatCorrelation(stock.correlationWithMarket.value),
            formula: (
              <CorrelationFormula
                first="i"
                second="M"
                correlation={stock.correlationWithMarket}
              />
            ),
          },
          {
            label: m.measures_beta_label({ index }),
            concept: "beta",
            value: formatBeta(stock.beta.value),
            formula: <BetaFormula beta={stock.beta} />,
          },
          ...capmRows("i", stock),
        ]}
      />
      <MarketLinePosition distance={stock.securityMarketLine.value} />
      <MarketSection market={stock.market} />
      <ReturnTables
        instruments={[
          { code: stock.code, returns: stock.returns },
          { code: index, returns: stock.market.returns },
        ]}
      />
    </>
  );
}
