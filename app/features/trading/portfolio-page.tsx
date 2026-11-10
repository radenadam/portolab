import type { ReactNode } from "react";
import { Link } from "react-router";
import { databaseContext } from "~/database/database.server";
import { classPath } from "~/features/classes/class-path";
import type { ClassId } from "~/features/classes/classes.schema";
import type { PriceSourceDescription } from "~/features/market-data/price-source.server";
import { measuresPath } from "~/features/measures/measures-path";
import { pageTitle } from "~/page-title";
import { m } from "~/paraglide/messages.js";
import type { Route } from "./+types/portfolio-page";
import { ordersPath } from "./orders-path";
import { readPortfolioReport } from "./read-portfolio-report.server";
import type { PortfolioReport } from "./read-portfolio-report.server";
import { PortfolioView } from "./portfolio-view";
import { readStudentPortfolio } from "./read-student-portfolio.server";
import styles from "./trading.module.css";

export function meta({ loaderData }: Route.MetaArgs): Route.MetaDescriptors {
  return [
    {
      title: pageTitle(
        m.trading_portfolio_page_title({ class: loaderData.className }),
      ),
    },
  ];
}

export function loader({ context, request, params, url }: Route.LoaderArgs): {
  classId: ClassId;
  className: string;
  report: PortfolioReport;
  now: Date;
  source: PriceSourceDescription;
} {
  const now = new Date();
  const { place, portfolio, source } = readStudentPortfolio(context, {
    request,
    url,
    classId: params.classId,
    now,
  });
  return {
    classId: place.classId,
    className: place.className,
    report: readPortfolioReport(
      context.get(databaseContext),
      {
        portfolio,
        startingCash: place.owner.startingCash,
        joinedAt: place.joinedAt,
      },
      { now, delayMinutes: source.delayMinutes },
    ),
    now,
    source,
  };
}

export default function PortfolioPage({
  loaderData,
}: Route.ComponentProps): ReactNode {
  return (
    <>
      <h1>{m.trading_portfolio_page_title({ class: loaderData.className })}</h1>
      <Link to={classPath(loaderData.classId)} className={styles["link"]}>
        {m.trading_back_link({ class: loaderData.className })}
      </Link>
      <Link to={ordersPath(loaderData.classId)} className={styles["link"]}>
        {m.trading_orders_link()}
      </Link>
      <Link to={measuresPath(loaderData.classId)} className={styles["link"]}>
        {m.trading_measures_link()}
      </Link>
      <PortfolioView
        report={loaderData.report}
        now={loaderData.now}
        source={loaderData.source}
      />
    </>
  );
}
