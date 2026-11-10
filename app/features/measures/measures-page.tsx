import type { ReactNode } from "react";
import { Link } from "react-router";
import { databaseContext } from "~/database/database.server";
import { classPath } from "~/features/classes/class-path";
import type { ClassId } from "~/features/classes/classes.schema";
import type { PriceSourceDescription } from "~/features/market-data/price-source.server";
import { marketIndex } from "~/features/market-data/tracked-instruments";
import { holdingQuoteFailureText } from "~/features/trading/holding-quote-failure-text";
import { ordersPath } from "~/features/trading/orders-path";
import { portfolioPath } from "~/features/trading/portfolio-path";
import { readPortfolioValuation } from "~/features/trading/read-portfolio-report.server";
import type { ValuationReport } from "~/features/trading/read-portfolio-report.server";
import { readStudentPortfolio } from "~/features/trading/read-student-portfolio.server";
import { pageTitle } from "~/page-title";
import { m } from "~/paraglide/messages.js";
import type { Route } from "./+types/measures-page";
import styles from "./measures.module.css";
import { MethodNotice } from "./method-notice";
import { PortfolioMeasuresView } from "./portfolio-measures-view";
import { readPortfolioMeasures, readStockRows } from "./read-measures.server";
import type { PortfolioMeasuresReport, StockRow } from "./read-measures.server";
import { StockTable } from "./stock-table";

export function meta({ loaderData }: Route.MetaArgs): Route.MetaDescriptors {
  return [
    {
      title: pageTitle(m.measures_page_title({ class: loaderData.className })),
    },
  ];
}

export function loader({ context, request, params, url }: Route.LoaderArgs): {
  classId: ClassId;
  className: string;
  valuation: ValuationReport;
  portfolio: PortfolioMeasuresReport;
  stocks: StockRow[];
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
  const database = context.get(databaseContext);
  const valuation = readPortfolioValuation(database, {
    portfolio,
    startingCash: place.owner.startingCash,
  });
  return {
    classId: place.classId,
    className: place.className,
    valuation,
    portfolio: readPortfolioMeasures(database, valuation.valuation),
    stocks: readStockRows(database),
    now,
    source,
  };
}

export default function MeasuresPage({
  loaderData,
}: Route.ComponentProps): ReactNode {
  const { classId, className, source } = loaderData;
  return (
    <>
      <h1>{m.measures_page_title({ class: className })}</h1>
      <Link to={classPath(classId)} className={styles["link"]}>
        {m.measures_back_link({ class: className })}
      </Link>
      <Link to={portfolioPath(classId)} className={styles["link"]}>
        {m.measures_portfolio_link()}
      </Link>
      <Link to={ordersPath(classId)} className={styles["link"]}>
        {m.measures_orders_link()}
      </Link>
      <MethodNotice />
      <h2>{m.measures_portfolio_title()}</h2>
      <PortfolioMeasuresView
        classId={classId}
        report={loaderData.portfolio}
        quoteFailure={holdingQuoteFailureText(loaderData.valuation, {
          now: loaderData.now,
          delayMinutes: source.delayMinutes,
        })}
        source={source}
      />
      <h2>{m.measures_stocks_title()}</h2>
      <p>{m.measures_stocks_notice({ index: marketIndex.code })}</p>
      <StockTable classId={classId} stocks={loaderData.stocks} />
    </>
  );
}
