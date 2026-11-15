import { ConceptHelp } from "~/concept-card";
import { NumberText } from "~/number-text";
import type { ReactNode } from "react";
import { PortfolioReturnChart } from "./portfolio-return-chart";
import { marketIndex } from "~/features/market-data/tracked-instruments";
import { formatCalendarDate, formatCalendarDatePart } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import type { ClassId } from "~/features/classes/classes.schema";
import type { PortfolioReport } from "./read-portfolio-report.server";
import { historyEndText, missingCalendarText } from "./return-section";
import { returnHeadline } from "./return-headline";
import styles from "./home-portfolio.module.css";

/** The headline and the lines use the same final close, even while delayed quotes have moved since it. */
export function HomeReturn({
  history,
  classId,
}: {
  history: PortfolioReport["history"];
  classId: ClassId;
}): ReactNode {
  const reader = { kind: "owner", classId } as const;
  const points = history.ok ? history.value.points : [];
  const first = points[0];
  const latest = points.at(-1);
  return (
    <section className={styles["card"]}>
      <div className={styles["valueLabel"]}>
        <h2 id="home-return-heading" className={styles["cardTitle"]}>
          <NumberText>
            {first === undefined
              ? m.trading_return_title({ index: marketIndex.code })
              : m.trading_home_since_title({
                  date: formatCalendarDatePart(first.date, "dayAndMonth"),
                })}
          </NumberText>
        </h2>
        {first !== undefined && (
          <ConceptHelp title={m.trading_home_return_method_label()}>
            <p>
              <NumberText>
                {m.trading_chart_notice({
                  index: marketIndex.code,
                  date: formatCalendarDate(first.date),
                })}
              </NumberText>
            </p>
            <p>
              {history.ok && (
                <NumberText>
                  {historyEndText(history.value.end, reader)}
                </NumberText>
              )}
            </p>
          </ConceptHelp>
        )}
      </div>
      {latest !== undefined && (
        <>
          <p className={styles["lead"]}>
            <NumberText>
              {returnHeadline(latest.portfolio, latest.market)}
            </NumberText>
          </p>
          <PortfolioReturnChart
            points={points}
            labelledBy="home-return-heading"
          />
        </>
      )}
      {first === undefined && (
        <p className={styles["note"]}>
          <NumberText>
            {history.ok
              ? historyEndText(history.value.end, reader)
              : missingCalendarText(reader)}
          </NumberText>
        </p>
      )}
    </section>
  );
}
