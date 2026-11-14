import type { ClassId } from "~/features/classes/classes.schema";
import { parseReturnPath } from "~/parse-return-path";
import { fail } from "~/result";
import type { Result } from "~/result";
import { describeValue } from "~/value-shapes";
import { classPortfoliosPath } from "./grading-paths";

export function parseStudentReturnPath(
  value: unknown,
  source: string,
  { origin, classId }: { origin: string; classId: ClassId },
): Result<string, string> {
  const parsed = parseReturnPath(value, source, origin);
  if (!parsed.ok) return parsed;
  const path = classPortfoliosPath(classId);
  if (new URL(parsed.value, origin).pathname !== path)
    return fail(
      `${source} must return to ${path}, but it is ${describeValue(parsed.value)}.`,
    );
  return parsed;
}
