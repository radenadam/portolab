import type { UserId } from "~/features/accounts/accounts.schema";
import { classPath } from "~/features/classes/class-path";
import type { ClassId } from "~/features/classes/classes.schema";
import { parseReturnPath } from "~/parse-return-path";
import type { Result } from "~/result";
import {
  classPortfoliosPath,
  studentPagePaths,
  studentPages,
} from "./grading-paths";

/** Reads where a page about a student of a class sends the lecturer back to: Mahasiswa or Kelas of the class, or, when the page names the student, one of the pages of that student, from which the page opened. */
export function parseStudentReturnPath(
  value: unknown,
  source: string,
  {
    origin,
    classId,
    studentId,
  }: { origin: string; classId: ClassId; studentId?: UserId },
): Result<string, string> {
  return parseReturnPath(value, source, {
    origin,
    allowedPaths: [
      classPortfoliosPath(classId),
      classPath(classId),
      ...(studentId === undefined
        ? []
        : studentPages.map((page) =>
            studentPagePaths[page](classId, studentId),
          )),
    ],
  });
}
