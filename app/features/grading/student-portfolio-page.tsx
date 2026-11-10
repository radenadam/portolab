import type { ReactNode } from "react";
import { databaseContext } from "~/database/database.server";
import type { PriceSourceDescription } from "~/features/market-data/price-source.server";
import { PortfolioView } from "~/features/trading/portfolio-view";
import { readPortfolioReport } from "~/features/trading/read-portfolio-report.server";
import type { PortfolioReport } from "~/features/trading/read-portfolio-report.server";
import type { Route } from "./+types/student-portfolio-page";
import { readTaughtPortfolio } from "./read-taught-portfolio.server";
import { TaughtStudentHeading, taughtStudentMeta } from "./taught-student-page";
import type { TaughtStudent } from "./taught-student-page";

export function meta({ loaderData }: Route.MetaArgs): Route.MetaDescriptors {
  return taughtStudentMeta("portfolio", loaderData.student);
}

export function loader({ context, request, params, url }: Route.LoaderArgs): {
  student: TaughtStudent;
  report: PortfolioReport;
  now: Date;
  source: PriceSourceDescription;
} {
  const now = new Date();
  const { student, portfolio, startingCash, joinedAt, source } =
    readTaughtPortfolio(context, { request, url, params, now });
  return {
    student,
    report: readPortfolioReport(
      context.get(databaseContext),
      { portfolio, startingCash, joinedAt },
      { now, delayMinutes: source.delayMinutes },
    ),
    now,
    source,
  };
}

export default function StudentPortfolioPage({
  loaderData,
}: Route.ComponentProps): ReactNode {
  const { student } = loaderData;
  return (
    <>
      <TaughtStudentHeading page="portfolio" student={student} />
      <PortfolioView
        report={loaderData.report}
        reader={{ kind: "lecturer", studentName: student.name }}
        now={loaderData.now}
        source={loaderData.source}
      />
    </>
  );
}
