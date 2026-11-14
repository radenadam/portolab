import type { ReactNode } from "react";
import { ChangeText } from "~/change-text";
import { RiskMap } from "~/charts/risk-map";
import { RiskMapLegend } from "~/charts/risk-map-legend";
import type { MapPoint, MarkedPoint } from "~/charts/layout-risk-map";
import { marketIndex } from "~/features/market-data/tracked-instruments";
import { formatBeta, formatPercent, formatSignedPercent } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { beta } from "~/units/beta";
import type { Beta } from "~/units/beta";
import { monthlyReturn } from "~/units/monthly-return";
import type { MonthlyReturn } from "~/units/monthly-return";
import { riskFreeSymbol, SecurityMarketLineFormula } from "./formulas";
import { MeasureTable } from "./measure-table";
import { marketBeta } from "./market-beta";
import type { MeasureTableRow } from "./measure-table";
import styles from "./measures.module.css";
import type {
  ChartedLine,
  HoldingOnLine,
  LinePoint,
  StockOnLine,
} from "./read-measures.server";

/** The names of the portfolio and of its stocks for the reader of the map: the portfolio as the map labels it, and its stocks as the legend names them. */
interface PortfolioNames {
  portfolio: string;
  holdings: string;
}

/** A symbol of decision 0020 that names a point in the table of the points, with its subscript if it has one, such as R with the subscript f. */
interface PointSymbol {
  letter: string;
  subscript: string | undefined;
}

/** A row of the table of the points: the name of the point and its numbers. */
interface TablePoint extends LinePoint {
  key: string;
  title: ReactNode;
}

// The table names the risk-free rate, the IHSG, and the portfolio with the symbols that the formula of the line gives them, as decision 0035 sets, while the map names them in words.
const riskFreeName: PointSymbol = { ...riskFreeSymbol };
const marketName: PointSymbol = { letter: "M", subscript: undefined };
const portfolioName: PointSymbol = { letter: "p", subscript: undefined };
// The key of the portfolio is not a code of a stock, so it never meets the key of a stock.
const portfolioKey = "portfolio";

/** What the line runs through, the legend, the map of the line and its points, the formula of the line, and the table of every point, as decisions 0023 and 0035 set. */
export function MarketLineFigure({
  line,
  portfolio,
  holdings,
  otherStocks,
  names,
  labelledBy,
}: {
  line: ChartedLine;
  /** The portfolio, or undefined while it has no measures. */
  portfolio: LinePoint | undefined;
  /** The stocks of the portfolio that lie against the line. */
  holdings: readonly HoldingOnLine[];
  otherStocks: readonly StockOnLine[];
  names: PortfolioNames;
  /** The id of the heading that names the map. */
  labelledBy: string;
}): ReactNode {
  const index = marketIndex.code;
  const market: LinePoint = {
    beta: marketBeta,
    expectedReturn: line.marketExpectedReturn,
    distance: monthlyReturn(0),
  };
  const points: MarkedPoint<Beta, MonthlyReturn>[] = [
    ...holdings.map((stock) => ({
      ...mapPoint(stock.code, stock.code, stock),
      mark: { kind: "held" as const, weight: stock.weight },
    })),
    ...otherStocks.map((stock) => ({
      ...mapPoint(stock.code, stock.code, stock),
      mark: { kind: "other" as const },
    })),
  ];
  const tablePoints: TablePoint[] = [
    {
      key: "riskFree",
      title: (
        <PointName
          name={m.measures_risk_free_rate_label()}
          symbol={riskFreeName}
        />
      ),
      beta: beta(0),
      expectedReturn: line.riskFreeRate,
      distance: monthlyReturn(0),
    },
    {
      key: index,
      title: <PointName name={index} symbol={marketName} />,
      ...market,
    },
  ];
  if (portfolio !== undefined) {
    points.push({
      ...mapPoint(portfolioKey, names.portfolio, portfolio),
      mark: { kind: "own" },
    });
    tablePoints.push({
      key: portfolioKey,
      title: <PointName name={names.portfolio} symbol={portfolioName} />,
      ...portfolio,
    });
  }
  for (const stock of [...holdings, ...otherStocks]) {
    tablePoints.push({ key: stock.code, title: stock.code, ...stock });
  }
  return (
    <>
      <p>{m.measures_line_notice({ index })}</p>
      <RiskMapLegend
        items={[
          ...(portfolio === undefined
            ? []
            : [{ kind: "own" as const, name: names.portfolio }]),
          ...(holdings.length === 0
            ? []
            : [{ kind: "held" as const, name: names.holdings }]),
          ...(otherStocks.length === 0
            ? []
            : [
                {
                  kind: "other" as const,
                  name: m.measures_line_other_stocks_label(),
                },
              ]),
          { kind: "market", name: index },
          { kind: "line", name: m.measures_line_short_label() },
        ]}
      />
      <p className={styles["details"]}>{m.measures_map_vertical_notice()}</p>
      <RiskMap
        market={mapPoint(index, index, market)}
        points={points}
        across={{
          style: "decimal",
          toValue: beta,
          title: m.measures_beta_label({ index }),
        }}
        up={{ style: "percent", toValue: monthlyReturn }}
        line={{
          name: m.measures_line_short_label(),
          start: { across: beta(0), up: line.riskFreeRate },
        }}
        levelLabel={m.app_map_value_part({
          name: index,
          value: formatPercent(line.marketExpectedReturn, "two"),
        })}
        labelledBy={labelledBy}
      />
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
          rows={tablePoints.map(tableRow)}
        />
      </details>
    </>
  );
}

/** A point of the map at its beta and its expected return, with the values that the table of the points gives it, which its tooltip shows. */
function mapPoint(
  key: string,
  name: string,
  point: LinePoint,
): MapPoint<Beta, MonthlyReturn> {
  return {
    key,
    name,
    across: point.beta,
    up: point.expectedReturn,
    values: [
      {
        name: m.measures_beta_label({ index: marketIndex.code }),
        value: formatBeta(point.beta),
      },
      {
        name: m.measures_expected_return_label(),
        value: formatPercent(point.expectedReturn, "two"),
      },
      {
        name: m.measures_market_line_label(),
        value: formatSignedPercent(point.distance),
      },
    ],
  };
}

function tableRow(point: TablePoint): MeasureTableRow {
  return {
    key: point.key,
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

/** The name of a point of the table with its symbol. */
function PointName({
  name,
  symbol,
}: {
  name: string;
  symbol: PointSymbol;
}): ReactNode {
  return (
    <>
      {name} ({symbol.letter}
      {symbol.subscript !== undefined && <sub>{symbol.subscript}</sub>})
    </>
  );
}
