import { pathReturningTo } from "~/features/accounts/path-returning-to";
import { m } from "~/paraglide/messages.js";
import { studentPortfolioPath } from "./grading-paths";
import type { ReactNode } from "react";
import { data } from "react-router";
import { databaseContext } from "~/database/database.server";
import { AnalysisView } from "~/features/measures/analysis-view";
import { AnalysisAxisForm } from "~/features/measures/analysis-axis-form";
import {
  readAnalysis,
  readAnalysisAxis,
} from "~/features/measures/read-analysis.server";
import { readPortfolioReport } from "~/features/trading/read-portfolio-report.server";
import type { Route } from "./+types/student-measures-page";
import { readTaughtPortfolio } from "./read-taught-portfolio.server";
import { TaughtStudentPage, taughtStudentMeta } from "./taught-student-page";

export const meta = taughtStudentMeta("measures");

export function loader({ context, request, params, url }: Route.LoaderArgs) {
  const now = new Date();
  const taught = readTaughtPortfolio(context, { request, url, params, now });
  const axisValue = url.searchParams.get("axis");
  const axis = readAnalysisAxis(url);
  const common = { student: taught.student, returnPath: taught.returnPath };
  if (!axis.ok)
    return data(
      {
        ...common,
        kind: "axisFailure" as const,
        value: axisValue ?? "",
        failure: axis.failure,
      },
      { status: 400 },
    );
  const database = context.get(databaseContext);
  const report = readPortfolioReport(database, taught, {
    now,
    delayMinutes: taught.source.delayMinutes,
  });
  return {
    ...common,
    kind: "analysis" as const,
    classId: taught.student.classId,
    report,
    ...readAnalysis(database, report),
    axis: axis.value,
    now,
    source: taught.source,
    firstSessionDate: taught.firstSessionDate,
  };
}

export default function StudentMeasuresPage({
  loaderData,
}: Route.ComponentProps): ReactNode {
  const { student, returnPath } = loaderData;
  return (
    <TaughtStudentPage
      page="measures"
      student={student}
      returnPath={returnPath}
    >
      {loaderData.kind === "axisFailure" ? (
        <AnalysisAxisForm {...loaderData} returnPath={returnPath} />
      ) : (
        <AnalysisView
          {...loaderData}
          reader={{ kind: "lecturer", studentName: student.shortName }}
          summary={{
            path: pathReturningTo(
              studentPortfolioPath(student.classId, student.studentId),
              returnPath,
            ),
            label: m.grading_summary_label(),
          }}
        />
      )}
    </TaughtStudentPage>
  );
}
