import type { ReactNode } from "react";
import { ChangeText } from "~/change-text";
import { marketIndex } from "~/features/market-data/tracked-instruments";
import { formatBeta, formatPercent, formatSignedPercent } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { beta } from "~/units/beta";
import { monthlyReturn } from "~/units/monthly-return";
import type { MonthlyReturn } from "~/units/monthly-return";
import { riskFreeSymbol, SecurityMarketLineFormula } from "./formulas";
import type { Subject } from "./formulas";
import { MarketLineChart, MarketLineLegend } from "./market-line-chart";
import type { ChartPoint, PointKind } from "./market-line-layout";
import { MeasureTable } from "./measure-table";
import type { MeasureTableRow } from "./measure-table";
import styles from "./measures.module.css";
import type { PointLabel } from "./point-labels";
import type {
  ChartedLine,
  PortfolioLine,
  StockOnLine,
} from "./read-measures.server";

// The chart names the IHSG and the portfolio by the subscripts that decision 0020 gives them.
const riskFreeLabel: PointLabel = {
  text: riskFreeSymbol.letter,
  subscript: riskFreeSymbol.subscript,
};
const marketLabel = subjectLabel("M");
const portfolioLabel = subjectLabel("p");

function subjectLabel(subject: Subject): PointLabel {
  return { text: subject, subscript: "" };
}

/** The names of the portfolio and of its stocks for the reader of the chart. */
interface PortfolioNames {
  portfolio: string;
  holdings: string;
}

/** What the line runs through, the legend, the chart, the formula of the line, and the table of every point of the chart. */
export function MarketLineFigure({
  line,
  portfolio,
  otherStocks,
  names,
}: {
  line: ChartedLine;
  portfolio: PortfolioLine | undefined;
  otherStocks: readonly StockOnLine[];
  names: PortfolioNames;
}): ReactNode {
  const index = marketIndex.code;
  const anchors: TablePoint[] = [
    {
      name: "riskFree",
      kind: "riskFree",
      label: riskFreeLabel,
      title: (
        <PointName
          name={m.measures_risk_free_rate_label()}
          label={riskFreeLabel}
        />
      ),
      beta: beta(0),
      expectedReturn: line.riskFreeRate,
      distance: monthlyReturn(0),
    },
    {
      name: "market",
      kind: "market",
      label: marketLabel,
      title: <PointName name={index} label={marketLabel} />,
      beta: beta(1),
      expectedReturn: line.marketExpectedReturn,
      distance: monthlyReturn(0),
    },
  ];
  const points = [
    ...anchors,
    ...portfolioPoints(portfolio, names),
    ...otherStocks.map((stock) => stockPoint(stock, "otherStock")),
  ];
  const legend = legendItems(portfolio, otherStocks, names);
  return (
    <>
      <p>{m.measures_line_notice({ index })}</p>
      {legend.length > 0 && <MarketLineLegend items={legend} />}
      <MarketLineChart line={line} points={points} />
      <p className={styles["details"]}>
        <SecurityMarketLineFormula line={line} />
      </p>
      <details className={styles["points"]}>
        <summary>{m.measures_line_points_label()}</summary>
        <MeasureTable
          header={[
            m.measures_point_label(),
            m.measures_beta_label({ index }),
            m.measures_expected_return_label(),
            m.measures_market_line_label(),
          ]}
          rows={points.map(tableRow)}
        />
      </details>
    </>
  );
}

/** A point of the chart with its name in the table of the points, which also gives its distance from the line. */
interface TablePoint extends ChartPoint {
  title: ReactNode;
  distance: MonthlyReturn;
}

function portfolioPoints(
  portfolio: PortfolioLine | undefined,
  names: PortfolioNames,
): TablePoint[] {
  if (portfolio === undefined) {
    return [];
  }
  return [
    {
      ...portfolio.portfolio,
      name: "portfolio",
      kind: "portfolio",
      label: portfolioLabel,
      title: <PointName name={names.portfolio} label={portfolioLabel} />,
    },
    ...portfolio.holdings.map((holding) => stockPoint(holding, "holding")),
  ];
}

// The chart labels each stock of the portfolio by its code, and only the table names a stock that the portfolio does not hold, because the many marks of those stocks leave no room for their labels.
function stockPoint(
  stock: StockOnLine,
  kind: Extract<PointKind, "holding" | "otherStock">,
): TablePoint {
  const labels: Record<typeof kind, PointLabel | undefined> = {
    holding: { text: stock.code, subscript: "" },
    otherStock: undefined,
  };
  return {
    ...stock,
    name: stock.code,
    kind,
    label: labels[kind],
    title: stock.code,
  };
}

function tableRow(point: TablePoint): MeasureTableRow {
  return {
    key: point.name,
    name: point.title,
    cells: {
      kind: "numbers",
      values: [
        formatBeta(point.beta),
        formatPercent(point.expectedReturn, "two"),
        distanceText(point.distance),
      ],
    },
  };
}

// MeasureTable puts each value in a cell of its own, so a value needs no key of a list.
function distanceText(distance: MonthlyReturn): ReactNode {
  return <ChangeText change={formatSignedPercent(distance)} />;
}

function legendItems(
  portfolio: PortfolioLine | undefined,
  otherStocks: readonly StockOnLine[],
  names: PortfolioNames,
): { kind: PointKind; name: ReactNode }[] {
  const items: { kind: PointKind; name: ReactNode }[] = [];
  if (portfolio !== undefined) {
    items.push(
      {
        kind: "portfolio",
        name: <PointName name={names.portfolio} label={portfolioLabel} />,
      },
      { kind: "holding", name: names.holdings },
    );
  }
  if (otherStocks.length > 0) {
    items.push({
      kind: "otherStock",
      name: m.measures_line_other_stocks_label(),
    });
  }
  return items;
}

/** The name of a point with its symbol, which labels the point on the chart. */
function PointName({
  name,
  label,
}: {
  name: string;
  label: PointLabel;
}): ReactNode {
  return (
    <>
      {name} ({label.text}
      {label.subscript !== "" && <sub>{label.subscript}</sub>})
    </>
  );
}
