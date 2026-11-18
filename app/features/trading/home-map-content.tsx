import type { ReactNode } from "react";
import { RiskMap } from "~/charts/risk-map";
import { RiskMapLegend } from "~/charts/risk-map-legend";
import type { RiskMapLegendItem } from "~/charts/risk-map-legend";
import type { ClassId } from "~/features/classes/classes.schema";
import { marketIndex } from "~/features/market-data/tracked-instruments";
import {
  formatCalendarDatePart,
  formatMarketTime,
  formatNumber,
} from "~/formatting";
import { NumberText } from "~/number-text";
import { m } from "~/paraglide/messages.js";
import { beta } from "~/units/beta";
import { cumulativeReturn } from "~/units/cumulative-return";
import { homeMapPoints } from "./home-map-points";
import { HomeMapTable } from "./home-map-table";
import type { HomeMapView } from "./parse-home-map-view";
import { portfolioLabel } from "./portfolio-label";
import { PortfolioReturnChart } from "./portfolio-return-chart";
import type { HomePortfolioData } from "./read-home-portfolio.server";
import { historyEndText, missingCalendarText } from "./return-section";
import {
  portfolioKindForReader,
  portfolioStudentName,
  readerWithTextName,
  textForReader,
} from "./text-for-reader";
import type { PortfolioReader } from "./text-for-reader";
import styles from "./home-portfolio.module.css";

interface HomeMapContentProps {
  home: HomePortfolioData;
  classId: ClassId;
  reader: PortfolioReader;
  view: HomeMapView;
  welcome: boolean;
}

export function HomeMapContent(properties: HomeMapContentProps): ReactNode {
  switch (properties.view) {
    case "map":
      return <HomeMapDrawing {...properties} />;
    case "time":
      return <HomeTimePlot home={properties.home} reader={properties.reader} />;
  }
}

function mapLegend(
  home: HomePortfolioData,
  reader: PortfolioReader,
  welcome: boolean,
): RiskMapLegendItem[] {
  const items: RiskMapLegendItem[] = [];
  if (!welcome)
    items.push(
      { kind: "own", name: portfolioLabel(portfolioStudentName(reader)) },
      {
        kind: "held",
        name: textForReader(reader, {
          owner: m.trading_home_holdings_key_label,
          lecturer: (name) => m.trading_home_student_holdings_label({ name }),
        }),
      },
    );
  items.push({ kind: "market", name: marketIndex.code });
  if (!welcome || home.classmates.length > 0)
    items.push({
      kind: "classmate",
      name: {
        membership: m.trading_home_classmates_label,
        demonstration: m.trading_demonstration_students_label,
      }[portfolioKindForReader(reader)](),
    });
  return items;
}

function HomeMapDrawing({
  home,
  reader,
  classId,
  welcome,
}: Omit<HomeMapContentProps, "view">): ReactNode {
  const map = homeMapPoints(home, reader);
  const history = home.report.history;
  const first = history.ok ? history.value.points[0] : undefined;
  const market = home.report.market;
  return (
    <>
      <RiskMapLegend items={mapLegend(home, reader, welcome)} />
      {first !== undefined && (
        <p className={styles["note"]}>
          <NumberText>
            {(welcome
              ? m.trading_welcome_map_basis_notice
              : m.trading_home_map_basis_notice)({
              date: formatCalendarDatePart(first.date, "dayAndMonth"),
            })}
          </NumberText>
        </p>
      )}
      {map === undefined ? (
        <p className={styles["empty"]}>
          <NumberText>
            {(textValue) =>
              homeChartFailure(
                { ...home, view: "map" },
                readerWithTextName(reader, textValue),
              )
            }
          </NumberText>
        </p>
      ) : (
        <>
          <div className={styles["largeMap"]}>
            <RiskMap
              {...map}
              compact={welcome}
              across={{
                style: "decimal",
                toValue: beta,
                title: m.trading_home_map_axis_label({ beta: formatNumber(1) }),
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
            {(welcome
              ? m.trading_welcome_prices_notice
              : m.trading_home_map_prices_notice)({
              index: marketIndex.code,
              time: formatMarketTime(market.quote.quotedAt),
            })}
          </NumberText>
          {home.report.quoteAttempt?.failedCodes.includes(marketIndex.code) ===
            true && <> {m.trading_home_quote_failed_notice()}</>}
        </p>
      )}
    </>
  );
}

function HomeTimePlot({
  home,
  reader,
}: Pick<HomeMapContentProps, "home" | "reader">): ReactNode {
  const history = home.report.history;
  return (
    <div className={styles["largeTime"]}>
      {history.ok && history.value.points.length > 0 ? (
        <PortfolioReturnChart
          points={history.value.points}
          studentName={portfolioStudentName(reader)}
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
          <NumberText>
            {(textValue) =>
              homeChartFailure(
                { ...home, view: "time" },
                readerWithTextName(reader, textValue),
              )
            }
          </NumberText>
        </p>
      )}
    </div>
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
