import type { ReactNode } from "react";
import { TimeChart } from "~/charts/time-chart";
import { countedText } from "~/counted-text";
import { marketIndex } from "~/features/market-data/tracked-instruments";
import {
  formatCalendarDate,
  formatList,
  formatMarketClock,
} from "~/formatting";
import { m } from "~/paraglide/messages.js";
import type { Result } from "~/result";
import type {
  HistoryEnd,
  MissingCalendar,
  PortfolioHistory,
  ReturnPoint,
} from "./portfolio-history";
import { textForReader } from "./text-for-reader";
import type { PortfolioReader } from "./text-for-reader";
import styles from "./trading.module.css";

// The heading of the section names the chart of the returns, whose plot is a slider in the browser.
const headingId = "return-heading";

/** The section of the return of a portfolio against the IHSG at each final close since the start, as a chart with the table of its points, and up to which day the returns reach, or why Portolab cannot show them. */
export function ReturnSection({
  history,
  reader,
}: {
  history: Result<PortfolioHistory, MissingCalendar>;
  reader: PortfolioReader;
}): ReactNode {
  const index = marketIndex.code;
  return (
    <section>
      <h2 id={headingId}>
        {textForReader(reader, {
          owner: () => m.trading_return_title({ index }),
          lecturer: () => m.trading_lecturer_return_title({ index }),
        })}
      </h2>
      {history.ok ? (
        <Returns
          points={history.value.points}
          end={history.value.end}
          reader={reader}
        />
      ) : (
        <p>{missingCalendarText(reader)}</p>
      )}
    </section>
  );
}

function Returns({
  points,
  end,
  reader,
}: {
  points: readonly ReturnPoint[];
  end: HistoryEnd;
  reader: PortfolioReader;
}): ReactNode {
  const start = points[0];
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
          <TimeChart
            points={points}
            lines={[
              {
                name: textForReader(reader, {
                  owner: () => m.trading_portfolio_series_label(),
                  lecturer: () => m.trading_lecturer_portfolio_series_label(),
                }),
                kind: "own",
                valueOf: (point) => point.portfolio,
              },
              {
                name: marketIndex.code,
                kind: "reference",
                valueOf: (point) => point.market,
              },
            ]}
            labelledBy={headingId}
            dateLabel={m.trading_trading_day_label()}
            tableLabel={m.trading_returns_table_label()}
          />
        </>
      )}
      <p className={styles["details"]}>{historyEndText(end, reader)}</p>
    </>
  );
}

export function historyEndText(
  end: HistoryEnd,
  reader: PortfolioReader,
): string {
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
