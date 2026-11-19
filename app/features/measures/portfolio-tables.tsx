import type { ReactNode } from "react";
import { marketIndex } from "~/features/market-data/tracked-instruments";
import {
  formatBeta,
  formatCorrelation,
  formatList,
  formatPercent,
  formatRupiah,
  formatVariance,
} from "~/formatting";
import type { PortfolioReader } from "~/features/trading/text-for-reader";
import { m } from "~/paraglide/messages.js";
import { portfolioWeight } from "~/units/portfolio-weight";
import type { PortfolioWeight } from "~/units/portfolio-weight";
import type { Rupiah } from "~/units/rupiah";
import type { HoldingRiskSummary, PortfolioSummary } from "./measure-summaries";
import { MeasureTable, StockLink } from "./measure-table";
import type { MeasureTableRow } from "./measure-table";
import { QuoteTime } from "~/features/market-data/quote-time";
import { sharedQuoteTime } from "~/features/market-data/shared-quote-time";

/** The codes and the times of the prices behind the weights of a table. */
type QuoteTimes = readonly { code: string; quotedAt: Date }[];

/** The name of a stock with the time of its price under it when that time differs from the time that the screen states once, because the weight beside it comes from that price. */
function withQuoteTime(
  name: ReactNode,
  code: string,
  quotes: QuoteTimes | undefined,
): ReactNode {
  const quote = quotes?.find((candidate) => candidate.code === code);
  if (quote === undefined) return name;
  return (
    <>
      {name}
      <QuoteTime
        quotedAt={quote.quotedAt}
        sharedTime={sharedQuoteTime(quotes ?? [])}
        below
      />
    </>
  );
}

// The total value is the whole of which every weight is a share.
const wholePortfolio = portfolioWeight(1);

function valueRow(
  { key, name }: { key: string; name: ReactNode },
  value: Rupiah,
  weight: PortfolioWeight,
): MeasureTableRow {
  return {
    key,
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
  quoteTimes,
}: {
  portfolio: PortfolioSummary;
  quoteTimes?: QuoteTimes;
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
          valueRow(
            {
              key: holding.code,
              name: withQuoteTime(holding.code, holding.code, quoteTimes),
            },
            holding.value,
            holding.weight,
          ),
        ),
        valueRow(
          { key: "cash", name: m.measures_cash_label() },
          portfolio.cash.value,
          portfolio.cash.weight,
        ),
        valueRow(
          { key: "total", name: m.measures_total_label() },
          portfolio.totalValue,
          wholePortfolio,
        ),
      ]}
    />
  );
}

/** The weight, the expected return, and the beta of each stock of a portfolio over the months of the portfolio. For the owner, each stock links to its own page, which only a student of the class opens. */
export function HoldingTable({
  portfolio,
  reader,
  measure,
  quoteTimes,
}: {
  portfolio: PortfolioSummary;
  reader: PortfolioReader;
  measure?: "expectedReturn" | "beta";
  quoteTimes?: QuoteTimes;
}): ReactNode {
  const measures: readonly ("expectedReturn" | "beta")[] =
    measure === undefined ? ["expectedReturn", "beta"] : [measure];
  const columns: Record<
    (typeof measures)[number],
    {
      label: string;
      value: (holding: PortfolioSummary["holdings"][number]) => string;
    }
  > = {
    expectedReturn: {
      label: m.measures_expected_return_label(),
      value: (holding) => formatPercent(holding.expectedReturn, "two"),
    },
    beta: {
      label: m.measures_beta_label({ index: marketIndex.code }),
      value: (holding) => formatBeta(holding.beta),
    },
  };
  return (
    <MeasureTable
      header={[
        m.measures_stock_label(),
        m.measures_weight_label(),
        ...measures.map((column) => columns[column].label),
      ]}
      rows={portfolio.holdings.map((holding) => ({
        key: holding.code,
        name: withQuoteTime(
          stockName(holding.code, reader),
          holding.code,
          quoteTimes,
        ),
        cells: {
          kind: "numbers",
          values: [
            formatPercent(holding.weight, "two"),
            ...measures.map((column) => columns[column].value(holding)),
          ],
        },
      }))}
    />
  );
}

function stockName(code: string, reader: PortfolioReader): ReactNode {
  switch (reader.kind) {
    case "owner":
      return (
        <StockLink
          classId={reader.classId}
          code={code}
          id={`holding-${code}`}
        />
      );
    case "lecturer":
      return code;
  }
}

/** The covariance and the correlation of each pair of stocks of a portfolio, and of each stock with itself. */
export function PairTable({
  portfolio,
}: {
  portfolio: Pick<PortfolioSummary, "pairs">;
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

/** The weight of each stock of a portfolio, its covariance with the portfolio, the share of the variance of the portfolio that it adds, and its correlation with the portfolio. */
export function RiskTable({
  risks,
}: {
  risks: readonly HoldingRiskSummary[];
}): ReactNode {
  return (
    <MeasureTable
      header={[
        m.measures_stock_label(),
        m.measures_weight_label(),
        m.measures_covariance_with_portfolio_label(),
        m.measures_variance_share_label(),
        m.measures_correlation_with_portfolio_label(),
      ]}
      rows={risks.map((risk) => ({
        key: risk.code,
        name: risk.code,
        cells: {
          kind: "numbers",
          values: [
            formatPercent(risk.weight, "two"),
            formatVariance(risk.covarianceWithPortfolio),
            formatPercent(risk.varianceShare, "two"),
            formatCorrelation(risk.correlationWithPortfolio),
          ],
        },
      }))}
    />
  );
}
