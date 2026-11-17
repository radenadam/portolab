import { characterCount } from "~/character-count";
import { fieldMaximumLength } from "~/form-size";
import { fail, succeed } from "~/result";
import type { Result } from "~/result";
import { describeValue } from "~/value-shapes";
import { themes } from "./theme";
import type { Theme } from "./theme";

export function parseTheme(
  value: unknown,
  source: string,
  describeFailure: (
    value: unknown,
    source: string,
  ) => string = describeThemeFailure,
): Result<Theme, string> {
  for (const theme of themes) {
    if (value === theme) return succeed(theme);
  }
  return fail(describeFailure(value, source));
}

function describeThemeFailure(value: unknown, source: string): string {
  const actual =
    typeof value === "string" && value.length > fieldMaximumLength
      ? `text with ${String(characterCount(value))} characters`
      : describeValue(value);
  return `${source} must be one of ${describeValue(themes)}, but it is ${actual}.`;
}
