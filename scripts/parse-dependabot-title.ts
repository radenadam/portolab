import { fail, succeed } from "../app/result.ts";
import type { Result } from "../app/result.ts";
import { describeValue } from "../app/value-shapes.ts";

/** Reads the title of a pull request by Dependabot and writes it in the style of the history, as the subject of its squash commit. The subject starts in lowercase, because Dependabot writes "Bump" with a capital, and the phrase "across 1 directory" goes, because every ecosystem of this repository has one directory. */
export function parseDependabotTitle(
  value: unknown,
  source: string,
): Result<string, string> {
  const match =
    typeof value === "string"
      ? /^([a-z]+(?:\([a-z-]+\))?): (\S)(.*)$/.exec(value)
      : null;
  if (match === null) {
    return fail(
      `${source} must be a title of Dependabot with a type, such as "chore(deps): Bump vitest from 5.0.5 to 5.1.0", but it is ${describeValue(value)}.`,
    );
  }
  const [, prefix = "", first = "", rest = ""] = match;
  return succeed(
    `${prefix}: ${first.toLowerCase()}${rest.replace(" across 1 directory", "")}`,
  );
}
