import { checkFieldLength } from "~/check-field-length";
import { fail } from "~/result";
import type { Result } from "~/result";
import { parseChoice } from "~/value-parsers";

export function parseRankingControl<Choice extends string>(
  value: unknown,
  source: string,
  choices: readonly Choice[],
): Result<Choice, string> {
  if (typeof value === "string") {
    const checked = checkFieldLength(value);
    if (!checked.ok)
      return fail(
        `${source} must be a ranking control, but it has ${String(checked.failure)} characters, more than this input takes.`,
      );
  }
  return parseChoice(value, source, choices);
}
