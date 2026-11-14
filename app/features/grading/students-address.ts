import type { UserId } from "~/features/accounts/accounts.schema";
import type { ClassId } from "~/features/classes/classes.schema";
import { classPortfoliosPath } from "./grading-paths";
import type { RankingMeasure } from "./ranking-measure";
import type { StudentFilter } from "./student-filters";

export const selectedStudentHeadingId = "selected-student";

export function studentRowId(studentId: UserId): string {
  return `student-${String(studentId)}`;
}

export interface StudentOptions {
  measure: RankingMeasure;
  filter: StudentFilter;
  query: string;
  studentId: UserId | undefined;
}

export function studentsAddress(
  classId: ClassId,
  options: StudentOptions,
): string {
  const search = new URLSearchParams();
  if (options.measure !== "alpha") search.set("measure", options.measure);
  if (options.filter !== "all") search.set("filter", options.filter);
  if (options.query !== "") search.set("q", options.query);
  if (options.studentId !== undefined)
    search.set("student", String(options.studentId));
  const query = search.toString();
  return (
    classPortfoliosPath(classId) +
    (query === "" ? "" : `?${query}`) +
    (options.studentId === undefined ? "" : `#${selectedStudentHeadingId}`)
  );
}
