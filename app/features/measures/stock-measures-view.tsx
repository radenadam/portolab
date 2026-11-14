import type { ReactNode } from "react";
import { marketIndex } from "~/features/market-data/tracked-instruments";
import { formatCorrelation, formatVariance } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import type { Result } from "~/result";
import {
  CorrelationFormula,
  CovarianceFormula,
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
import { stockConceptRows } from "./stock-concept-rows";
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
  const concepts = stockConceptRows(stock);
  return (
    <>
      <MonthsNotice returns={stock.returns} />
      <MeasureList
        rows={[
          concepts.expectedReturn,
          {
            label: m.measures_variance_label(),
            value: formatVariance(stock.variance),
            formula: <VarianceFormula of="i" />,
          },
          concepts.risk,
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
