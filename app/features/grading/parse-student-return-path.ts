import { classPath } from "~/features/classes/class-path";
import type { ClassId } from "~/features/classes/classes.schema";
import { parseReturnPath } from "~/parse-return-path";
import type { Result } from "~/result";
import { classPortfoliosPath } from "./grading-paths";

export function parseStudentReturnPath(
  value: unknown,
  source: string,
  { origin, classId }: { origin: string; classId: ClassId },
): Result<string, string> {
  return parseReturnPath(value, source, {
    origin,
    allowedPaths: [classPortfoliosPath(classId), classPath(classId)],
  });
}
