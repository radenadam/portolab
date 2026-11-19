import type { PortfolioKind } from "~/features/trading/portfolio-store.server";
import { NumberText } from "~/number-text";
import type { ReactNode } from "react";
import { marketIndex } from "~/features/market-data/tracked-instruments";
import { formatCorrelation, formatVariance } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import type { Result } from "~/result";
import { CovarianceFormula, VarianceFormula } from "./formulas";
import { CorrelationFormula } from "./comovement-formulas";
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
import { stockConceptRows } from "./stock-concept-rows";
import { ReturnTables } from "./return-tables";
import { correlationFormulaText } from "./formula-texts";
import { sumOfDeviationProducts } from "./return-statistics";

/** The measures of one stock against the IHSG, each with its formula and its inputs, and the closes and the returns that they use, or why the stock has none. */
export function StockMeasuresView({
  code,
  measures,
  portfolioKind = "membership",
}: {
  code: string;
  portfolioKind?: PortfolioKind;
  measures: Result<StockSummary, StoredMeasureFailure>;
}): ReactNode {
  if (!measures.ok) {
    return (
      <p>
        <NumberText>
          {measureFailureText(measures.failure, {
            kind: "stock",
            code,
            reader: { kind: "owner", portfolioKind },
          })}
        </NumberText>
      </p>
    );
  }
  const stock = measures.value;
  const index = marketIndex.code;
  const concepts = stockConceptRows(stock);
  const stockSeries = {
    returns: stock.returns.map((measure) => measure.value),
    mean: stock.expectedReturn,
  };
  const marketSeries = {
    returns: stock.market.returns.map((measure) => measure.value),
    mean: stock.market.expectedReturn,
  };
  const count = stock.returns.length;
  return (
    <>
      <MonthsNotice returns={stock.returns} />
      <MeasureList
        rows={[
          concepts.expectedReturn,
          {
            label: m.measures_variance_label(),
            value: formatVariance(stock.variance),
            description: m.measures_variance_formula_notice(),
            formula: (
              <VarianceFormula
                of="i"
                numbers={{
                  sum: sumOfDeviationProducts(stockSeries, stockSeries),
                  count,
                }}
              />
            ),
          },
          concepts.risk,
          {
            label: m.measures_covariance_label({ index }),
            value: formatVariance(stock.covarianceWithMarket),
            description: m.measures_covariance_formula_notice(),
            formula: (
              <CovarianceFormula
                first="i"
                second="M"
                numbers={{
                  sum: sumOfDeviationProducts(stockSeries, marketSeries),
                  count,
                }}
              />
            ),
          },
          {
            label: m.measures_correlation_label({ index }),
            value: formatCorrelation(stock.correlationWithMarket.value),
            description: correlationFormulaText(),
            formula: (
              <CorrelationFormula
                first="i"
                second="M"
                correlation={stock.correlationWithMarket}
              />
            ),
          },
          concepts.beta,
          ...capmRows("i", stock, { colored: true }),
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
