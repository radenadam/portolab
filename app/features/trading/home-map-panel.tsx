import type { ReactNode } from "react";
import { Link } from "react-router";
import { RiskMap } from "~/charts/risk-map";
import { RiskMapLegend } from "~/charts/risk-map-legend";
import { PortfolioReturnChart } from "./portfolio-return-chart";
import { classPath } from "~/features/classes/class-path";
import type { ClassId } from "~/features/classes/classes.schema";
import { marketIndex } from "~/features/market-data/tracked-instruments";
import {
  formatCalendarDatePart,
  formatMarketTime,
  formatNumber,
} from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { beta } from "~/units/beta";
import { cumulativeReturn } from "~/units/cumulative-return";
import { homeMapPoints } from "./home-map-points";
import { homeInsight, homeInsightData } from "./home-insight";
import type { HomePortfolioData } from "./read-home-portfolio.server";
import { HomeMapTable } from "./home-map-table";
import { HomeInsightLesson } from "./home-insight-lesson";
import { historyEndText, missingCalendarText } from "./return-section";
import styles from "./home-portfolio.module.css";

export function HomeMapPanel({
  home,
  classId,
}: {
  home: HomePortfolioData;
  classId: ClassId;
}): ReactNode {
  const map = homeMapPoints(home);
  const history = home.report.history;
  const first = history.ok ? history.value.points[0] : undefined;
  const insight = homeInsight(homeInsightData(home));
  const market = home.report.market;
  const emptyText = homeChartFailure(home, classId);
  return (
    <section className={styles["mapPanel"]} aria-labelledby="home-map-heading">
      <div className={styles["mapContent"]}>
        <div className={styles["mapHeading"]}>
          <h2 id="home-map-heading">{m.trading_home_map_title()}</h2>
          <nav
            className={styles["viewChoice"]}
            aria-label={m.trading_home_map_view_label()}
          >
            <Link
              to={classPath(classId)}
              aria-current={home.view === "map" ? "page" : undefined}
            >
              {m.trading_home_map_label()}
            </Link>
            <Link
              to={`${classPath(classId)}?view=time`}
              aria-current={home.view === "time" ? "page" : undefined}
            >
              {m.trading_home_time_label()}
            </Link>
          </nav>
        </div>
        {home.view === "map" ? (
          <>
            <RiskMapLegend
              items={[
                { kind: "own", name: m.trading_home_portfolio_label() },
                { kind: "held", name: m.trading_home_holdings_key_label() },
                { kind: "market", name: marketIndex.code },
                { kind: "classmate", name: m.trading_home_classmates_label() },
              ]}
            />
            {first !== undefined && (
              <p className={styles["note"]}>
                {m.trading_home_map_basis_notice({
                  date: formatCalendarDatePart(first.date, "dayAndMonth"),
                })}
              </p>
            )}
            {map === undefined ? (
              <p className={styles["empty"]}>{emptyText}</p>
            ) : (
              <>
                <div className={styles["largeMap"]}>
                  <RiskMap
                    {...map}
                    across={{
                      style: "decimal",
                      toValue: beta,
                      title: m.trading_home_map_axis_label({
                        beta: formatNumber(1),
                      }),
                    }}
                    up={{ style: "percent", toValue: cumulativeReturn }}
                    labelledBy="home-map-heading"
                  />
                </div>
                <HomeMapTable map={map} classId={classId} />
              </>
            )}
            {market !== undefined && (
              <p className={styles["note"]}>
                {m.trading_home_map_prices_notice({
                  index: marketIndex.code,
                  time: formatMarketTime(market.quote.quotedAt),
                })}
                {home.report.quoteAttempt?.failedCodes.includes(
                  marketIndex.code,
                ) === true && <> {m.trading_home_quote_failed_notice()}</>}
              </p>
            )}
          </>
        ) : (
          <div className={styles["largeTime"]}>
            {history.ok && history.value.points.length > 0 ? (
              <PortfolioReturnChart
                points={history.value.points}
                labelledBy="home-map-heading"
                annotations={home.sessions.map(({ session, date }) => ({
                  date,
                  label: m.trading_home_session_label({
                    session: formatNumber(session),
                  }),
                }))}
              />
            ) : (
              <p className={styles["empty"]}>{emptyText}</p>
            )}
          </div>
        )}
      </div>
      <div className={styles["insight"]}>
        <span className={styles["sessionBadge"]}>
          {m.trading_home_insight_session_label({
            session: formatNumber(insight.session),
            topic: insight.topic,
          })}
        </span>
        <p>{insight.text}</p>
        <HomeInsightLesson session={insight.session} lessons={home.lessons} />
      </div>
    </section>
  );
}

function homeChartFailure(home: HomePortfolioData, classId: ClassId): string {
  const reader = { kind: "owner", classId } as const;
  if (!home.report.history.ok) return missingCalendarText(reader);
  switch (home.view) {
    case "map":
      return m.trading_home_map_unavailable_notice({ index: marketIndex.code });
    case "time":
      return historyEndText(home.report.history.value.end, reader);
  }
}
