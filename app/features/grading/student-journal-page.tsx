import type { ReactNode } from "react";
import { data } from "react-router";
import { ActivityView } from "~/features/trading/activity-view";
import { readActivity } from "~/features/trading/read-activity.server";
import { pathReturningTo } from "~/features/accounts/path-returning-to";
import type { Route } from "./+types/student-journal-page";
import { studentJournalPath } from "./grading-paths";
import { readTaughtPortfolio } from "./read-taught-portfolio.server";
import { TaughtStudentPage, taughtStudentMeta } from "./taught-student-page";

export const meta = taughtStudentMeta("journal");

export function loader({ context, request, params, url }: Route.LoaderArgs) {
  const now = new Date();
  const { student, returnPath, portfolio } = readTaughtPortfolio(context, {
    request,
    url,
    params,
    now,
  });
  const activity = readActivity(context, { url, portfolio, now });
  return data(
    { student, returnPath, ...activity },
    { status: activity.status },
  );
}
export default function StudentJournalPage({
  loaderData,
}: Route.ComponentProps): ReactNode {
  const { student, returnPath } = loaderData;
  return (
    <TaughtStudentPage page="journal" student={student} returnPath={returnPath}>
      <ActivityView
        {...loaderData}
        classId={student.classId}
        studentName={student.name}
        readOnly
        base={pathReturningTo(
          studentJournalPath(student.classId, student.studentId),
          returnPath,
        )}
      />
    </TaughtStudentPage>
  );
}
