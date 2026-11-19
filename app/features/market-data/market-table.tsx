import { MarketMeasureHelp } from "./market-measure-help";
import {
  withLessonTask,
  type LessonTask,
} from "~/features/learning/lesson-task";
import type { readMarket } from "./read-market.server";
import { QuoteTime } from "./quote-time";
import { TableHead } from "~/table-head";
import { pathReturningTo } from "~/features/accounts/path-returning-to";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { Sparkline } from "~/charts/sparkline";
import { paddedRange } from "~/charts/scale";
import { ChangeText } from "~/change-text";
import { NumberText } from "~/number-text";
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
import { sectorName } from "./sector-name";
import { StockName } from "./stock-name";
import { MarketScale } from "./market-scale";
import { marketMeasureNotesId } from "./market-measure-notes";
import { marketRowId } from "./market-row-id";
import type { MarketRowPrefix } from "./market-row-id";
import styles from "./market-view.module.css";
import { StarButton } from "~/features/watchlist/star-button";

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
  sharedTime,
  task,
  scaleRows,
  watchedCodes,
  rowPrefix,
}: {
  rows: readonly MarketRow[];
  classId: ClassId;
  failed: ReadonlySet<string>;
  indexQuote: IndexQuote | undefined;
  sort: MarketSort;
  returnPath: string;
  reference: ReturnType<typeof readMarket>["marketReference"];
  index: string;
  sharedTime: Date | undefined;
  task?: LessonTask | undefined;
  scaleRows: readonly MarketRow[];
  watchedCodes: ReadonlySet<string>;
  rowPrefix: MarketRowPrefix;
}): ReactNode {
  const marketDeviation = reference.ok
    ? reference.value.standardDeviation
    : undefined;
  const marketBeta = reference.ok ? reference.value.beta.value : undefined;
  const indexChange =
    indexQuote === undefined ? undefined : displayedChange(indexQuote);
  const changes = scaleRows.flatMap((row) =>
    row.quote === undefined ? [] : [displayedChange(row.quote)],
  );
  const betas = scaleRows.flatMap((row) =>
    row.measures === undefined ? [] : [row.measures.beta],
  );
  const deviations = scaleRows.flatMap((row) =>
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
        <col className={styles["watchColumn"]} />
        <col className={styles["nameColumn"]} />
        <col className={styles["sectorColumn"]} />
        <col className={styles["sparkColumn"]} />
        <col className={styles["priceColumn"]} />
        <col className={styles["changeColumn"]} />
        <col className={styles["measureColumn"]} />
        <col className={styles["measureColumn"]} />
      </colgroup>
      <TableHead
        className={styles["head"]}
        hiddenLabels={[m.market_data_watch_label()]}
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
          m.market_data_watch_label(),
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
          <tr key={row.code} id={marketRowId(rowPrefix, row.code)}>
            <td className={styles["watchCell"]}>
              <StarButton
                classId={classId}
                code={row.code}
                watched={watchedCodes.has(row.code)}
                returnTo={`${returnPath}#${marketRowId("stock", row.code)}`}
              />
            </td>
            <th scope="row">
              <Link
                className={styles["stockLink"]}
                to={withLessonTask(
                  pathReturningTo(
                    stockPath(classId, row.code),
                    `${returnPath}#${marketRowId(rowPrefix, row.code)}`,
                  ),
                  task,
                )}
              >
                <StockName code={row.code} />
                {row.measures !== undefined &&
                  mobileMeasureText(row.measures, sort) !== undefined && (
                    <span className={styles["mobileMeasure"]}>
                      <NumberText>
                        {mobileMeasureText(row.measures, sort)}
                      </NumberText>
                    </span>
                  )}
              </Link>
            </th>
            <td className={styles["sectorCell"]}>
              {sectorName(companyOf(row.code).sector)}
            </td>
            <td className={styles["sparkCell"]}>
              <Sparkline closes={row.closes} />
            </td>
            <td className={styles["priceCell"]}>
              {row.quote === undefined ? (
                <span>{m.market_data_no_price_notice({ code: row.code })}</span>
              ) : (
                <>
                  <strong>
                    <NumberText>{formatRupiah(row.quote.price)}</NumberText>
                  </strong>
                  <QuoteTime
                    quotedAt={row.quote.quotedAt}
                    sharedTime={sharedTime}
                    dayAlone
                    below
                  />
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
              <>
                <UnavailableMeasure />
                <UnavailableMeasure />
              </>
            ) : (
              <>
                <td className={styles["measureCell"]}>
                  <span className={styles["cellScale"]}>
                    <span data-market-value="">
                      <NumberText>{formatBeta(row.measures.beta)}</NumberText>
                    </span>
                    <MarketScale
                      value={row.measures.beta}
                      range={betaRange}
                      reference={marketBeta}
                    />
                  </span>
                </td>
                <td className={styles["measureCell"]}>
                  <span className={styles["cellScale"]}>
                    <span data-market-value="">
                      <NumberText>
                        {formatPercent(row.measures.standardDeviation, "two")}
                      </NumberText>
                    </span>
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

function UnavailableMeasure(): ReactNode {
  return (
    <td
      className={styles["measureCell"]}
      aria-describedby={marketMeasureNotesId}
    >
      <span className={styles["cellScale"]}>
        <span data-market-value="">
          {m.market_data_unavailable_value_label()}
        </span>
      </span>
    </td>
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
