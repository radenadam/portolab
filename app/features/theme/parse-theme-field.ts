import { characterCount } from "~/character-count";
import { checkFieldLengthForReader } from "~/form-text";
import { formatList, formatNumber } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { fail } from "~/result";
import type { Result } from "~/result";
import { typeName } from "~/value-shapes";
import { parseTheme } from "./parse-theme";
import { themes } from "./theme";
import { themeName } from "./theme-name";
import type { Theme } from "./theme";

const themeValueMaximumLength = Math.max(
  ...themes.map((theme) => theme.length),
);

export function parseThemeField(
  value: unknown,
  source: string,
): Result<Theme, string> {
  const choices = formatList(themes.map(themeName), "disjunction");
  if (typeof value !== "string") {
    return fail(
      value === null || value === undefined
        ? m.theme_missing_error({ field: source, choices })
        : m.theme_not_text_error({
            field: source,
            type: typeName(value),
            choices,
          }),
    );
  }
  const text = checkFieldLengthForReader(value, source);
  if (!text.ok) return text;
  const choice = text.value.trim();
  return parseTheme(choice, source, () => {
    const length = characterCount(choice);
    return length > themeValueMaximumLength
      ? m.theme_long_error({
          field: source,
          length: formatNumber(length),
          choices,
        })
      : m.theme_unknown_error({ field: source, value: choice, choices });
  });
}
