import type { Role } from "~/features/accounts/accounts.schema";
import type { ClassId } from "~/features/classes/classes.schema";
import { measuresPath } from "~/features/measures/measures-path";
import { studentPageAt } from "~/features/grading/grading-paths";
import type { StudentPage } from "~/features/grading/grading-paths";
import { m } from "~/paraglide/messages.js";
import { returnDestination } from "~/return-destination.server";
import { marketPath } from "./market-path";

/** The stock route serves both roles, so a forged return must not select a page of another role. */
export function stockReturnDestination({
  classId,
  role,
  url,
  request,
}: {
  classId: ClassId;
  role: Role;
  url: URL;
  request: Request;
}) {
  const destination = new URL(
    returnDestination(url.searchParams.get("returnTo"), request),
    url,
  );
  const analysis =
    destination.pathname === measuresPath(classId) && role === "student";
  const studentPage =
    role === "lecturer"
      ? studentPageAt(classId, destination.pathname)
      : undefined;
  const returnTo =
    destination.pathname === marketPath(classId) ||
    analysis ||
    studentPage !== undefined
      ? `${destination.pathname}${destination.search}${destination.hash}`
      : undefined;
  return {
    returnTo,
    returnPath: returnTo ?? marketPath(classId),
    returnLabel:
      studentPage === undefined
        ? analysis
          ? m.market_data_back_to_analysis_link()
          : m.market_data_back_to_market_link()
        : studentReturnLabels[studentPage](),
  };
}

const studentReturnLabels: Record<StudentPage, () => string> = {
  portfolio: m.market_data_back_to_student_summary_link,
  measures: m.market_data_back_to_student_analysis_link,
  journal: m.market_data_back_to_student_journal_link,
};
