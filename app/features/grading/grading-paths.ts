import type { UserId } from "~/features/accounts/accounts.schema";
import { classPath } from "~/features/classes/class-path";
import type { ClassId } from "~/features/classes/classes.schema";
import { parseRecordId } from "~/value-parsers";

export const studentPages = ["portfolio", "measures", "journal"] as const;
export type StudentPage = (typeof studentPages)[number];

/** The address of the portfolios of every student of a class, which only the lecturer of the class opens. */
export function classPortfoliosPath(classId: ClassId): string {
  return `${classPath(classId)}/students`;
}

/** The address of the workbook that holds the portfolios of every student of a class. */
export function portfoliosWorkbookPath(classId: ClassId): string {
  return `${classPath(classId)}/workbook`;
}

/** The address of the portfolio of one student of a class, as the lecturer of the class reads it. */
export function studentPortfolioPath(
  classId: ClassId,
  studentId: UserId,
): string {
  return `${classPortfoliosPath(classId)}/${String(studentId)}`;
}

/** The address of the measures of the portfolio of one student of a class, as the lecturer of the class reads them. */
export function studentMeasuresPath(
  classId: ClassId,
  studentId: UserId,
): string {
  return `${studentPortfolioPath(classId, studentId)}/analysis`;
}

export function studentJournalPath(
  classId: ClassId,
  studentId: UserId,
): string {
  return `${studentPortfolioPath(classId, studentId)}/journal`;
}

export const studentPagePaths: Record<
  StudentPage,
  typeof studentPortfolioPath
> = {
  portfolio: studentPortfolioPath,
  measures: studentMeasuresPath,
  journal: studentJournalPath,
};

export function studentPageAt(
  classId: ClassId,
  pathname: string,
): StudentPage | undefined {
  const prefix = `${classPortfoliosPath(classId)}/`;
  if (!pathname.startsWith(prefix)) return undefined;
  const studentId = parseRecordId<UserId>(
    pathname.slice(prefix.length).split("/")[0],
    "returnTo student",
  );
  if (!studentId.ok) return undefined;
  return studentPages.find(
    (page) => studentPagePaths[page](classId, studentId.value) === pathname,
  );
}
