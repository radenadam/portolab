import type { ReactNode } from "react";
import { ChangeText } from "~/change-text";
import { countedText } from "~/counted-text";
import tableStyles from "~/data-table.module.css";
import { marketIndex } from "~/features/market-data/tracked-instruments";
import {
  formatCalendarDate,
  formatList,
  formatMarketClock,
  formatSignedPercent,
} from "~/formatting";
import { m } from "~/paraglide/messages.js";
import type { HistoryEnd, ReturnPoint } from "./portfolio-history";
import { ReturnChart } from "./return-chart";
import { textForReader } from "./text-for-reader";
import type { PortfolioReader } from "./text-for-reader";
import styles from "./trading.module.css";

// The license of Lightweight Charts asks every page that shows a chart for the attribution notice of its NOTICE file and a link to TradingView. The notice names the library and its owner, so it reads the same in every language.
const chartNotice = "TradingView Lightweight Charts™ © 2025 TradingView, Inc.";
const chartNoticeAddress = "https://www.tradingview.com/";

/** The return of a portfolio against the IHSG at each final close since the start, as a chart and a table of its points, and up to which day the returns reach. */
export function ReturnSection({
  points,
  end,
  reader,
}: {
  points: readonly ReturnPoint[];
  end: HistoryEnd;
  reader: PortfolioReader;
}): ReactNode {
  const start = points[0];
  const seriesLabel = textForReader(reader, {
    owner: () => m.trading_portfolio_series_label(),
    lecturer: () => m.trading_lecturer_portfolio_series_label(),
  });
  return (
    <>
      {start !== undefined && (
        <>
          <p>
            {textForReader(reader, {
              owner: () =>
                m.trading_chart_notice({
                  index: marketIndex.code,
                  date: formatCalendarDate(start.date),
                }),
              lecturer: (name) =>
                m.trading_lecturer_chart_notice({
                  index: marketIndex.code,
                  date: formatCalendarDate(start.date),
                  name,
                }),
            })}
          </p>
          {/* The legend names the lines of the chart, which screen readers skip, as they do the chart. */}
          <ul className={styles["legend"]} aria-hidden>
            <li className={styles["portfolioSeries"]}>{seriesLabel}</li>
            <li className={styles["marketSeries"]}>{marketIndex.code}</li>
          </ul>
          <ReturnChart points={points} />
          <details className={styles["returns"]}>
            <summary>{m.trading_returns_table_label()}</summary>
            <ReturnTable points={points} seriesLabel={seriesLabel} />
          </details>
        </>
      )}
      <p className={styles["details"]}>{historyEndText(end, reader)}</p>
      {start !== undefined && (
        <p className={styles["details"]}>
          <a href={chartNoticeAddress} className={styles["link"]}>
            {m.trading_chart_credit_link({ notice: chartNotice })}
          </a>
        </p>
      )}
    </>
  );
}

function ReturnTable({
  points,
  seriesLabel,
}: {
  points: readonly ReturnPoint[];
  /** The name of the column of the portfolio, which also names its line in the legend of the chart. */
  seriesLabel: string;
}): ReactNode {
  return (
    <table className={tableStyles["table"]}>
      <thead>
        <tr>
          <th scope="col">{m.trading_trading_day_label()}</th>
          <th scope="col">{seriesLabel}</th>
          <th scope="col">{marketIndex.code}</th>
        </tr>
      </thead>
      <tbody>
        {points.map((point) => (
          <tr key={point.date}>
            <th scope="row">{formatCalendarDate(point.date, "medium")}</th>
            <td className={tableStyles["number"]}>
              <ChangeText change={formatSignedPercent(point.portfolio)} />
            </td>
            <td className={tableStyles["number"]}>
              <ChangeText change={formatSignedPercent(point.market)} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function historyEndText(end: HistoryEnd, reader: PortfolioReader): string {
  switch (end.kind) {
    case "notFinal":
      return m.trading_chart_not_final_notice({
        date: formatCalendarDate(end.date),
        time: formatMarketClock(end.finalAt),
      });
    case "missingCloses":
      return countedText(
        end.codes.length,
        {
          one: m.trading_one_missing_close_notice,
          several: m.trading_several_missing_closes_notice,
        },
        {
          codes: formatList(end.codes, "conjunction"),
          date: formatCalendarDate(end.date),
        },
      );
    case "missingCalendar":
      return missingCalendarText(reader);
  }
}

/** The text that says that Portolab has not recorded the trading calendar of the next trading day, with the step of its reader. */
export function missingCalendarText(reader: PortfolioReader): string {
  return textForReader(reader, {
    owner: () => m.trading_chart_calendar_missing_notice(),
    lecturer: () => m.trading_lecturer_chart_calendar_missing_notice(),
  });
}
