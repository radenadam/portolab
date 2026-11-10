import type { ReactNode } from "react";
import type { ClassId } from "~/features/classes/classes.schema";
import { marketIndex } from "~/features/market-data/tracked-instruments";
import {
  formatBeta,
  formatCorrelation,
  formatList,
  formatPercent,
  formatRupiah,
  formatVariance,
} from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { portfolioWeight } from "~/units/portfolio-weight";
import type { PortfolioWeight } from "~/units/portfolio-weight";
import type { Rupiah } from "~/units/rupiah";
import type { PortfolioSummary } from "./measure-summaries";
import { MeasureTable, StockLink } from "./measure-table";
import type { MeasureTableRow } from "./measure-table";

// The total value is the whole of which every weight is a share.
const wholePortfolio = portfolioWeight(1);

function valueRow(
  name: string,
  value: Rupiah,
  weight: PortfolioWeight,
): MeasureTableRow {
  return {
    key: name,
    name,
    cells: {
      kind: "numbers",
      values: [formatRupiah(value), formatPercent(weight, "two")],
    },
  };
}

/** The value and the weight of each stock of a portfolio and of its cash, and the total value of which each weight is a share. */
export function WeightTable({
  portfolio,
}: {
  portfolio: PortfolioSummary;
}): ReactNode {
  return (
    <MeasureTable
      header={[
        m.measures_stock_label(),
        m.measures_value_label(),
        m.measures_weight_label(),
      ]}
      rows={[
        ...portfolio.holdings.map((holding) =>
          valueRow(holding.code, holding.value, holding.weight),
        ),
        valueRow(
          m.measures_cash_label(),
          portfolio.cash.value,
          portfolio.cash.weight,
        ),
        valueRow(
          m.measures_total_label(),
          portfolio.totalValue,
          wholePortfolio,
        ),
      ]}
    />
  );
}

/** The weight, the expected return, and the beta of each stock of a portfolio over the months of the portfolio, each stock with a link to its own page. */
export function HoldingTable({
  classId,
  portfolio,
}: {
  classId: ClassId;
  portfolio: PortfolioSummary;
}): ReactNode {
  return (
    <MeasureTable
      header={[
        m.measures_stock_label(),
        m.measures_weight_label(),
        m.measures_expected_return_label(),
        m.measures_beta_label({ index: marketIndex.code }),
      ]}
      rows={portfolio.holdings.map((holding) => ({
        key: holding.code,
        name: <StockLink classId={classId} code={holding.code} />,
        cells: {
          kind: "numbers",
          values: [
            formatPercent(holding.weight, "two"),
            formatPercent(holding.expectedReturn, "two"),
            formatBeta(holding.beta),
          ],
        },
      }))}
    />
  );
}

/** The covariance and the correlation of each pair of stocks of a portfolio, and of each stock with itself. */
export function PairTable({
  portfolio,
}: {
  portfolio: PortfolioSummary;
}): ReactNode {
  return (
    <MeasureTable
      header={[
        m.measures_pair_label(),
        m.measures_pair_covariance_label(),
        m.measures_pair_correlation_label(),
      ]}
      rows={portfolio.pairs.map((pair) => ({
        key: `${pair.first} ${pair.second}`,
        name: formatList(
          pair.first === pair.second ? [pair.first] : [pair.first, pair.second],
          "conjunction",
        ),
        cells: {
          kind: "numbers",
          values: [
            formatVariance(pair.covariance),
            formatCorrelation(pair.correlation),
          ],
        },
      }))}
    />
  );
}
