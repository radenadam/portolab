import { NumberText } from "~/number-text";
import type { ReactNode } from "react";
import { TimeChart } from "~/charts/time-chart";
import type { ClassId } from "~/features/classes/classes.schema";
import { courseSessions } from "~/features/classes/course-calendar";
import { placeTimeEvents } from "~/charts/place-time-events";
import { PopoverButton } from "~/popover";
import { ConceptHelp } from "~/concept-card";
import { formatCalendarDate } from "~/formatting";
import { marketIndex } from "~/features/market-data/tracked-instruments";
import type { PortfolioReport } from "~/features/trading/read-portfolio-report.server";
import {
  historyEndText,
  missingCalendarText,
} from "~/features/trading/return-section";
import { returnHeadline } from "~/features/trading/return-headline";
import { m } from "~/paraglide/messages.js";
import styles from "./analysis.module.css";
import { courseSessionTitle } from "~/features/classes/course-session-title";

export function AnalysisPerformance({
  history,
  classId,
  firstSessionDate,
}: {
  history: PortfolioReport["history"];
  classId: ClassId;
  firstSessionDate: string | null;
}): ReactNode {
  const reader = { kind: "owner", classId } as const;
  const points = history.ok ? history.value.points : [];
  const latest = points.at(-1);
  const start = points[0];
  const events = courseSessions(firstSessionDate).map((session) => ({
    date: session.date,
    label: courseSessionTitle(session.session, "short"),
  }));
  const hasEvents =
    placeTimeEvents(
      points.map((point) => point.date),
      events,
    ).length > 0;
  return (
    <section
      className={styles["performance"]}
      aria-labelledby="analysis-performance-title"
    >
      <div className={styles["performanceHeader"]}>
        <h2>
          <span id="analysis-performance-title">
            {m.measures_analysis_performance_title({ index: marketIndex.code })}
          </span>
          {start !== undefined && (
            <ConceptHelp
              title={m.measures_analysis_performance_title({
                index: marketIndex.code,
              })}
            >
              <p>
                <NumberText>
                  {m.app_returns_chart_notice({
                    index: marketIndex.code,
                    date: formatCalendarDate(start.date),
                  })}
                </NumberText>
              </p>
              <PopoverButton
                popover="analysis-performance-data"
                className={styles["link"]}
              >
                {m.app_returns_table_label()}
              </PopoverButton>
            </ConceptHelp>
          )}
        </h2>
        {latest !== undefined && (
          <p>
            <NumberText>
              {returnHeadline(latest.portfolio, latest.market)}
            </NumberText>
          </p>
        )}
      </div>
      {latest === undefined ? (
        <p>
          <NumberText>
            {history.ok
              ? historyEndText(history.value.end, reader)
              : missingCalendarText(reader)}
          </NumberText>
        </p>
      ) : (
        <TimeChart
          coloredChanges
          points={points}
          lines={[
            {
              name: m.measures_line_portfolio_label(),
              endName: m.measures_analysis_you_label(),
              kind: "own",
              valueOf: (point) => point.portfolio,
            },
            {
              name: marketIndex.code,
              endName: marketIndex.code,
              kind: "reference",
              valueOf: (point) => point.market,
            },
          ]}
          labelledBy="analysis-performance-title"
          dateLabel={m.app_trading_day_label()}
          tableLabel={m.app_returns_table_label()}
          annotations={events}
          legendNote={
            hasEvents ? m.measures_analysis_session_lines_notice() : undefined
          }
          tablePopover="analysis-performance-data"
          tableNotice={
            history.ok
              ? historyEndText(history.value.end, reader)
              : missingCalendarText(reader)
          }
        />
      )}
    </section>
  );
}
