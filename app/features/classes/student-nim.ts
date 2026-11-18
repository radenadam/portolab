import { checkMaximumLength, parseOptionalText } from "~/form-text";
import { describeCharacters, includesCharacter } from "~/character-set";
import { formatList, formatNumber } from "~/formatting";
import { m } from "~/paraglide/messages.js";
import { fail, succeed } from "~/result";
import type { Result } from "~/result";
import { nimMaximumLength } from "./nim-maximum-length";

const nimCharacters = {
  ranges: [
    ["A", "Z"],
    ["a", "z"],
    ["0", "9"],
  ],
  symbols: [".", "/", "-"],
} as const;

export function studentNimRule(): { maximum: string; characters: string } {
  return {
    maximum: formatNumber(nimMaximumLength),
    characters: formatList(
      describeCharacters(nimCharacters, (first, last) =>
        m.app_character_range_part({ first, last }),
      ),
      "disjunction",
    ),
  };
}

export function parseStudentNim(
  value: unknown,
  source: string,
): Result<string | null, string> {
  const text = parseOptionalText(value, source);
  if (!text.ok) return text;
  const nim = text.value.trim();
  if (nim === "") return succeed(null);
  const bounded = checkMaximumLength(nim, source, nimMaximumLength);
  if (!bounded.ok) return bounded;
  for (const character of nim) {
    if (!includesCharacter(nimCharacters, character))
      return fail(
        m.classes_nim_format_error({
          field: source,
          value: nim,
          ...studentNimRule(),
        }),
      );
  }
  return succeed(nim);
}
