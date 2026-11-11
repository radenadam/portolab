import type { ReactNode } from "react";
import { data, Link } from "react-router";
import { databaseContext } from "~/database/database.server";
import { classPath } from "~/features/classes/class-path";
import type { ClassId } from "~/features/classes/classes.schema";
import type { PriceSourceDescription } from "~/features/market-data/price-source.server";
import type { StoredMeasureFailure } from "~/features/measures/measure-stored.server";
import { measuresPath } from "~/features/measures/measures-path";
import { PortfolioKeyMeasures } from "~/features/measures/portfolio-key-measures";
import {
  readPortfolioMeasures,
  readStockRows,
  readStudentLine,
} from "~/features/measures/read-measures.server";
import type {
  PortfolioMeasuresReport,
  StudentLine,
} from "~/features/measures/read-measures.server";
import { PageColumns, PageHeader } from "~/frame";
import { pageTitle } from "~/page-title";
import { m } from "~/paraglide/messages.js";
import type { Result } from "~/result";
import type { Route } from "./+types/portfolio-page";
import { ticketAction } from "./order-actions.server";
import { orderTicketStatus, readOrderTicket } from "./order-ticket.server";
import type { OrderTicket } from "./order-ticket.server";
import { PlaceOrderSection } from "./place-order-section";
import { portfolioPath } from "./portfolio-path";
import { portfolioPricesTime, PortfolioView } from "./portfolio-view";
import { readPortfolioReport } from "./read-portfolio-report.server";
import type { PortfolioReport } from "./read-portfolio-report.server";
import { readStudentPortfolio } from "./read-student-portfolio.server";
import { reloadsAfterEveryForm } from "./reloads-after-every-form";
import styles from "./trading.module.css";

/** What the portfolio of a student shows: its value, its return, and its holdings, its key measures against the security market line, and the order ticket, which a desktop shows beside it. */
interface PortfolioPageData {
  classId: ClassId;
  className: string;
  report: PortfolioReport;
  measures: PortfolioMeasuresReport;
  marketLine: Result<StudentLine, StoredMeasureFailure>;
  ticket: OrderTicket;
  now: Date;
  source: PriceSourceDescription;
}

export function meta({ loaderData }: Route.MetaArgs): Route.MetaDescriptors {
  return [
    {
      title: pageTitle(
        m.trading_portfolio_page_title({ class: loaderData.className }),
      ),
    },
  ];
}

export function loader({
  context,
  request,
  params,
  url,
}: Route.LoaderArgs): ReturnType<typeof data<PortfolioPageData>> {
  const now = new Date();
  const { place, portfolio, source } = readStudentPortfolio(context, {
    request,
    url,
    classId: params.classId,
    now,
  });
  const database = context.get(databaseContext);
  const report = readPortfolioReport(
    database,
    {
      portfolio,
      startingCash: place.owner.startingCash,
      joinedAt: place.joinedAt,
    },
    { now, delayMinutes: source.delayMinutes },
  );
  const measures = readPortfolioMeasures(database, report.valuation);
  const ticket = readOrderTicket(database, {
    url,
    now,
    delayMinutes: source.delayMinutes,
  });
  return data<PortfolioPageData>(
    {
      classId: place.classId,
      className: place.className,
      report,
      measures,
      marketLine: readStudentLine(
        database,
        { valuation: report.valuation, report: measures },
        readStockRows(database),
      ),
      ticket,
      now,
      source,
    },
    { status: orderTicketStatus(ticket) },
  );
}

export const shouldRevalidate = reloadsAfterEveryForm;

// The order ticket beside the portfolio sends its order here, and the action answers it as the page of the orders does.
export const action = ticketAction;

export default function PortfolioPage({
  loaderData,
  actionData,
}: Route.ComponentProps): ReactNode {
  const { classId, className, report, now, source } = loaderData;
  return (
    <PageColumns
      header={
        <PageHeader
          path={[{ label: className, path: classPath(classId) }]}
          title={m.trading_portfolio_title()}
          pricesAt={portfolioPricesTime(report)}
        />
      }
      main={
        <>
          <PortfolioView
            report={report}
            reader={{ kind: "owner", classId }}
            now={now}
            source={source}
          />
          <PortfolioKeyMeasures
            classId={classId}
            report={loaderData.measures}
            marketLine={loaderData.marketLine}
          />
          <Link to={measuresPath(classId)} className={styles["link"]}>
            {m.trading_measures_link()}
          </Link>
        </>
      }
      aside={
        <PlaceOrderSection
          ticket={loaderData.ticket}
          pagePath={portfolioPath(classId)}
          moment={{ now, delayMinutes: source.delayMinutes }}
          answer={actionData}
        />
      }
      narrowPlacement="hidden"
    />
  );
}
