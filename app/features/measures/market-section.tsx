import type { ReactNode } from "react";
import { marketIndex } from "~/features/market-data/tracked-instruments";
import {
  formatCalendarDate,
  formatPercent,
  formatVariance,
} from "~/formatting";
import { m } from "~/paraglide/messages.js";
import {
  MeanFormula,
  RiskFreeFormula,
  StandardDeviationFormula,
  VarianceFormula,
} from "./formulas";
import { MeasureList } from "./measure-list";
import type { MarketSummary } from "./measure-summaries";
import styles from "./measures.module.css";
import { ReturnTables } from "./return-tables";

/** The measures of the IHSG over the months of the stock or the portfolio beside it, and the rate free of risk, which the return that CAPM requires takes. */
export function MarketSection({
  market,
}: {
  market: MarketSummary;
}): ReactNode {
  const index = marketIndex.code;
  const { riskFreeRate } = market;
  return (
    <>
      <h2>{m.measures_market_title({ index })}</h2>
      <MeasureList
        rows={[
          {
            label: m.measures_market_expected_return_label({ index }),
            concept: "market",
            inputs: (
              <ReturnTables
                showHeading={false}
                instruments={[{ code: index, returns: market.returns }]}
              />
            ),
            value: formatPercent(market.expectedReturn, "two"),
            formula: <MeanFormula of="M" count={market.returns.length} />,
          },
          {
            label: m.measures_market_variance_label({ index }),
            value: formatVariance(market.variance),
            formula: <VarianceFormula of="M" />,
          },
          {
            label: m.measures_market_standard_deviation_label({ index }),
            concept: "risk",
            value: formatPercent(market.standardDeviation, "two"),
            formula: (
              <StandardDeviationFormula of="M" variance={market.variance} />
            ),
          },
          {
            label: m.measures_risk_free_rate_label(),
            concept: "riskFree",
            value: formatPercent(riskFreeRate.value, "two"),
            formula: <RiskFreeFormula rate={riskFreeRate} />,
          },
        ]}
      />
      <p className={styles["details"]}>
        {m.measures_bi_rate_notice({
          rate: formatPercent(riskFreeRate.inputs.annualRate),
          date: formatCalendarDate(riskFreeRate.inputs.announcedOn),
        })}
      </p>
      <a href={riskFreeRate.inputs.source} className={styles["link"]}>
        {m.measures_bi_rate_link()}
      </a>
    </>
  );
}
