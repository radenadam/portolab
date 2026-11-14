import { marketBeta } from "~/units/beta";
import { formatBeta } from "~/formatting";
import { marketIndex } from "~/features/market-data/tracked-instruments";
import { m } from "~/paraglide/messages.js";
import type {
  RankedStudent,
  UnmeasuredStudent,
} from "./read-class-portfolios.server";

export const studentFilters = [
  "all",
  "below-market",
  "inactive",
  "high-beta",
  "no-stocks",
] as const;
export type StudentFilter = (typeof studentFilters)[number];
export type ComparedStudent = RankedStudent | UnmeasuredStudent;

export function studentFilterLabel(filter: StudentFilter): string {
  const labels: Record<StudentFilter, () => string> = {
    all: m.grading_all_label,
    "below-market": () =>
      m.grading_below_market_label({ index: marketIndex.code }),
    inactive: m.grading_inactive_label,
    "high-beta": () =>
      m.grading_high_beta_label({ beta: formatBeta(marketBeta) }),
    "no-stocks": m.grading_no_stocks_label,
  };
  return labels[filter]();
}

export function matchesStudentFilter(
  student: ComparedStudent,
  filter: StudentFilter,
): boolean {
  switch (filter) {
    case "all":
      return true;
    case "below-market":
      return (
        student.total !== undefined &&
        student.marketReturn !== undefined &&
        student.total.return < student.marketReturn
      );
    case "inactive":
      return !student.activeThisWeek;
    case "high-beta":
      return "measures" in student && student.measures.beta > marketBeta;
    case "no-stocks":
      return !student.hasHoldings;
  }
}

export function filterStudents(
  students: readonly ComparedStudent[],
  options: { filter: StudentFilter; query: string },
): ComparedStudent[] {
  const query = options.query.trim().toLocaleLowerCase();
  return students.filter(
    (student) =>
      matchesStudentFilter(student, options.filter) &&
      (student.name.toLocaleLowerCase().includes(query) ||
        student.username.toLocaleLowerCase().includes(query)),
  );
}
