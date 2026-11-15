import { checkFieldLength } from "~/check-field-length";
import { fail, succeed } from "~/result";
import type { Result } from "~/result";
import { describeChoices, parseChoice } from "~/value-parsers";

import { classMapAxes } from "./class-path";
import type { ClassMapAxis } from "./class-path";
export type { ClassMapAxis } from "./class-path";

/** A link must not invent a risk axis, so the address is checked before the loader values portfolios. */
export function parseClassMapAxis(
  value: unknown,
  source: string,
): Result<ClassMapAxis, string> {
  if (value === null) return succeed("beta");
  if (typeof value === "string") {
    const checked = checkFieldLength(value);
    if (!checked.ok)
      return fail(
        `${source} must be ${describeChoices(classMapAxes)}, but it has ${String(checked.failure)} characters, far more than any field takes.`,
      );
  }
  return parseChoice(value, source, classMapAxes);
}
