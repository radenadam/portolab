import { checkFieldLengthForReader } from "~/form-text";
import { m } from "~/paraglide/messages.js";
import { fail } from "~/result";
import type { Result } from "~/result";
import { typeName } from "~/value-shapes";

export function parseStudentSearch(
  value: unknown,
  source: string,
): Result<string, string> {
  if (typeof value !== "string")
    return fail(m.app_not_text_error({ field: source, type: typeName(value) }));
  return checkFieldLengthForReader(value, source, "field");
}
