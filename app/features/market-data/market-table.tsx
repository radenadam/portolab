import { MarketMeasureHelp } from "./market-measure-help";
import type { readMarket } from "./read-market.server";
import { QuoteTime } from "./quote-time";
import { TableHead } from "~/table-head";
import { pathReturningTo } from "~/features/accounts/path-returning-to";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { Sparkline } from "~/charts/sparkline";
import { paddedRange } from "~/charts/scale";
import { ChangeText } from "~/change-text";
import type { ClassId } from "~/features/classes/classes.schema";
import { stockPath } from "./stock-path";
import {
  formatBeta,
  formatNumber,
  formatPercent,
  formatRupiah,
  formatSignedPercent,
} from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { companyOf } from "./company-of";
import type { MarketRow } from "./filter-market-rows";
import { priceChartMonths } from "./price-chart-range";
import type { MarketSort } from "./market-filters";
import type { IndexQuote, Quote } from "./price-source.server";
import { quoteChange } from "./quote-change";
import { sectorNames } from "./sector-names";
import { StockName } from "./stock-name";
import { MarketScale } from "./market-scale";
import styles from "./market-view.module.css";

/** The market rows share scales, so a change or a risk compares at a glance. */
export function MarketTable({
  rows,
  classId,
  failed,
  indexQuote,
  sort,
  returnPath,
  reference,
  index,
}: {
  rows: readonly MarketRow[];
  classId: ClassId;
  failed: ReadonlySet<string>;
  indexQuote: IndexQuote | undefined;
  sort: MarketSort;
  returnPath: string;
  reference: ReturnType<typeof readMarket>["marketReference"];
  index: string;
}): ReactNode {
  const marketDeviation = reference.ok
    ? reference.value.standardDeviation
    : undefined;
  const marketBeta = reference.ok ? reference.value.beta.value : undefined;
  const indexChange =
    indexQuote === undefined ? undefined : displayedChange(indexQuote);
  const changes = rows.flatMap((row) =>
    row.quote === undefined ? [] : [displayedChange(row.quote)],
  );
  const betas = rows.flatMap((row) =>
    row.measures === undefined ? [] : [row.measures.beta],
  );
  const deviations = rows.flatMap((row) =>
    row.measures === undefined ? [] : [row.measures.standardDeviation],
  );
  const changeRange = paddedRange([0, indexChange ?? 0, ...changes], Number);
  const betaRange = paddedRange([marketBeta ?? 0, ...betas], Number);
  const deviationRange = paddedRange(
    [0, marketDeviation ?? 0, ...deviations],
    Number,
  );
  return (
    <table className={styles["table"]} data-layout="table">
      <colgroup>
        <col className={styles["nameColumn"]} />
        <col className={styles["sectorColumn"]} />
        <col className={styles["sparkColumn"]} />
        <col className={styles["priceColumn"]} />
        <col className={styles["changeColumn"]} />
        <col className={styles["measureColumn"]} />
        <col className={styles["measureColumn"]} />
      </colgroup>
      <TableHead
        help={{
          [m.market_data_beta_label()]: (
            <MarketMeasureHelp
              kind="beta"
              reference={reference}
              index={index}
            />
          ),
          [m.market_data_volatility_label()]: (
            <MarketMeasureHelp
              kind="risk"
              reference={reference}
              index={index}
            />
          ),
        }}
        labels={[
          m.market_data_stock_label(),
          m.market_data_sector_label(),
          m.market_data_sparkline_label({
            months: formatNumber(priceChartMonths["1m"]),
          }),
          m.market_data_last_label(),
          m.market_data_change_label(),
          m.market_data_beta_label(),
          m.market_data_volatility_label(),
        ]}
      />
      <tbody>
        {rows.map((row) => (
          <tr key={row.code} id={`stock-${row.code}`}>
            <th scope="row">
              <Link
                className={styles["stockLink"]}
                to={pathReturningTo(
                  stockPath(classId, row.code),
                  `${returnPath}#stock-${row.code}`,
                )}
              >
                <StockName code={row.code} />
                {row.measures !== undefined &&
                  mobileMeasureText(row.measures, sort) !== undefined && (
                    <span className={styles["mobileMeasure"]}>
                      {mobileMeasureText(row.measures, sort)}
                    </span>
                  )}
              </Link>
            </th>
            <td className={styles["sectorCell"]}>
              {sectorNames[companyOf(row.code).sector]()}
            </td>
            <td className={styles["sparkCell"]}>
              <Sparkline closes={row.closes} />
            </td>
            <td className={styles["priceCell"]}>
              {row.quote === undefined ? (
                <span>{m.market_data_no_price_notice({ code: row.code })}</span>
              ) : (
                <>
                  <strong>{formatRupiah(row.quote.price)}</strong>
                  <QuoteTime quotedAt={row.quote.quotedAt} />
                </>
              )}
              {failed.has(row.code) && (
                <span className={styles["missed"]}>
                  {m.market_data_missed_label()}
                </span>
              )}
            </td>
            <td className={styles["changeCell"]}>
              {row.quote !== undefined && (
                <span className={styles["cellScale"]}>
                  <ChangeText
                    colored
                    change={formatSignedPercent(quoteChange(row.quote))}
                  />
                  <MarketScale
                    value={displayedChange(row.quote)}
                    range={changeRange}
                    reference={indexChange}
                    direction={
                      formatSignedPercent(quoteChange(row.quote)).direction
                    }
                  />
                </span>
              )}
            </td>
            {row.measures === undefined ? (
              <td colSpan={2} className={styles["measureCell"]}>
                {row.measureFailure}
              </td>
            ) : (
              <>
                <td className={styles["measureCell"]}>
                  <span className={styles["cellScale"]}>
                    {formatBeta(row.measures.beta)}
                    <MarketScale
                      value={row.measures.beta}
                      range={betaRange}
                      reference={marketBeta}
                    />
                  </span>
                </td>
                <td className={styles["measureCell"]}>
                  <span className={styles["cellScale"]}>
                    {formatPercent(row.measures.standardDeviation, "two")}
                    <MarketScale
                      value={row.measures.standardDeviation}
                      range={deviationRange}
                      reference={marketDeviation}
                    />
                  </span>
                </td>
              </>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function mobileMeasureText(
  measures: NonNullable<MarketRow["measures"]>,
  sort: MarketSort,
): string | undefined {
  switch (sort) {
    case "beta":
      return formatBeta(measures.beta);
    case "volatility":
      return formatPercent(measures.standardDeviation, "two");
    case "change":
    case "price":
    case "code":
      return undefined;
  }
}

// A bar must disappear with a change that Intl rounds to zero, just as its sign and arrow do.
function displayedChange(quote: Quote): number {
  const change = quoteChange(quote);
  return formatSignedPercent(change).direction === "none" ? 0 : change;
}
