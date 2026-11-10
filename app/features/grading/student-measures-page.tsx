import type { ReactNode } from "react";
import { databaseContext } from "~/database/database.server";
import type { PriceSourceDescription } from "~/features/market-data/price-source.server";
import { LecturerMarketLine } from "~/features/measures/market-line-section";
import { MethodNotice } from "~/features/measures/method-notice";
import { PortfolioMeasuresView } from "~/features/measures/portfolio-measures-view";
import {
  readPortfolioLine,
  readPortfolioMeasures,
} from "~/features/measures/read-measures.server";
import type {
  PortfolioLine,
  PortfolioMeasuresReport,
} from "~/features/measures/read-measures.server";
import { holdingQuoteFailureText } from "~/features/trading/holding-quote-failure-text";
import { readPortfolioValuation } from "~/features/trading/read-portfolio-report.server";
import type { ValuationReport } from "~/features/trading/read-portfolio-report.server";
import { m } from "~/paraglide/messages.js";
import type { Route } from "./+types/student-measures-page";
import { readTaughtPortfolio } from "./read-taught-portfolio.server";
import { TaughtStudentHeading, taughtStudentMeta } from "./taught-student-page";
import type { TaughtStudent } from "./taught-student-page";

export function meta({ loaderData }: Route.MetaArgs): Route.MetaDescriptors {
  return taughtStudentMeta("measures", loaderData.student);
}

export function loader({ context, request, params, url }: Route.LoaderArgs): {
  student: TaughtStudent;
  valuation: ValuationReport;
  portfolio: PortfolioMeasuresReport;
  marketLine: PortfolioLine | undefined;
  now: Date;
  source: PriceSourceDescription;
} {
  const now = new Date();
  const { student, portfolio, startingCash, source } = readTaughtPortfolio(
    context,
    { request, url, params, now },
  );
  const database = context.get(databaseContext);
  const valuation = readPortfolioValuation(database, {
    portfolio,
    startingCash,
  });
  const portfolioMeasures = readPortfolioMeasures(
    database,
    valuation.valuation,
  );
  return {
    student,
    valuation,
    portfolio: portfolioMeasures,
    marketLine: readPortfolioLine(portfolioMeasures),
    now,
    source,
  };
}

export default function StudentMeasuresPage({
  loaderData,
}: Route.ComponentProps): ReactNode {
  const { student, source, marketLine } = loaderData;
  return (
    <>
      <TaughtStudentHeading page="measures" student={student} />
      <MethodNotice />
      <h2>{m.grading_measures_title()}</h2>
      <PortfolioMeasuresView
        report={loaderData.portfolio}
        reader={{ kind: "lecturer", studentName: student.name }}
        quoteFailure={holdingQuoteFailureText([loaderData.valuation], {
          now: loaderData.now,
          delayMinutes: source.delayMinutes,
        })}
        source={source}
      />
      {/* A portfolio without measures has no line of its months, and the text above says why it has no measures. */}
      {marketLine !== undefined && (
        <LecturerMarketLine
          studentName={student.name}
          portfolioLine={marketLine}
        />
      )}
    </>
  );
}
