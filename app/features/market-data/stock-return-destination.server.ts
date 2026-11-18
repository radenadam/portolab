import type { PortfolioKind } from "~/features/trading/portfolio-store.server";
import type { ClassId } from "~/features/classes/classes.schema";
import { measuresPath } from "~/features/measures/measures-path";
import { studentPageAt } from "~/features/grading/grading-paths";
import type { StudentPage } from "~/features/grading/grading-paths";
import { m } from "~/paraglide/messages.js";
import { returnDestination } from "~/return-destination.server";
import { marketPath } from "./market-path";
import { marketRowId } from "./market-row-id";

/** The stock route serves both roles, so a forged return must not select a page of another role. */
export function stockReturnDestination({
  classId,
  portfolioKind,
  url,
  request,
  code,
  watched,
}: {
  classId: ClassId;
  portfolioKind: PortfolioKind;
  url: URL;
  request: Request;
  code: string;
  watched: boolean;
}) {
  const destination = new URL(
    returnDestination(url.searchParams.get("returnTo"), request),
    url,
  );
  const analysis =
    destination.pathname === measuresPath(classId, portfolioKind);
  // Removing a star removes its watched row, so the full list becomes the remaining source row.
  if (
    destination.pathname === marketPath(classId) &&
    !watched &&
    destination.hash === `#${marketRowId("watched-stock", code)}`
  )
    destination.hash = `#${marketRowId("stock", code)}`;
  const studentPage =
    portfolioKind === "demonstration"
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
