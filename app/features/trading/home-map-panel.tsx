import { portfolioPath } from "./portfolio-path";
import { portfolioLabel } from "./portfolio-label";
import {
  textForReader,
  portfolioStudentName,
  readerWithTextName,
  portfolioKindForReader,
} from "./text-for-reader";
import type { PortfolioReader } from "./text-for-reader";
import { NumberText } from "~/number-text";
import type { ReactNode } from "react";
import { Link, useLocation } from "react-router";
import { RiskMap } from "~/charts/risk-map";
import { RiskMapLegend } from "~/charts/risk-map-legend";
import { PortfolioReturnChart } from "./portfolio-return-chart";
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
  reader,
}: {
  home: HomePortfolioData;
  classId: ClassId;
  reader: PortfolioReader;
}): ReactNode {
  const location = useLocation();
  const portfolioKind = portfolioKindForReader(reader);
  const path = (view: string): string => {
    if (reader.kind === "owner")
      return `${portfolioPath(classId, portfolioKind)}?view=${view}`;
    const search = new URLSearchParams(location.search);
    search.set("view", view);
    return `${location.pathname}?${search.toString()}`;
  };
  const map = homeMapPoints(home, reader);
  const name = portfolioStudentName(reader);
  const history = home.report.history;
  const first = history.ok ? history.value.points[0] : undefined;
  const insightData = homeInsightData(home);
  const insight = homeInsight(insightData, name);
  const market = home.report.market;
  const emptyText = (textValue: (value: string) => string): string =>
    homeChartFailure(home, readerWithTextName(reader, textValue));
  return (
    <section className={styles["mapPanel"]} aria-labelledby="home-map-heading">
      <div className={styles["mapContent"]}>
        <div className={styles["mapHeading"]}>
          <h2 id="home-map-heading">
            <NumberText verbatim>
              {textForReader(reader, {
                owner: m.trading_home_map_title,
                lecturer: (name) => m.trading_home_student_map_title({ name }),
              })}
            </NumberText>
          </h2>
          <nav
            className={styles["viewChoice"]}
            aria-label={m.trading_home_map_view_label()}
          >
            <Link
              to={path("map")}
              aria-current={home.view === "map" ? "page" : undefined}
            >
              {m.trading_home_map_label()}
            </Link>
            <Link
              to={path("time")}
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
                {
                  kind: "own",
                  name: portfolioLabel(name),
                },
                {
                  kind: "held",
                  name: textForReader(reader, {
                    owner: m.trading_home_holdings_key_label,
                    lecturer: (name) =>
                      m.trading_home_student_holdings_label({ name }),
                  }),
                },
                { kind: "market", name: marketIndex.code },
                {
                  kind: "classmate",
                  name: {
                    membership: m.trading_home_classmates_label,
                    demonstration: m.trading_demonstration_students_label,
                  }[portfolioKind](),
                },
              ]}
            />
            {first !== undefined && (
              <p className={styles["note"]}>
                <NumberText>
                  {m.trading_home_map_basis_notice({
                    date: formatCalendarDatePart(first.date, "dayAndMonth"),
                  })}
                </NumberText>
              </p>
            )}
            {map === undefined ? (
              <p className={styles["empty"]}>
                <NumberText>{emptyText}</NumberText>
              </p>
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
                <HomeMapTable
                  map={map}
                  classId={classId}
                  keepReturn={reader.kind === "lecturer"}
                />
              </>
            )}
            {market !== undefined && (
              <p className={styles["note"]}>
                <NumberText>
                  {m.trading_home_map_prices_notice({
                    index: marketIndex.code,
                    time: formatMarketTime(market.quote.quotedAt),
                  })}
                </NumberText>
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
                studentName={name}
                labelledBy="home-map-heading"
                annotations={home.sessions.map(({ session, date }) => ({
                  date,
                  label: m.trading_home_session_label({
                    session: formatNumber(session),
                  }),
                }))}
              />
            ) : (
              <p className={styles["empty"]}>
                <NumberText>{emptyText}</NumberText>
              </p>
            )}
          </div>
        )}
      </div>
      <div className={styles["insight"]}>
        <span className={styles["sessionBadge"]}>
          <NumberText>
            {m.trading_home_insight_session_label({
              session: formatNumber(insight.session),
              topic: insight.topic,
            })}
          </NumberText>
        </span>
        <p>
          <NumberText>
            {(textValue) =>
              homeInsight(
                insightData,
                name === undefined ? undefined : textValue(name),
              ).text
            }
          </NumberText>
        </p>
        <HomeInsightLesson session={insight.session} />
      </div>
    </section>
  );
}

function homeChartFailure(
  home: HomePortfolioData,
  reader: PortfolioReader,
): string {
  if (!home.report.history.ok) return missingCalendarText(reader);
  switch (home.view) {
    case "map":
      return textForReader(reader, {
        owner: () =>
          m.trading_home_map_unavailable_notice({ index: marketIndex.code }),
        lecturer: (name) =>
          m.trading_home_student_map_unavailable_notice({
            index: marketIndex.code,
            name,
          }),
      });
    case "time":
      return historyEndText(home.report.history.value.end, reader);
  }
}
