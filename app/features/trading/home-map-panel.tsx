import { portfolioPath } from "./portfolio-path";
import {
  textForReader,
  portfolioStudentName,
  portfolioKindForReader,
} from "./text-for-reader";
import type { PortfolioReader } from "./text-for-reader";
import type { HomeMapView } from "./parse-home-map-view";
import { NumberText } from "~/number-text";
import type { ReactNode } from "react";
import { Link, useLocation } from "react-router";
import type { ClassId } from "~/features/classes/classes.schema";
import { formatNumber } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { homeInsight, homeInsightData } from "./home-insight";
import type { HomePortfolioData } from "./read-home-portfolio.server";
import { HomeInsightLesson } from "./home-insight-lesson";
import { HomeMapContent } from "./home-map-content";
import { homeWelcomeInsight } from "./home-welcome-insight";
import styles from "./home-portfolio.module.css";

export function HomeMapPanel({
  home,
  classId,
  reader,
  welcome = false,
}: {
  home: HomePortfolioData;
  classId: ClassId;
  reader: PortfolioReader;
  welcome?: boolean;
}): ReactNode {
  const location = useLocation();
  const portfolioKind = portfolioKindForReader(reader);
  const path = (view: HomeMapView): string => {
    if (reader.kind === "owner") {
      const base = portfolioPath(classId, portfolioKind);
      return view === "map" ? base : `${base}?view=${view}`;
    }
    const search = new URLSearchParams(location.search);
    search.set("view", view);
    return `${location.pathname}?${search.toString()}`;
  };
  const view = welcome ? "map" : home.view;
  const name = portfolioStudentName(reader);
  const insightData = homeInsightData(home);
  const insight = welcome
    ? homeWelcomeInsight(
        home.classmates.length,
        home.report.market !== undefined,
      )
    : homeInsight(insightData, name);
  return (
    <section
      className={styles["mapPanel"]}
      data-welcome={welcome || undefined}
      aria-labelledby="home-map-heading"
    >
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
          {!welcome && (
            <nav
              className={styles["viewChoice"]}
              aria-label={m.trading_home_map_view_label()}
            >
              <Link
                to={path("map")}
                aria-current={view === "map" ? "page" : undefined}
              >
                {m.trading_home_map_label()}
              </Link>
              <Link
                to={path("time")}
                aria-current={view === "time" ? "page" : undefined}
              >
                {m.trading_home_time_label()}
              </Link>
            </nav>
          )}
        </div>
        <HomeMapContent
          home={home}
          classId={classId}
          reader={reader}
          view={view}
          welcome={welcome}
        />
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
              welcome
                ? insight.text
                : homeInsight(
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
