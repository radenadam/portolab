import type { UserId } from "~/features/accounts/accounts.schema";
import { classPath } from "~/features/classes/class-path";
import type { ClassId } from "~/features/classes/classes.schema";

/** The address of the portfolios of every student of a class, which only the lecturer of the class opens. */
export function classPortfoliosPath(classId: ClassId): string {
  return `${classPath(classId)}/portfolios`;
}

/** The address of the workbook that holds the portfolios of every student of a class. */
export function portfoliosWorkbookPath(classId: ClassId): string {
  return `${classPortfoliosPath(classId)}/export`;
}

/** The address of the portfolio of one student of a class, as the lecturer of the class reads it. */
export function studentPortfolioPath(
  classId: ClassId,
  studentId: UserId,
): string {
  return `${classPath(classId)}/students/${String(studentId)}/portfolio`;
}

/** The address of the measures of the portfolio of one student of a class, as the lecturer of the class reads them. */
export function studentMeasuresPath(
  classId: ClassId,
  studentId: UserId,
): string {
  return `${classPath(classId)}/students/${String(studentId)}/measures`;
}
